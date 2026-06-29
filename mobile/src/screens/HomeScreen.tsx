import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
 Stethoscope, Syringe, FlaskConical, Bone, Heart, Brain, 
 Eye, Baby, Search, HelpCircle, MapPin, ChevronRight, AlertTriangle 
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useUserLocation } from '../context/LocationContext';
import { PulseLogo } from '../components/PulseLogo';
import { Button } from '../components/ui/button';

const services = [
 { id: "general", label: "General", icon: Stethoscope, bg: "bg-primary/10", iconColor: "#2563EB" },
 { id: "vaccination", label: "Vaccination", icon: Syringe, bg: "bg-emerald-500/10", iconColor: "#10b981" },
 { id: "blood-test", label: "Blood Test", icon: FlaskConical, bg: "bg-primary/10", iconColor: "#2563EB" },
 { id: "dental", label: "Dental", icon: Bone, bg: "bg-amber-500/10", iconColor: "#d97706" },
 { id: "cardiology", label: "Cardiology", icon: Heart, bg: "bg-primary/10", iconColor: "#2563EB" },
 { id: "neurology", label: "Neurology", icon: Brain, bg: "bg-purple-500/10", iconColor: "#9333ea" },
 { id: "eye-care", label: "Eye Care", icon: Eye, bg: "bg-primary/10", iconColor: "#2563EB" },
 { id: "pediatrics", label: "Pediatrics", icon: Baby, bg: "bg-amber-500/10", iconColor: "#d97706" },
];

export const HomeScreen = () => {
 const navigation = useNavigation<any>();
 const { user } = useAuth();
 const { label: cityName, locationStatus } = useUserLocation();
 const [searchQuery, setSearchQuery] = useState("");

 const navigateToSearch = () => {
 navigation.navigate('SearchTab', { query: searchQuery });
 };

 return (
 <SafeAreaView className="flex-1 bg-background">
 {/* App Header */}
 <View className="flex-row items-center justify-between px-6 py-4 bg-background/90 border-b border-border z-10">
 <PulseLogo size={24} variant="horizontal" showTagline={false} />
 <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')} className="active:scale-95 transition-transform">
 <View className="h-9 w-9 rounded-xl bg-secondary/50 items-center justify-center border border-border">
 <Text className="text-primary font-bold text-sm">
 {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
 </Text>
 </View>
 </TouchableOpacity>
 </View>

 <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
 
 {/* Alert Banner */}
 {locationStatus !== 'granted' && (
 <View className="mx-6 mt-6 bg-destructive/10 rounded-xl p-4 flex-row items-start gap-3 border border-destructive/20">
 <AlertTriangle size={18} color="#2563EB" style={{ marginTop: 2 }} />
 <Text className="text-sm text-destructive flex-1 leading-relaxed font-medium">
 Location access is required for the Panic Button feature to work accurately.
 </Text>
 </View>
 )}

 {/* Greeting */}
 <View className="px-6 pt-8 pb-4">
 <Text className="text-[32px] font-extrabold text-foreground tracking-tight leading-10">
 Hi, {user?.name || 'User'} 👋
 </Text>
 <View className="flex-row items-center mt-3 bg-secondary/50 self-start px-3 py-1.5 rounded-full border border-border">
 <MapPin size={14} color="#2563EB" />
 <Text className="text-xs text-muted-foreground ml-2 font-medium">
 Showing care in <Text className="font-bold text-foreground">{cityName || 'Unknown Location'}</Text>
 </Text>
 </View>

 {/* Quick Actions */}
 <View className="flex-row gap-4 mt-8">
 <Button variant="outline" className="flex-1 border border-border h-14 rounded-xl bg-card">
 <HelpCircle size={18} color="#2563EB" style={{ marginRight: 8 }} />
 <Text className="font-semibold text-foreground text-sm">Need Help?</Text>
 </Button>
 <Button className="flex-1 h-14 rounded-xl bg-primary border border-primary" onPress={() => navigation.navigate('SearchTab')}>
 <Text className="text-white font-semibold text-sm">Find Hospitals</Text>
 </Button>
 </View>
 </View>

 {/* Search Bar */}
 <View className="px-6 py-6">
 <View className="flex-row gap-3">
 <View className="flex-1 flex-row items-center bg-secondary/30 border border-border rounded-xl px-5 h-14">
 <Search size={18} color="#94a3b8" />
 <TextInput
 value={searchQuery}
 onChangeText={setSearchQuery}
 placeholder="Search services or hospitals..."
 placeholderTextColor="#94a3b8"
 className="flex-1 ml-3 text-base text-foreground font-medium h-full"
 />
 </View>
 <Button className="h-14 px-6 rounded-xl bg-secondary border border-border" onPress={navigateToSearch}>
 <Text className="text-foreground font-semibold text-sm">Search</Text>
 </Button>
 </View>
 </View>

 {/* Browse Services */}
 <View className="px-6 py-4">
 <View className="flex-row items-center justify-between mb-6">
 <Text className="text-lg font-bold text-foreground tracking-tight">Browse Services</Text>
 <TouchableOpacity className="flex-row items-center gap-1 bg-secondary/50 px-3 py-1.5 rounded-xl border border-border">
 <Text className="text-xs font-semibold text-foreground">View all</Text>

 <ChevronRight size={14} color="#2563EB" />
 </TouchableOpacity>
 </View>

 <View className="flex-row flex-wrap justify-between gap-y-4">
 {services.map((service) => {
 const Icon = service.icon;
 return (
 <TouchableOpacity
 key={service.id}
 className="w-[23%] flex-col items-center mb-2 active:scale-95 transition-transform"
 onPress={() => navigation.navigate('SearchTab')}
 >
 <View className={`h-14 w-14 rounded-2xl items-center justify-center mb-2 bg-secondary/30 border border-border`}>
 <Icon size={22} color={service.iconColor} />
 </View>
 <Text className="text-[10px] font-semibold text-muted-foreground text-center tracking-tight">
 {service.label}
 </Text>
 </TouchableOpacity>
 );
 })}
 </View>
 </View>

 {/* Quick Stats */}
 <View className="px-6 pt-6 pb-8">
 <View className="bg-card rounded-2xl border border-border p-5">
 <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">
 Your Health Summary
 </Text>
 <View className="flex-row justify-between">
 {[
 { label: "Scans", value: "0", sub: "analyzed" },
 { label: "Hospitals", value: "3", sub: "saved" },
 { label: "Trends", value: "1", sub: "tracked" },
 ].map((stat, i) => (
 <View key={i} className="flex-col items-center bg-secondary/20 rounded-xl p-3 w-[31%] border border-border/50">
 <Text className="text-2xl font-bold text-primary mb-1">{stat.value}</Text>
 <Text className="text-xs font-semibold text-foreground">{stat.label}</Text>

 <Text className="text-[10px] text-muted-foreground mt-0.5 font-medium">{stat.sub}</Text>
 </View>
 ))}
 </View>
 </View>
 </View>

 </ScrollView>
 </SafeAreaView>
 );
};

export default HomeScreen;
