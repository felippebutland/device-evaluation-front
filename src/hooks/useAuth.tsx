import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { authService } from '@/services/auth.service';
import type { User, LoginRequest, RegisterRequest } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize and validate auth state
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const token = authService.getToken();

        if (!token || !authService.isSessionValid()) {
          authService.logout();
          setUser(null);
          return;
        }

        // Session still valid — restore user from localStorage immediately
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
        }

        // Refresh silently in background; don't logout on failure
        authService.refreshUser()
          .then(refreshed => setUser(refreshed))
          .catch(() => {
            // ignore — user keeps working with stored data until session expires
          });
      } catch (error) {
        console.error('Error initializing auth:', error);
        authService.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    // Consider authenticated only when we have both a token and a user object
    isAuthenticated: !!authService.getToken() && !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
