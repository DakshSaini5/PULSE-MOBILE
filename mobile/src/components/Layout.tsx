import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react-native';
import MobileBottomNav from './MobileBottomNav';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const { user } = useAuth();
 const navigation = useNavigation();
 const route = useRoute();
 const [panicActive, setPanicActive] = useState(false);

 const isAppScreen = route.name !== 'Landing';

 return (
 <SafeAreaView className="flex-1 bg-background relative">
 <View className="flex-1 relative">
 {children}
 </View>

 {panicActive && (
 <View className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-destructive/95">
 <View className="flex flex-col items-center gap-6 px-8 text-center w-full">
 <View className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
 <ShieldAlert size={48} color="white" />
 </View>
 <View>
 <Text className="text-3xl font-black text-white tracking-tight text-center">PANIC ATTACK</Text>
 <Text className="text-white/80 text-sm mt-2 leading-relaxed text-center">
 Contacting nearest hospital and sharing your live location...
 </Text>
 </View>
 <View className="flex flex-col gap-3 w-full">
 <View className="bg-white/10 rounded-2xl px-5 py-3 border border-white/20">
 <Text className="text-xs text-white/70 font-medium text-center">Nearest Emergency</Text>
 <Text className="text-base font-bold text-white mt-0.5 text-center">CGHS Inderpuri — 2.1 km</Text>
 <Text className="text-xs text-white/60 mt-0.5 text-center">011-25836573 · Open 24 Hours</Text>
 </View>
 
 <TouchableOpacity className="flex flex-row items-center justify-center gap-2 bg-white py-4 rounded-2xl ">
 <Text className="text-destructive font-black text-base">Call 108 — Ambulance</Text>
 </TouchableOpacity>
 
 <TouchableOpacity onPress={() => setPanicActive(false)} className="mt-1 py-2">
 <Text className="text-white/60 text-sm font-semibold underline text-center">
 Cancel — I am safe
 </Text>
 </TouchableOpacity>
 </View>
 </View>
 </View>
 )}

 {user && isAppScreen && !panicActive && <MobileBottomNav />}
 </SafeAreaView>
 );
};
