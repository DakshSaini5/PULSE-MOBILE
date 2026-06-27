import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import * as SecureStore from 'expo-secure-store';

interface ThemeContextType {
 isDarkMode: boolean;
 toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const { colorScheme, setColorScheme } = useNativeWindColorScheme();
 const [isDarkMode, setIsDarkMode] = useState(false);

 useEffect(() => {
  const initTheme = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync('pulse_theme');
      if (savedTheme === 'dark') {
        setColorScheme('dark');
        setIsDarkMode(true);
      } else {
        setColorScheme('light');
        setIsDarkMode(false);
      }
    } catch (e) {
      console.error("Error loading theme preference:", e);
      setColorScheme('light');
      setIsDarkMode(false);
    }
  };
  initTheme();
 }, [setColorScheme]);

 const toggleTheme = async () => {
  const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
  setColorScheme(newTheme);
  setIsDarkMode(newTheme === 'dark');
  try {
    await SecureStore.setItemAsync('pulse_theme', newTheme);
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
