import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(credentials);
      
      if (response.success && response.token) {
        setToken(response.token);
        localStorage.setItem('token', response.token);
        
        // Get user data
        const userResponse = await authAPI.getMe();
        if (userResponse.success) {
          setUser(userResponse.data);
          localStorage.setItem('user', JSON.stringify(userResponse.data));
          setIsAuthenticated(true);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);
      
      if (response.success && response.token) {
        setToken(response.token);
        localStorage.setItem('token', response.token);
        
        // Get user data
        const userResponse = await authAPI.getMe();
        if (userResponse.success) {
          setUser(userResponse.data);
          localStorage.setItem('user', JSON.stringify(userResponse.data));
          setIsAuthenticated(true);
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const checkAuth = async () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        
        // Verify token is still valid
        const response = await authAPI.getMe();
        if (response.success) {
          setUser(response.data);
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
