import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  completeAuthCallback,
  fetchAuthMe,
  fetchAuthProviders,
  refreshAuthTokens,
  startAuthRedirect,
  type AuthCallbackSuccess,
  type AuthMeResponse,
  type AuthProviderDescriptor
} from '../api/auth'

const SUPPORTED_SOCIAL_PROVIDERS = ['google', 'apple'] as const

type SocialProvider = (typeof SUPPORTED_SOCIAL_PROVIDERS)[number]

type ProviderLabelMap = Record<SocialProvider, string>

const PROVIDER_LABELS: ProviderLabelMap = {
  google: 'Google',
  apple: 'Apple'
}

interface User {
  id: string
  email: string | null
  provider?: SocialProvider | 'local'
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
  loginWithProvider: (provider: SocialProvider) => Promise<AuthActionResult>
  logout: () => void
  availableProviders: SocialProvider[]
  localAuthEnabled: boolean
}

interface StoredAccount {
  id: string
  email: string
  password: string
}

interface StoredTokens {
  access: string
  refresh: string | null
  accessExpiresAt?: number
  refreshExpiresAt?: number
  legacyToken?: string | null
  provider?: string | null
}

const USER_STORAGE_KEY = 'user'
const ACCOUNT_STORAGE_KEY = 'testAccounts'
const TOKEN_STORAGE_KEY = 'authTokens'
const MIN_PASSWORD_LENGTH = 6

const LOCAL_AUTH_ENABLED = (() => {
  const env = import.meta.env ?? {}
  const rawFlag = env.VITE_ENABLE_LOCAL_AUTH ?? env.VITE_QA_ENABLE_LOCAL_AUTH ?? env.VITE_QA_LOCAL_AUTH ?? '0'
  return rawFlag === '1' || rawFlag === 1 || rawFlag === true || rawFlag === 'true'
})()

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

const filterSupportedProviders = (providers: AuthProviderDescriptor[]): SocialProvider[] => {
  const supported = new Set(SUPPORTED_SOCIAL_PROVIDERS)
  return providers
    .map((descriptor) => descriptor.provider)
    .filter((candidate): candidate is SocialProvider => supported.has(candidate as SocialProvider))
}

const buildStoredTokens = (payload: AuthCallbackSuccess | AuthRefreshResponse): StoredTokens => {
  const now = Date.now()
  const accessExpires = 'access_expires_in' in payload && typeof payload.access_expires_in === 'number'
    ? now + payload.access_expires_in * 1000
    : undefined
  const refreshExpires = payload.refresh && 'refresh_expires_in' in payload && typeof payload.refresh_expires_in === 'number'
    ? now + payload.refresh_expires_in * 1000
    : undefined

  return {
    access: payload.access,
    refresh: payload.refresh ?? null,
    accessExpiresAt: accessExpires,
    refreshExpiresAt: refreshExpires,
    legacyToken: 'legacyToken' in payload ? payload.legacyToken ?? null : null,
    provider: 'provider' in payload ? payload.provider : undefined
  }
}

