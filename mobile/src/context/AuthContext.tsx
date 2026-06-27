import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
// Native Google Sign-in requires custom dev client, bypassing for Expo Go MVP
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { authAPI } from '../services/api';
import { DeviceEventEmitter } from 'react-native';
/*
try {
 GoogleSignin.configure({
 webClientId: '367526945989-ebnif0f9q0s080kab2clgd42d10qqhok.apps.googleusercontent.com',
 });
} catch (e) {
 console.log('GoogleSignin configure failed', e);
}
*/

interface User {
 id: string;
 email: string;
 mobileNumber?: string;
 name: string;
 role: string;
 authProvider?: string;
 age?: number;
 gender?: string;
 weight?: string;
 bloodGroup?: string;
 medicalConditions?: string;
}

interface AuthContextType {
 user: User | null;
 loading: boolean;
 login: (identifier: string, password: string) => Promise<void>;
 googleLogin: () => Promise<void>;
 setGoogleUser: (user: User) => void;
 register: (name: string, email: string, mobileNumber: string, password: string, code: string) => Promise<void>;
 logout: () => Promise<void>;
 refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await authAPI.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error auto-loading user', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    const subscription = DeviceEventEmitter.addListener('force_logout', () => {
      setUser(null); // Actually log the user out
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await authAPI.verifyToken();
      setUser(userData);
      await SecureStore.setItemAsync('pulse_user', JSON.stringify(userData));
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        await authAPI.logout();
        setUser(null);
      }
    }
  };

  const setGoogleUser = (userData: User) => {
    setUser(userData);
  };

 const login = async (identifier: string, password: string) => {
   setLoading(true);
   try {
     const res = await authAPI.login(identifier, password);
     if (res.user) {
       setUser(res.user);
     }
   } finally {
     setLoading(false);
   }
 };

 const googleLogin = async () => {
 setLoading(true);
 try {
 console.warn("Google Sign-In is disabled in Expo Go MVP.");
 // TODO: Implement expo-auth-session for Google Sign-in in Expo Go
 throw new Error("Google Sign-in not supported in Expo Go");
 } catch (error: any) {
 throw error;
 } finally {
 setLoading(false);
 }
 };

 const register = async (name: string, email: string, mobileNumber: string, password: string, code: string) => {
   setLoading(true);
   try {
     const res = await authAPI.register(name, email, mobileNumber, password, code);
     if (res.user) {
       setUser(res.user);
     }
   } finally {
     setLoading(false);
   }
 };

 const logout = async () => {
 await authAPI.logout();
 setUser(null);
 };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, setGoogleUser, register, logout, refreshUser }}>
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
