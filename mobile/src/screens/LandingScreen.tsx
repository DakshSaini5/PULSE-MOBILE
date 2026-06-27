import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { ArrowRight, Sparkles, LogIn, Brain, MapPin, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { PulseLogo } from '../components/PulseLogo';
import { Button } from '../components/ui/button';

export const LandingScreen = () => {
 const navigation = useNavigation<any>();
 const { googleLogin } = useAuth();
 const [googleLoading, setGoogleLoading] = React.useState(false);

 const handleGoogleLogin = async () => {
 setGoogleLoading(true);
 try {
 await googleLogin();
 } catch (err) {
 console.error(err);
 } finally {
 setGoogleLoading(false);
 }
 };

 const features = [
 { icon: Brain, label: "AI Analysis", desc: "Gemini-powered insights" },
 { icon: MapPin, label: "Hospital Map", desc: "Find care near you" },
 { icon: ShieldCheck, label: "Secure Records", desc: "Your data, protected" },
 ];

 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
 <StatusBar barStyle="default" />
 <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} className="flex-1">
 
 {/* Navigation Bar */}
 <View className="flex-row items-center justify-between px-6 py-4">
 <PulseLogo size={28} variant="horizontal" showTagline={false} />
 <Button 
 variant="outline" 
 size="sm" 
 className="border-border rounded-full"
 onPress={() => navigation.navigate('Login')}
 >
 <LogIn size={16} color="#2563EB" style={{ marginRight: 6 }} />
 <Text className="text-foreground font-medium text-sm">Sign In</Text>
 </Button>
 </View>

 {/* Hero Section */}
 <View className="flex-1 flex-col px-6 pt-12 pb-8 justify-center">
 
 {/* Label */}
 <View className="flex-row items-center gap-2 mb-6 bg-primary/10 self-start px-4 py-2 rounded-full border border-primary/20">
 <View className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
 <Sparkles size={12} color="#2563EB" />
 </View>
 <Text className="text-xs font-bold tracking-widest text-primary uppercase">
 Pulse Healthcare
 </Text>
 </View>

 {/* Headline */}
 <Text className="text-[44px] font-extrabold text-foreground leading-[48px] mb-5 tracking-tight">
 Find the Right Care,{"\n"}
 <Text className="text-primary">Faster & Smarter.</Text>
 </Text>

 {/* Subtext */}
 <Text className="text-lg text-muted-foreground leading-relaxed mb-10 pr-4 font-medium">
 An AI-powered navigation assistant that simplifies complex medical files and recommends highly suited hospitals in plain English.
 </Text>

 {/* CTAs */}
 <View className="flex-col gap-4">
 <Button
 size="lg"
 className="w-full h-14 rounded-2xl flex-row items-center justify-center gap-2"
 onPress={() => navigation.navigate('Register')}
 >
 <Text className="text-primary-foreground font-extrabold text-lg">Start Analyzing Free</Text>
 <ArrowRight size={20} color="white" />
 </Button>
 
 <Button
 variant="outline"
 size="lg"
 className="w-full h-14 rounded-2xl border-2 border-border flex-row items-center justify-center gap-2 bg-card "
 onPress={handleGoogleLogin}
 disabled={googleLoading}
 >
 {googleLoading ? (
 <Text className="font-bold text-lg text-muted-foreground">Loading...</Text>
 ) : (
 <>
 <Text className="font-extrabold text-xl text-foreground">G</Text>
 <Text className="text-foreground font-bold text-base">Continue with Google</Text>
 </>
 )}
 </Button>
 </View>
 </View>

 {/* Feature Cards */}
 <View className="px-6 pb-6">
 <View className="bg-card rounded-2xl border border-border p-6 ">
 <Text className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-5">
 What Pulse does for you
 </Text>
 <View className="flex-col gap-5">
 {features.map((f, i) => {
 const Icon = f.icon;
 return (
 <View key={i} className="flex-row items-center gap-4">
 <View className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center border border-border">
 <Icon size={22} color="#2563EB" />
 </View>
 <View>
 <Text className="font-bold text-foreground text-base">{f.label}</Text>
 <Text className="text-sm text-muted-foreground mt-0.5">{f.desc}</Text>
 </View>
 </View>
 );
 })}
 </View>
 </View>
 </View>

 {/* Trust Badges */}
 <View className="px-6 pb-8 flex-row items-center justify-center gap-4">
 <View className="flex-row items-center gap-2">
 <ShieldCheck size={16} color="#10b981" />
 <Text className="text-xs font-semibold text-muted-foreground">HIPAA Safe</Text>
 </View>
 <View className="w-px h-4 bg-border" />
 <View className="flex-row items-center gap-2">
 <Sparkles size={16} color="#2563EB" />
 <Text className="text-xs font-semibold text-muted-foreground">Gemini AI</Text>
 </View>
 <View className="w-px h-4 bg-border" />
 <View className="flex-row items-center gap-2">
 <MapPin size={16} color="#3b82f6" />
 <Text className="text-xs font-semibold text-muted-foreground">Live Data</Text>
 </View>
 </View>
 
 <View className="items-center opacity-60">
 <Text className="text-[10px] text-muted-foreground text-center px-6 font-medium">
 Disclaimer: This app does not diagnose or treat medical conditions.
 </Text>
 </View>

 </ScrollView>
 </SafeAreaView>
 );
};

export default LandingScreen;



