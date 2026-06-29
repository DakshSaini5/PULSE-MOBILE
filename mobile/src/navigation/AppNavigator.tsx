import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { Search, Activity, FileText, User, Home as HomeIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Components
import PanicButton from '../components/PanicButton';
import DraggableChatWidget from '../components/DraggableChatWidget';
import { navigationRef } from './navigationRef';

// Screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotScreen from '../screens/ForgotScreen';
import HomeScreen from '../screens/HomeScreen';
import HospitalFinderScreen from '../screens/HospitalFinderScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PrescriptionCenterScreen from '../screens/PrescriptionCenterScreen';
import ReportCenterScreen from '../screens/ReportCenterScreen';
import HospitalDetailScreen from '../screens/HospitalDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import { AboutScreen, ContactScreen, PrivacyScreen, TermsScreen } from '../screens/InfoScreens';
import HealthTrendsScreen from '../screens/HealthTrendsScreen';

import ScanResultScreen from '../screens/ScanResultScreen';

const AuthStack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const MainStack = createNativeStackNavigator();

function CustomDrawerContent(props: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  return (
    <DrawerContentScrollView {...props} className="bg-white flex-1" contentContainerStyle={{ paddingTop: Math.max(insets.top, 24) }}>
      <View className="px-5 pb-8 border-b border-gray-100">
        <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-3">
          <User color="#2563EB" size={32} />
        </View>
        <Text className="text-xl font-bold text-slate-900">{user?.name || 'Guest User'}</Text>
        <Text className="text-sm text-slate-500">{user?.email || 'guest@pulse.com'}</Text>
      </View>
      <View className="flex-1 pt-4">
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}

function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: '#EFF6FF',
        drawerActiveTintColor: '#2563EB',
        drawerInactiveTintColor: '#64748B',
        drawerLabelStyle: { fontSize: 16, fontWeight: '600', marginLeft: -5 },
        drawerStyle: { backgroundColor: '#fff', width: 280 },
      }}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ drawerIcon: ({ color }) => <HomeIcon color={color} size={22} /> }}
      />
      <Drawer.Screen 
        name="Hospital Finder" 
        component={HospitalFinderScreen} 
        options={{ drawerIcon: ({ color }) => <Search color={color} size={22} /> }}
      />
      <Drawer.Screen 
        name="Prescriptions" 
        component={PrescriptionCenterScreen} 
        options={{ drawerIcon: ({ color }) => <FileText color={color} size={22} /> }}
      />
      <Drawer.Screen 
        name="Lab Reports" 
        component={ReportCenterScreen} 
        options={{ drawerIcon: ({ color }) => <Activity color={color} size={22} /> }}
      />
      <Drawer.Screen 
        name="Health Trends" 
        component={HealthTrendsScreen} 
        options={{ drawerIcon: ({ color }) => <Activity color={color} size={22} /> }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ drawerIcon: ({ color }) => <User color={color} size={22} /> }}
      />
    </Drawer.Navigator>
  );
}

function MainStackNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Drawer" component={MainDrawerNavigator} />
      <MainStack.Screen name="HospitalDetail" component={HospitalDetailScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <MainStack.Screen name="About" component={AboutScreen} />
      <MainStack.Screen name="Contact" component={ContactScreen} />
      <MainStack.Screen name="Privacy" component={PrivacyScreen} />
      <MainStack.Screen name="Terms" component={TermsScreen} />
      <MainStack.Screen name="ScanResult" component={ScanResultScreen} />
    </MainStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <View className="flex-1 bg-white">
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
      {user && (
        <>
          <DraggableChatWidget />
          <PanicButton />
        </>
      )}
    </View>
  );
}
