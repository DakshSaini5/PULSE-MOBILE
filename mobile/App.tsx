import './global.css';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <SafeAreaProvider>
            <AppNavigator />
          </SafeAreaProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
