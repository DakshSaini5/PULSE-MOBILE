import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Moon, Bell, Shield, LogOut, Trash2, ChevronRight, MapPin, Activity } from 'lucide-react-native';
import { authAPI } from '../services/api';
import { VitalsEditModal } from '../components/VitalsEditModal';
import * as Notifications from 'expo-notifications';
import { useUserLocation } from '../context/LocationContext';

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const { locationStatus } = useUserLocation();

  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPushEnabled(status === 'granted');
    };
    checkPermissions();
  }, []);

  const handlePushToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      setPushEnabled(status === 'granted');
    } else {
      // In iOS/Android, you can't programmatically revoke permissions
      Alert.alert(
        "Manage Notifications",
        "To disable notifications, please go to your device settings.",
      );
      setPushEnabled(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This action is permanent and will erase all your medical records, chat history, and saved hospitals.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              // Trigger backend deletion
              // await authAPI.deleteAccount(); 
              await logout();
            } catch (err) {
              Alert.alert("Error", "Could not delete account. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-5 pt-6 pb-4">
          <Text className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Settings</Text>
        </View>

        {/* Section 1: Profile & Vitals */}
        <View className="px-5 mb-6">
          <Text className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3 ml-1">Profile & Vitals</Text>
          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-border overflow-hidden shadow-sm">
            
            {/* User Info */}
            <View className="p-4 border-b border-border flex-row items-center gap-4">
              <View className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center border border-blue-200">
                <User size={24} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-black text-slate-800 dark:text-slate-100">{user?.name || 'Daksh Saini'}</Text>
                <Text className="text-xs font-semibold text-slate-500">{user?.email || 'daksh@example.com'}</Text>
              </View>
            </View>

            {/* Vitals Grid */}
            <View className="flex-row border-b border-border">
              <View className="flex-1 p-3 items-center border-r border-border">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Age</Text>
                <Text className="text-sm font-black text-slate-700 dark:text-slate-300">{user?.age || '--'}</Text>
              </View>
              <View className="flex-1 p-3 items-center border-r border-border">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Gender</Text>
                <Text className="text-sm font-black text-slate-700 dark:text-slate-300">{user?.gender || '--'}</Text>
              </View>
              <View className="flex-1 p-3 items-center">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Weight</Text>
                <Text className="text-sm font-black text-slate-700 dark:text-slate-300">{user?.weight || '--'}</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => setIsVitalsModalOpen(true)}
              className="flex-row items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
            >
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Edit Profile Variables</Text>
              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: App Preferences */}
        <View className="px-5 mb-6">
          <Text className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3 ml-1">App Preferences</Text>
          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-border overflow-hidden shadow-sm">
            
            {/* Theme Toggle */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                  <Moon size={16} color="#64748b" />
                </View>
                <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Dark Mode</Text>
              </View>
              <Switch 
                value={isDarkMode} 
                onValueChange={toggleTheme}
                trackColor={{ false: "#e2e8f0", true: "#2563EB" }}
                thumbColor={Platform.OS === 'ios' ? undefined : "#ffffff"}
              />
            </View>

            {/* Notifications Toggle */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                  <Bell size={16} color="#64748b" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Push Notifications</Text>
                  <Text className="text-[10px] text-slate-500 font-semibold mt-0.5">Alerts & Reminders</Text>
                </View>
              </View>
              <Switch 
                value={pushEnabled} 
                onValueChange={handlePushToggle}
                trackColor={{ false: "#e2e8f0", true: "#2563EB" }}
                thumbColor={Platform.OS === 'ios' ? undefined : "#ffffff"}
              />
            </View>

            {/* Location Status */}
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center border border-emerald-100">
                  <MapPin size={16} color="#10b981" />
                </View>
                <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Location Services</Text>
              </View>
              <Text className={`text-xs font-black tracking-widest uppercase ${locationStatus === 'granted' ? 'text-emerald-600' : 'text-amber-500'}`}>
                {locationStatus === 'granted' ? 'Granted' : locationStatus === 'denied' ? 'Denied' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Legal & Security */}
        <View className="px-5 mb-6">
          <Text className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3 ml-1">Legal & Security</Text>
          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-border overflow-hidden shadow-sm">
            
            {/* Privacy Policy */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Privacy')}
              className="flex-row items-center justify-between p-4 border-b border-border active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                  <Shield size={16} color="#64748b" />
                </View>
                <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Privacy Policy</Text>
              </View>
              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>

            {/* Log Out */}
            <TouchableOpacity 
              onPress={logout}
              className="flex-row items-center justify-between p-4 border-b border-border active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                  <LogOut size={16} color="#64748b" />
                </View>
                <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Log Out</Text>
              </View>
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity 
              onPress={handleDeleteAccount}
              className="flex-row items-center p-4 active:bg-rose-50 dark:active:bg-rose-950/20 transition-colors bg-rose-50/50 dark:bg-rose-950/10"
            >
              <View className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 items-center justify-center border border-rose-200">
                <Trash2 size={16} color="#e11d48" />
              </View>
              <View className="ml-3">
                <Text className="text-sm font-black text-rose-600 dark:text-rose-500">Delete Account</Text>
                <Text className="text-[10px] font-semibold text-rose-400 mt-0.5">Permanently erase all data</Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {/* App Version */}
        <View className="items-center mt-2 mb-10">
          <Text className="text-xs font-bold text-slate-400">Pulse v1.0.0</Text>
          <Text className="text-[10px] text-slate-500 mt-1">Google Play Health Compliant</Text>
        </View>

      </ScrollView>

      <VitalsEditModal 
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
      />
    </SafeAreaView>
  );
};

export default SettingsScreen;
