'use client'

import { useState, useEffect } from 'react'
import { User, getToken, getCurrentUser, clearToken } from './auth'

interface UseAuthReturn {
  user: User | null
  token: string | null
  loading: boolean
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = getToken()
        if (storedToken) {
          setTokenState(storedToken)
          const currentUser = await getCurrentUser(storedToken)
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        clearToken()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  return { user, token, loading }
}
