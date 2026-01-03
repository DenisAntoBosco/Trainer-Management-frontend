import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { User } from '@/types/api';

export type UserRole = 'admin' | 'hr' | 'trainer' | 'project_manager';

export interface AppUser extends User {}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      console.log('AuthContext: Loading user, token exists:', !!token);
      if (token) {
        try {
          const currentUser = await apiClient.getCurrentUser();
          console.log('AuthContext: User loaded:', currentUser);
          setUser(currentUser);
        } catch (error) {
          console.error('AuthContext: Failed to load user:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Login attempt for:', email);
      const response = await apiClient.login(email, password);
      
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        console.log('AuthContext: Tokens saved');
      } else {
        throw new Error('No access token received');
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const currentUser = await apiClient.getCurrentUser();
      console.log('AuthContext: User set after login:', currentUser);
      setUser(currentUser);
      
      return { success: true };
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
