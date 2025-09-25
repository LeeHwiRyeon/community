import { API_BASE } from '../api'

export type AuthProvider = 'google' | 'apple' | string

export interface AuthProviderDescriptor {
  provider: AuthProvider
  label?: string
  mock?: boolean
}

export interface AuthProvidersResponse {
  providers: AuthProviderDescriptor[]
}

export interface AuthRedirectResponse {
  provider: string
  authorize?: string
  redirect?: string
  callback?: string
  mock?: boolean
  link?: boolean
  state?: string
  pkce?: boolean
}

export interface AuthCallbackSuccess {
  provider: string
  userId: number | string
  legacyToken?: string | null
  linked?: boolean
  access: string
  refresh?: string | null
  access_expires_in?: number
  refresh_expires_in?: number
}

export interface AuthUserIdentity {
  provider: string
  provider_user_id: string
  email_at_provider?: string | null
}

export interface AuthMeUser {
  id: number | string
  email?: string | null
  display_name?: string | null
  role?: string | null
  identities?: AuthUserIdentity[]
  provider?: string | null
}

export interface AuthMeResponse {
  user: AuthMeUser
  tokenType?: string
  exp?: number
  issuedAt?: number
}

export interface AuthRefreshResponse {
  userId: number | string
  access: string
  refresh?: string | null
  access_expires_in?: number
  refresh_expires_in?: number
}

const buildUrl = (path: string) => `${API_BASE}${path}`

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  })

  if (!response.ok) {
    throw new Error(`Auth API request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

export async function fetchAuthProviders(signal?: AbortSignal): Promise<AuthProvidersResponse> {
  return requestJson<AuthProvidersResponse>('/auth/providers', { signal })
}

export async function startAuthRedirect(provider: string, options?: { link?: boolean }): Promise<AuthRedirectResponse> {
  const params = new URLSearchParams()
  if (options?.link) {
    params.set('link', '1')
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return requestJson<AuthRedirectResponse>(`/auth/redirect/${provider}${suffix}`)
}

export async function completeAuthCallback(
  provider: string,
  options?: { code?: string; state?: string }
): Promise<AuthCallbackSuccess> {
  const params = new URLSearchParams()
  if (options?.code) {
    params.set('code', options.code)
  }
  if (options?.state) {
    params.set('state', options.state)
  }
  const query = params.toString()
  const suffix = query ? `?${query}` : ''
  return requestJson<AuthCallbackSuccess>(`/auth/callback/${provider}${suffix}`, {
    credentials: 'include'
  })
}

export async function fetchAuthMe(accessToken: string): Promise<AuthMeResponse> {
  return requestJson<AuthMeResponse>('/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}

export async function refreshAuthTokens(refresh: string): Promise<AuthRefreshResponse> {
  return requestJson<AuthRefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh })
  })
}
