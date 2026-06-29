import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';
let GoogleSignin: any = null;
let statusCodes: any = {};

try {
  const RNGoogleSignin = require('@react-native-google-signin/google-signin');
  GoogleSignin = RNGoogleSignin.GoogleSignin;
  statusCodes = RNGoogleSignin.statusCodes;
  
  GoogleSignin.configure({
    webClientId: '367526945989-ebnif0f9q0s080kab2clgd42d10qqhok.apps.googleusercontent.com',
  });
} catch (e) {
  console.log('GoogleSignin native module not found (likely running in Expo Go). Google Login will be disabled.');
  GoogleSignin = {
    hasPlayServices: async () => false,
    signIn: async () => { throw new Error('Not available in Expo Go'); }
  };
}

interface User {
 id: string;
 email: string;
 mobileNumber?: string;
 name: string;
 role: string;
 authProvider?: string;
}

interface AuthContextType {
 user: User | null;
 loading: boolean;
 login: (identifier: string, password: string) => Promise<void>;
 googleLogin: () => Promise<void>;
 register: (name: string, email: string, mobileNumber: string, password: string, code: string) => Promise<void>;
 logout: () => Promise<void>;
 refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [user, setUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const initAuth = async () => {
  // BYPASS LOGIN FOR UI TESTING
  setUser({
    id: 'test-123',
    name: 'UI Tester',
    email: 'tester@pulse.com',
    role: 'user'
  });
  setLoading(false);
  return;
  
  try {
 const storedToken = await SecureStore.getItemAsync('pulse_token');
 if (!storedToken) {
 // No token at all — nothing to hydrate
 setLoading(false);
 return;
 }

 // --- Optimistic Hydration ---
 const cachedUser = await SecureStore.getItemAsync('pulse_user');
 if (cachedUser) {
 try {
 setUser(JSON.parse(cachedUser));
 } catch {
 // Corrupt cache — clear and proceed to server verify
 await SecureStore.deleteItemAsync('pulse_user');
 }
 }
 // Unblock the UI immediately
 setLoading(false);

 // --- Silent Background Verification ---
 try {
 const freshUser = await authAPI.verifyToken();
 setUser(freshUser); // Refresh with latest server data (e.g. updated name/role)
 } catch (error: any) {
 if (error.response?.status === 401 || error.response?.status === 403) {
 await authAPI.logout();
 setUser(null);
 } else {
 console.warn('[Pulse] Silent token verification failed due to network/server error. Using cached user.');
 }
 }
 } catch (e) {
 console.error("Error initializing auth:", e);
 setLoading(false);
 }
 };

 initAuth();
 }, []);

 const refreshUser = async () => {
 try {
 const userData = await authAPI.verifyToken();
 setUser(userData);
 } catch (err: any) {
 if (err.response?.status === 401 || err.response?.status === 403) {
 await authAPI.logout();
 setUser(null);
 }
 }
 };

 const login = async (identifier: string, password: string) => {
 setLoading(true);
 try {
 const data = await authAPI.login(identifier, password);
 setUser(data.user);
 } catch (err) {
 setLoading(false);
 throw err; 
 } finally {
 setLoading(false);
 }
 };

 const googleLogin = async () => {
 setLoading(true);
 try {
 await GoogleSignin.hasPlayServices();
 const userInfo = await GoogleSignin.signIn();
 const idToken = userInfo.data?.idToken;

 if (!idToken) {
 throw new Error('No ID token present');
 }

 const data = await authAPI.googleAuth(idToken);
 setUser(data.user);
 } catch (error: any) {
 if (error.code === statusCodes.SIGN_IN_CANCELLED) {
 console.log('User cancelled the login flow');
 } else if (error.code === statusCodes.IN_PROGRESS) {
 console.log('Sign in is in progress already');
 } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
 console.log('Play services not available or outdated');
 } else {
 console.error('Some other error happened', error);
 }
 throw error;
 } finally {
 setLoading(false);
 }
 };

 const register = async (name: string, email: string, mobileNumber: string, password: string, code: string) => {
 setLoading(true);
 try {
 const data = await authAPI.register(name, email, mobileNumber, password, code);
 setUser(data.user);
 } catch (err) {
 setLoading(false);
 throw err; 
 } finally {
 setLoading(false);
 }
 };

 const logout = async () => {
 await authAPI.logout();
 setUser(null);
 };

 return (
 <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, refreshUser }}>
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
