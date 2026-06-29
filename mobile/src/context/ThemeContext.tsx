import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface ThemeContextType {
 isDarkMode: boolean;
 toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const systemColorScheme = useColorScheme();
 const [isDarkMode, setIsDarkMode] = useState(false);

 useEffect(() => {
 const initTheme = async () => {
 try {
 const savedTheme = await SecureStore.getItemAsync('pulse_theme');
 // Force light mode by default, ignore OS preference as per original web logic
 if (savedTheme === 'dark') {
 setIsDarkMode(true);
 } else {
 setIsDarkMode(false);
 }
 } catch (e) {
 console.error("Error loading theme preference:", e);
 setIsDarkMode(false);
 }
 };
 initTheme();
 }, []);

 const toggleTheme = async () => {
 const newTheme = !isDarkMode;
 setIsDarkMode(newTheme);
 try {
 await SecureStore.setItemAsync('pulse_theme', newTheme ? 'dark' : 'light');
 } catch (e) {
 console.error("Error saving theme preference:", e);
 }
 };

 return (
 <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
 {children}
 </ThemeContext.Provider>
 );
};

export const useTheme = () => {
 const context = useContext(ThemeContext);
 if (context === undefined) {
 throw new Error('useTheme must be used within a ThemeProvider');
 }
 return context;
};
