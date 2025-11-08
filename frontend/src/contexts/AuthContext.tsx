import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Generar un ID único para esta sesión/tab
const getSessionId = (): string => {
  const sessionId = sessionStorage.getItem('appSessionId');
  if (sessionId) {
    return sessionId;
  }
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('appSessionId', newSessionId);
  return newSessionId;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionIdRef = useRef<string>(getSessionId());

  useEffect(() => {
    // Cada tab tiene su propio sessionId, así que buscamos datos específicos de esta sesión
    const storedToken = localStorage.getItem(`token_${sessionIdRef.current}`);
    const storedUser = localStorage.getItem(`user_${sessionIdRef.current}`);

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(`token_${sessionIdRef.current}`);
        localStorage.removeItem(`user_${sessionIdRef.current}`);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Error al iniciar sesión');
      }

      const data = await response.json();
      
      setToken(data.token);
      setUser(data.user);
      
      // Guardar en localStorage con el sessionId específico de esta tab
      localStorage.setItem(`token_${sessionIdRef.current}`, data.token);
      localStorage.setItem(`user_${sessionIdRef.current}`, JSON.stringify(data.user));
    } catch (error) {
      throw error;
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(`token_${sessionIdRef.current}`);
    localStorage.removeItem(`user_${sessionIdRef.current}`);
  };

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem(`user_${sessionIdRef.current}`, JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
