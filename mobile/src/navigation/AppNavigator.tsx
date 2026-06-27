import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { MenuProvider } from '../context/MenuContext';
import { DrawerMenu } from '../components/DrawerMenu';
import { Header } from '../components/Header';
import AIChatbox from '../components/AIChatbox';
import { navigationRef } from './navigationRef';

// Import Auth Screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotScreen from '../screens/ForgotScreen';

// Import Main Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import HospitalDetailScreen from '../screens/HospitalDetailScreen';
import SavedHospitalsScreen from '../screens/SavedHospitalsScreen';
import HealthTrendsScreen from '../screens/HealthTrendsScreen';
import PrescriptionCenterScreen from '../screens/PrescriptionCenterScreen';
import ReportCenterScreen from '../screens/ReportCenterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import HospitalCompareScreen from '../screens/HospitalCompareScreen';
import PanicScreen from '../screens/PanicScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import { AboutScreen, ContactScreen, TermsScreen } from '../screens/InfoScreens';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

function MainStackNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ 
      headerShown: true, 
      header: () => <Header />,
      animation: 'fade_from_bottom' 
    }}>
      <MainStack.Screen name="HomeTab" component={HomeScreen} />
      <MainStack.Screen name="SearchTab" component={SearchScreen} />
      <MainStack.Screen name="CompareTab" component={HospitalCompareScreen} />
      <MainStack.Screen name="HealthTrendsTab" component={HealthTrendsScreen} />
      <MainStack.Screen name="PrescriptionTab" component={PrescriptionCenterScreen} />
      <MainStack.Screen name="ReportsTab" component={ReportCenterScreen} />
      <MainStack.Screen name="ProfileTab" component={ProfileScreen} />
      
      <MainStack.Screen name="HospitalDetail" component={HospitalDetailScreen} />
      <MainStack.Screen name="SavedHospitals" component={SavedHospitalsScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <MainStack.Screen name="About" component={AboutScreen} />
      <MainStack.Screen name="Contact" component={ContactScreen} />
      <MainStack.Screen name="Privacy" component={PrivacyScreen} />
      <MainStack.Screen name="Terms" component={TermsScreen} />
      <MainStack.Screen 
        name="PanicScreen" 
        component={PanicScreen} 
        options={{ presentation: 'fullScreenModal', headerShown: false }} 
      />
    </MainStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  
  console.log("ROUTER STATE: User is authenticated:", !!user);

  if (loading) {
    return null; // A native splash screen usually covers this
  }

  return (
    <MenuProvider>
      <NavigationContainer ref={navigationRef}>
        {user ? (
          <MainStackNavigator />
        ) : (
          <AuthStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Landing" component={LandingScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
            <AuthStack.Screen name="Forgot" component={ForgotScreen} />
          </AuthStack.Navigator>
        )}
      </NavigationContainer>
      {user && (
        <>
          <AIChatbox />
          <DrawerMenu />
        </>
      )}
    </MenuProvider>
  );
}
