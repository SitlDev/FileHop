'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { User } from '@/lib/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (googleId: string, email: string, name?: string, image?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is logged in on mount
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Set auth header for all future requests
      apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      // Could fetch user profile here
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post('/api/auth/login', { email, password });
      
      const { token, user: userData } = response.data;
      localStorage.setItem('authToken', token);
      apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(userData);
      toast.success('Logged in successfully');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post('/api/auth/register', {
        email,
        password,
        name,
      });
      
      const { token, user: userData } = response.data;
      localStorage.setItem('authToken', token);
      apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(userData);
      toast.success('Account created successfully');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Signup failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(
    async (googleId: string, email: string, name?: string, image?: string) => {
      try {
        setIsLoading(true);
        const response = await apiClient.post('/api/auth/google', {
          googleId,
          email,
          name,
          image,
        });
        
        const { token, user: userData } = response.data;
        localStorage.setItem('authToken', token);
        apiClient.defaults.headers.Authorization = `Bearer ${token}`;
        setUser(userData);
        toast.success('Logged in with Google');
      } catch (error: any) {
        const message = error.response?.data?.error || 'Google login failed';
        toast.error(message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/logout');
      localStorage.removeItem('authToken');
      delete apiClient.defaults.headers.Authorization;
      setUser(null);
      toast.success('Logged out');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Logout failed';
      toast.error(message);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
