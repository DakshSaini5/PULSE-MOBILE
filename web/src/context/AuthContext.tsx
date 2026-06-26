import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (token: string, userData: any) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hydrate session securely via localStorage
    const storedToken = localStorage.getItem('pulse_token');
    const storedUser = localStorage.getItem('pulse_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    // Optimistic UI loading prevention (simulated fast load)
    setIsLoading(false);
  }, []);

  const login = (newToken: string, userData: any) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('pulse_token', newToken);
    localStorage.setItem('pulse_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
