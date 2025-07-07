import React, { createContext, useState, useContext, useEffect, ReactNode }
from 'react';
import { getUserProfile } from '../services/apiService'; // Assuming apiService is set up

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, userData?: User) => void;
  logout: () => void;
  isLoading: boolean;
}

interface User {
  userId: string | number;
  username: string;
  email?: string;
  role?: string;
  // Add other user properties as needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const attemptAutoLogin = async () => {
      if (token) {
        try {
          // Optional: Validate token by fetching user profile
          // This requires your API gateway and auth service to be running
          // and accessible for the check to pass during initial load.
          // const response = await getUserProfile(); // getUserProfile should use the stored token
          // setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auto login failed, token might be invalid:', error);
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };
    attemptAutoLogin();
  }, [token]);

  const login = (newToken: string, userData?: User) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    if (userData) {
      setUser(userData);
    } else {
      // If userData is not directly provided, try to fetch it
      // This is useful if login response only gives token
      const fetchProfile = async () => {
        try {
            // const response = await getUserProfile();
            // setUser(response.data.user);
            // For now, placeholder if not fetching immediately
            setUser({ userId: 'temp', username: 'tempUser' }); // Placeholder
        } catch (error) {
            console.error("Failed to fetch user profile after login", error);
            // Handle appropriately, maybe partial login or logout
        }
      };
      fetchProfile();
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    // Optionally, redirect to login page via useNavigate() if used within a component
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
