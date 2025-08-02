import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient, { User, LoginRequest, RegisterRequest } from '../lib/api-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  apiAvailable: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  checkApiAvailability: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);

  const checkApiAvailability = async () => {
    try {
      const available = await apiClient.isApiAvailable();
      setApiAvailable(available);
      console.log(`🌐 API Availability: ${available ? 'Available' : 'Unavailable'}`);
    } catch (error) {
      console.error('❌ Failed to check API availability:', error);
      setApiAvailable(false);
    }
  };

  const validateToken = async (token: string) => {
    try {
      console.log('🔍 AuthContext: Validating token...');
      const response = await apiClient.validateToken(token);
      
      if (response.success && response.user) {
        console.log('✅ AuthContext: Token valid, setting user');
        setUser(response.user);
        return true;
      } else {
        console.log('⚠️ AuthContext: Token invalid, clearing...');
        localStorage.removeItem('auth_token');
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext: Token validation failed:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      return false;
    }
  };

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      console.log('🔍 AuthContext: Attempting login...');
      const response = await apiClient.login(credentials);
      
      if (response.success && response.token && response.user) {
        console.log('✅ AuthContext: Login successful');
        localStorage.setItem('auth_token', response.token);
        setUser(response.user);
        return true;
      } else {
        console.error('❌ AuthContext: Login failed:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      return false;
    }
  };

  const register = async (data: RegisterRequest): Promise<boolean> => {
    try {
      console.log('🔍 AuthContext: Attempting registration...');
      const response = await apiClient.register(data);
      
      if (response.success && response.token && response.user) {
        console.log('✅ AuthContext: Registration successful');
        localStorage.setItem('auth_token', response.token);
        setUser(response.user);
        return true;
      } else {
        console.error('❌ AuthContext: Registration failed:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext: Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🔍 AuthContext: Attempting logout...');
      await apiClient.logout();
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
    } finally {
      console.log('✅ AuthContext: Logout completed');
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 AuthContext: Initializing authentication...');
      
      // First check API availability
      await checkApiAvailability();
      
      // Wait a moment for API to be fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!apiAvailable) {
        console.log('⚠️ AuthContext: API not available, skipping token validation');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('auth_token');
      
      if (token) {
        console.log('🔍 AuthContext: Found token, validating...');
        await validateToken(token);
      } else {
        console.log('ℹ️ AuthContext: No token found');
      }
      
      console.log('✅ AuthContext: Setting loading to false');
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Periodically check API availability
  useEffect(() => {
    const interval = setInterval(checkApiAvailability, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    apiAvailable,
    login,
    register,
    logout,
    checkApiAvailability,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 