"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { setAccessToken } from '@/lib/auth-token';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  target_band?: number;
  ai_persona?: string;
  enrolled_courses?: Array<{
    id: string;
    title: string;
    thumbnail_url?: string;
    status: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User, redirectUrl?: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          setAccessToken(token);
          const userData = await api.auth.me(token);
          setUser(userData);
        } catch (error) {
          console.error("Failed to fetch user:", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (token: string, userData: User, redirectUrl?: string) => {
    localStorage.setItem('token', token);
    setUser(userData);
    router.push(redirectUrl || '/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAccessToken(null);
    setUser(null);
    router.push('/login');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
