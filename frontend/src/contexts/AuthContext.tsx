import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  provider?: 'local' | 'google' | 'apple'
  isAdmin?: boolean
}

export interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (credentials: { email: string; password: string }) => { success: boolean; message?: string }
  register: (credentials: { email: string; password: string; username: string; displayName?: string }) => { success: boolean; message?: string }
  logout: () => void
  loginWithProvider: (provider: 'google' | 'apple') => Promise<{ success: boolean; message?: string }>
  availableProviders: ('google' | 'apple')[]
  localAuthEnabled: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [localAuthEnabled, setLocalAuthEnabled] = useState(true)

  // 환경 변수에서 설정 읽기
  const availableProviders: ('google' | 'apple')[] = []
  if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    availableProviders.push('google')
  }
  if (import.meta.env.VITE_APPLE_CLIENT_ID) {
    availableProviders.push('apple')
  }

  // 토큰 저장/로드 헬퍼 함수
  const saveToken = (token: string) => {
    localStorage.setItem('auth_token', token)
  }

  const getToken = (): string | null => {
    return localStorage.getItem('auth_token')
  }

  const removeToken = () => {
    localStorage.removeItem('auth_token')
  }

  // API 기본 URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  // 토큰 검증
  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.user) {
          setUser(data.data.user)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('토큰 검증 오류:', error)
      return false
    }
  }

  // 초기 로드 시 토큰 검증
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken()
      if (token) {
        const isValid = await verifyToken(token)
        if (!isValid) {
          removeToken()
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  // 로그인
  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (data.success && data.data) {
        const { user: userData, token } = data.data
        setUser(userData)
        saveToken(token)
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.message || '로그인에 실패했습니다.' }
      }
    } catch (error) {
      console.error('로그인 오류:', error)
      return { success: false, message: '네트워크 오류가 발생했습니다.' }
    }
  }

  // 회원가입
  const register = async (credentials: {
    email: string;
    password: string;
    username: string;
    displayName?: string
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (data.success && data.data) {
        const { user: userData, token } = data.data
        setUser(userData)
        saveToken(token)
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.message || '회원가입에 실패했습니다.' }
      }
    } catch (error) {
      console.error('회원가입 오류:', error)
      return { success: false, message: '네트워크 오류가 발생했습니다.' }
    }
  }

  // 로그아웃
  const logout = async () => {
    try {
      const token = getToken()
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('로그아웃 오류:', error)
    } finally {
      setUser(null)
      removeToken()
    }
  }

  // 소셜 로그인
  const loginWithProvider = async (provider: 'google' | 'apple'): Promise<{ success: boolean; message?: string }> => {
    try {
      // 소셜 로그인 구현 (OAuth 2.0)
      // 실제 구현에서는 각 제공자의 OAuth 플로우를 따라야 함

      // 임시 구현 - 실제로는 OAuth 팝업이나 리다이렉트를 사용해야 함
      const response = await fetch(`${API_BASE_URL}/api/auth/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success && data.data) {
        const { user: userData, token } = data.data
        setUser(userData)
        saveToken(token)
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.message || `${provider} 로그인에 실패했습니다.` }
      }
    } catch (error) {
      console.error(`${provider} 로그인 오류:`, error)
      return { success: false, message: '네트워크 오류가 발생했습니다.' }
    }
  }

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    isLoading,
    login,
    register,
    logout,
    loginWithProvider,
    availableProviders,
    localAuthEnabled
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}