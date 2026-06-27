import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Bell, Menu, AlertTriangle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserLocation } from '../context/LocationContext';
import { useMenu } from '../context/MenuContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Header = () => {
  const navigation = useNavigation<any>();
  const { locationStatus } = useUserLocation();
  const { setIsMenuOpen } = useMenu();
  const insets = useSafeAreaInsets();

  const handlePanic = () => {
    navigation.navigate('PanicScreen');
  };

  return (
    <View className="bg-slate-50 dark:bg-slate-950 z-50 shadow-sm border-b border-border" style={{ paddingTop: insets.top }}>
      {/* Top Navbar */}
      <View className="flex-row items-center justify-between px-5 py-3">
        {/* Logo & Tagline */}
        <View className="flex-col">
          <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
            pulse
          </Text>
          <Text className="text-[8px] font-extrabold text-primary tracking-widest mt-[-2px]">
            NO QUEUE FOR YOUR CURE
          </Text>
        </View>

        {/* Right Actions */}
        <View className="flex-row items-center gap-3">
          {/* Panic Button */}
          <TouchableOpacity 
            onPress={handlePanic}
            className="bg-rose-600 px-4 rounded-full justify-center"
            style={{ minHeight: 40 }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text className="text-white text-xs font-black tracking-wide py-2.5">PANIC ATTACK</Text>
          </TouchableOpacity>

          {/* Bell */}
          <TouchableOpacity 
            className="p-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <View className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full z-10 border border-white" />
            <Bell size={20} color="#334155" />
          </TouchableOpacity>

          {/* Drawer Menu */}
          <TouchableOpacity className="p-1" onPress={() => setIsMenuOpen(true)}>
            <Menu size={22} color="#334155" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Alert Strip (Pastel Peach) */}
      {locationStatus !== 'granted' && (
        <View className="bg-orange-100 dark:bg-orange-950/40 px-5 py-2.5 flex-row items-start gap-2 border-t border-orange-200 dark:border-orange-900">
          <AlertTriangle size={14} color="#ea580c" className="mt-0.5" />
          <Text className="text-xs text-orange-800 dark:text-orange-400 font-semibold flex-1 leading-tight">
            Location access is required for the Panic Button feature to work accurately.
          </Text>
        </View>
      )}
    </View>
  );
};
