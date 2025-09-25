import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  isAdmin?: boolean
}

interface AuthCredentials {
  email: string
  password: string
}

interface AuthActionResult {
  success: boolean
  message?: string
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  login: (credentials: AuthCredentials) => AuthActionResult
  register: (credentials: AuthCredentials) => AuthActionResult
  logout: () => void
}

interface StoredAccount {
  id: string
  email: string
  password: string
}

const USER_STORAGE_KEY = 'user'
const ACCOUNT_STORAGE_KEY = 'testAccounts'
const MIN_PASSWORD_LENGTH = 6

const sanitizeEmail = (email: string) => email.trim().toLowerCase()

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.error('Failed to parse JSON from storage:', error)
    return null
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accounts, setAccounts] = useState<StoredAccount[]>([])

  useEffect(() => {
    const savedUser = parseJson<User>(localStorage.getItem(USER_STORAGE_KEY))
    if (savedUser?.email) {
      setUser({ id: savedUser.id, email: savedUser.email, isAdmin: savedUser.isAdmin })
    } else if (savedUser) {
      localStorage.removeItem(USER_STORAGE_KEY)
    }

    const storedAccounts = parseJson<StoredAccount[]>(localStorage.getItem(ACCOUNT_STORAGE_KEY))
    if (Array.isArray(storedAccounts)) {
      setAccounts(storedAccounts.filter((account) => account.email))
    } else if (storedAccounts) {
      localStorage.removeItem(ACCOUNT_STORAGE_KEY)
    }
  }, [])

  const persistUser = (account: User | null) => {
    if (account) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(account))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }

  const persistAccounts = (nextAccounts: StoredAccount[]) => {
    setAccounts(nextAccounts)
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(nextAccounts))
  }

  const register = (credentials: AuthCredentials): AuthActionResult => {
    const email = sanitizeEmail(credentials.email)
    const password = credentials.password.trim()

    if (!email || !password) {
      return { success: false, message: 'Email and password are required.' }
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return { success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
    }

    if (accounts.some((account) => account.email === email)) {
      return { success: false, message: 'An account with this email already exists.' }
    }

    const newAccount: StoredAccount = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      email,
      password
    }

    persistAccounts([...accounts, newAccount])
    return { success: true, message: 'Account created. You can now log in.' }
  }

  const login = (credentials: AuthCredentials): AuthActionResult => {
    const email = sanitizeEmail(credentials.email)
    const password = credentials.password.trim()

    if (!email || !password) {
      return { success: false, message: 'Email and password are required.' }
    }

    const account = accounts.find((stored) => stored.email === email)
    if (!account) {
      return { success: false, message: 'No account found for this email.' }
    }

    if (account.password !== password) {
      return { success: false, message: 'Incorrect password.' }
    }

    const userData: User = { id: account.id, email: account.email }
    setUser(userData)
    persistUser(userData)
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    persistUser(null)
  }

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    login,
    register,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
