const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// Token management
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('token', token)
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
}

// API calls
export async function login(email: string, password: string): Promise<AuthResponse> {
  const formData = new URLSearchParams()
  formData.append('username', email)
  formData.append('password', password)

  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new AuthError(error.detail || 'Invalid credentials')
  }

  return response.json()
}

export async function register(
  email: string,
  fullName: string,
  password: string
): Promise<User> {
  const response = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      full_name: fullName,
      password,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new AuthError(error.detail || 'Registration failed')
  }

  return response.json()
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new AuthError('Failed to fetch user information')
  }

  return response.json()
}

// Re-export useAuth hook from the hooks module
export { useAuth } from './useAuth'
