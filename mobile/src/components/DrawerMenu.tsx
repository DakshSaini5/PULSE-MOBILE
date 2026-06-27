import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, Easing } from 'react-native';
import { useMenu } from '../context/MenuContext';
import { Heart, Search, GitCompareArrows, Activity, FileText, Clipboard, User, X, LogOut, Settings as SettingsIcon } from 'lucide-react-native';
import { navigationRef } from '../navigation/navigationRef';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

const menuItems = [
  { label: 'Dashboard', icon: Heart, route: 'HomeTab' },
  { label: 'Search Hospitals', icon: Search, route: 'SearchTab' },
  { label: 'Hospital Compare', icon: GitCompareArrows, route: 'CompareTab' },
  { label: 'Saved Care', icon: Heart, route: 'SavedHospitals' },
  { label: 'Health Trends', icon: Activity, route: 'HealthTrendsTab' },
  { label: 'Prescriptions', icon: Clipboard, route: 'PrescriptionTab' },
  { label: 'Lab Reports', icon: FileText, route: 'ReportsTab' },
  { label: 'Settings', icon: SettingsIcon, route: 'Settings' },
];

export const DrawerMenu = () => {
  const { isMenuOpen, setIsMenuOpen } = useMenu();
  const { logout, user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMenuOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isMenuOpen]);

  const handleNavigate = (route: string) => {
    setIsMenuOpen(false);
    // Add small delay to allow drawer to close slightly before switching
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(route as never);
      }
    }, 100);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    setTimeout(() => {
      logout();
    }, 200);
  };

  return (
    <View 
      className="absolute inset-0 z-[100]" 
      style={{ height, width, elevation: 100 }}
      pointerEvents={isMenuOpen ? "auto" : "none"}
    >
      {/* Backdrop */}
      <Animated.View style={{ opacity: fadeAnim }} className="absolute inset-0 bg-black/60">
        <TouchableOpacity 
          className="flex-1" 
          activeOpacity={1} 
          onPress={() => setIsMenuOpen(false)} 
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View 
        style={{ width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }] }} 
        className="absolute top-0 right-0 bottom-0 bg-white dark:bg-slate-950 shadow-2xl flex-col"
      >
        {/* Header */}
        <View 
          className="pb-6 px-6 bg-slate-50 dark:bg-slate-900 border-b border-border flex-row justify-between items-start"
          style={{ paddingTop: insets.top + 16 }}
        >
          <View>
            <Text className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">pulse</Text>
            <Text className="text-[10px] font-bold text-primary tracking-widest mt-0.5">MENU</Text>
          </View>
          <TouchableOpacity onPress={() => setIsMenuOpen(false)} className="bg-slate-200 dark:bg-slate-800 p-2 rounded-full">
            <X size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Links */}
        <View className="flex-1 px-4 py-6 gap-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleNavigate(item.route)}
                className="flex-row items-center px-4 py-4 rounded-2xl active:bg-slate-100 dark:active:bg-slate-900 transition-colors"
              >
                <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center border border-blue-100 dark:border-blue-900/50 mr-4">
                  <Icon size={16} color="#2563EB" />
                </View>
                <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Footer */}
        <View className="p-6 border-t border-border bg-slate-50 dark:bg-slate-900 pb-10">
          <TouchableOpacity 
            onPress={handleLogout}
            className="flex-row items-center px-4 py-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/30"
          >
            <LogOut size={16} color="#e11d48" className="mr-3" />
            <Text className="text-sm font-black tracking-wide text-rose-600 dark:text-rose-500">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default DrawerMenu;
