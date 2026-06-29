import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Search, Activity, FileText, User, Heart, GitCompareArrows } from 'lucide-react-native';
import { View, Text } from 'react-native';
import AIChatbox from '../components/AIChatbox';
import { navigationRef } from './navigationRef';

// Import Auth Screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotScreen from '../screens/ForgotScreen';
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
import { AboutScreen, ContactScreen, PrivacyScreen, TermsScreen } from '../screens/InfoScreens';

const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const MainStack = createNativeStackNavigator();

function MainTabNavigator() {
 return (
 <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2563EB' }}>
 <Tab.Screen 
 name="HomeTab" 
 component={HomeScreen} 
 options={{ title: 'Home', tabBarIcon: ({ color }) => <Heart color={color} size={24} /> }}
 />
 <Tab.Screen 
 name="SearchTab" 
 component={SearchScreen} 
 options={{ title: 'Search', tabBarIcon: ({ color }) => <Search color={color} size={24} /> }}
 />
 <Tab.Screen 
 name="CompareTab" 
 component={HospitalCompareScreen} 
 options={{ title: 'Compare', tabBarIcon: ({ color }) => <GitCompareArrows color={color} size={24} /> }}
 />
 <Tab.Screen 
 name="HealthTrendsTab" 
 component={HealthTrendsScreen} 
 options={{ title: 'Trends', tabBarIcon: ({ color }) => <Activity color={color} size={24} /> }}
 />
 <Tab.Screen 
 name="PrescriptionTab" 
 component={PrescriptionCenterScreen} 
 options={{ title: 'Rx', tabBarIcon: ({ color }) => <FileText color={color} size={24} /> }}
 />
 <Tab.Screen 
 name="ReportsTab" 
 component={ReportCenterScreen} 
 options={{ title: 'Labs', tabBarIcon: ({ color }) => <FileText color={color} size={24} /> }}
 />
 <Tab.Screen 
 name="ProfileTab" 
 component={ProfileScreen} 
 options={{ title: 'Profile', tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
 />
 </Tab.Navigator>
 );
}

function MainStackNavigator() {
 return (
 <MainStack.Navigator screenOptions={{ headerShown: false }}>
 <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
 <MainStack.Screen name="HospitalDetail" component={HospitalDetailScreen} />
 <MainStack.Screen name="Settings" component={SettingsScreen} />
 <MainStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
 <MainStack.Screen name="About" component={AboutScreen} />
 <MainStack.Screen name="Contact" component={ContactScreen} />
 <MainStack.Screen name="Privacy" component={PrivacyScreen} />
 <MainStack.Screen name="Terms" component={TermsScreen} />
 </MainStack.Navigator>
 );
}

export default function AppNavigator() {
 const { user, loading } = useAuth();

 if (loading) {
 return null; // A native splash screen usually covers this
 }

 return (
 <>
 <NavigationContainer ref={navigationRef}>
 {user ? (
 <MainStackNavigator />
 ) : (
 <AuthStack.Navigator screenOptions={{ headerShown: false }}>
 <AuthStack.Screen name="Landing" component={LandingScreen} />
 <AuthStack.Screen name="Login" component={LoginScreen} />
 <AuthStack.Screen name="Register" component={RegisterScreen} />
 <AuthStack.Screen name="Forgot" component={ForgotScreen} />
 </AuthStack.Navigator>
 )}
 </NavigationContainer>
 {user && <AIChatbox />}
 </>
 );
}