const resolvePrimaryProvider = (response: AuthMeResponse): SocialProvider | 'local' => {
  const preferred = response.user.provider
  if (preferred && SUPPORTED_SOCIAL_PROVIDERS.includes(preferred as SocialProvider)) {
    return preferred as SocialProvider
  }

  const identities = response.user.identities ?? []
  const match = identities.find((identity) => SUPPORTED_SOCIAL_PROVIDERS.includes(identity.provider as SocialProvider))
  if (match) {
    return match.provider as SocialProvider
  }

  return 'local'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export type { SocialProvider }

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
  const [availableProviders, setAvailableProviders] = useState<SocialProvider[]>([...SUPPORTED_SOCIAL_PROVIDERS])
  const [tokens, setTokens] = useState<StoredTokens | null>(null)

  const persistUser = (account: User | null) => {
    if (account) {
      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify({
          id: account.id,
          email: account.email,
          provider: account.provider ?? 'local',
          isAdmin: account.isAdmin ?? false
        })
      )
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }

  const persistAccounts = (nextAccounts: StoredAccount[]) => {
    setAccounts(nextAccounts)
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(nextAccounts))
  }

  const persistTokens = (nextTokens: StoredTokens | null) => {
    setTokens(nextTokens)
    if (nextTokens) {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(nextTokens))
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  }

  const syncUserFromTokens = async (tokenState: StoredTokens | null, silent = false) => {
    if (!tokenState?.access) {
      return false
    }

    try {
      const response = await fetchAuthMe(tokenState.access)
      const resolvedProvider = resolvePrimaryProvider(response)
      const nextUser: User = {
        id: String(response.user.id),
        email: response.user.email ?? null,
        provider: resolvedProvider,
        isAdmin: response.user.role === 'admin'
      }
      setUser(nextUser)
      persistUser(nextUser)
      return true
    } catch (error) {
      if (!silent) {
        console.warn('Failed to refresh authenticated user state:', error)
      }
      setUser(null)
      persistUser(null)
      persistTokens(null)
      return false
    }
  }

  useEffect(() => {
    const savedUser = parseJson<User>(localStorage.getItem(USER_STORAGE_KEY))
    if (savedUser) {
      setUser({
        id: savedUser.id,
        email: savedUser.email ?? null,
        provider: (savedUser.provider as SocialProvider | 'local') ?? 'local',
        isAdmin: savedUser.isAdmin
      })
    }

    const storedAccounts = parseJson<StoredAccount[]>(localStorage.getItem(ACCOUNT_STORAGE_KEY))
    if (Array.isArray(storedAccounts)) {
      setAccounts(storedAccounts.filter((account) => account.email))
    }

    const storedTokens = parseJson<StoredTokens>(localStorage.getItem(TOKEN_STORAGE_KEY))
    if (storedTokens && storedTokens.access) {
      setTokens(storedTokens)
      void syncUserFromTokens(storedTokens, true)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const loadProviders = async () => {
      try {
        const response = await fetchAuthProviders(controller.signal)
        if (!cancelled) {
          const supported = filterSupportedProviders(response.providers)
          if (supported.length > 0) {
            setAvailableProviders(supported)
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to fetch auth providers, falling back to defaults:', error)
        }
      }
    }

    loadProviders()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  const register = (credentials: AuthCredentials): AuthActionResult => {
    if (!LOCAL_AUTH_ENABLED) {
      return { success: false, message: 'Email/password signup is disabled. Please use a social login option.' }
    }

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
    if (!LOCAL_AUTH_ENABLED) {
      return { success: false, message: 'Email/password login is disabled. Use a social provider instead.' }
    }

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

    const userData: User = { id: account.id, email: account.email, provider: 'local' }
    setUser(userData)
    persistUser(userData)
    persistTokens(null)
    return { success: true }
  }

  const loginWithProvider = async (provider: SocialProvider): Promise<AuthActionResult> => {
    const providerLabel = PROVIDER_LABELS[provider] ?? provider

    try {
      const redirect = await startAuthRedirect(provider)

      if (redirect.mock) {
        const callback = await completeAuthCallback(provider, {
          code: 'mock-oauth-code',
          state: redirect.state
        })
        const nextTokens = buildStoredTokens(callback)
        persistTokens(nextTokens)
        await syncUserFromTokens(nextTokens)
        return { success: true, message: `Signed in with ${providerLabel}.` }
      }

      if (redirect.authorize) {
        window.open(redirect.authorize, '_blank', 'noopener,noreferrer')
        return { success: false, message: 'Complete the sign-in in the provider window, then return here.' }
      }

      return { success: false, message: 'Unable to start provider sign-in. Please try again.' }
    } catch (error) {
      console.error('Social login failed:', error)
      return { success: false, message: `Could not sign in with ${providerLabel}.` }
    }
  }

  const refreshTokensIfNeeded = async () => {
    if (!tokens?.refresh) {
      return
    }

    if (tokens.refreshExpiresAt && Date.now() > tokens.refreshExpiresAt) {
      setUser(null)
      persistUser(null)
      persistTokens(null)
      return
    }

    if (tokens.accessExpiresAt && Date.now() < tokens.accessExpiresAt - 30_000) {
      return
    }

    try {
      const refreshed = await refreshAuthTokens(tokens.refresh)
      const nextTokens = buildStoredTokens(refreshed)
      persistTokens(nextTokens)
      await syncUserFromTokens(nextTokens, true)
    } catch (error) {
      console.warn('Token refresh failed:', error)
      setUser(null)
      persistUser(null)
      persistTokens(null)
    }
  }

  useEffect(() => {
    if (!tokens?.refresh) {
      return
    }
    const interval = setInterval(() => {
      void refreshTokensIfNeeded()
    }, 60_000)
    return () => clearInterval(interval)
  }, [tokens?.refresh])

  const logout = () => {
    setUser(null)
    persistUser(null)
    persistTokens(null)
  }

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    login,
    register,
    loginWithProvider,
    logout,
    availableProviders,
    localAuthEnabled: LOCAL_AUTH_ENABLED
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

