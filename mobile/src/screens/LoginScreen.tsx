import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, ShieldAlert, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { PulseLogo } from '../components/PulseLogo';

export const LoginScreen = () => {
 const { login, googleLogin } = useAuth();
 const navigation = useNavigation<any>();
 const [identifier, setIdentifier] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const [googleLoading, setGoogleLoading] = useState(false);

 const handleGoogleLogin = async () => {
 setGoogleLoading(true);
 setError(null);
 try {
 await googleLogin();
 } catch (err: any) {
 setError(err.message || 'Google Sign-In failed.');
 } finally {
 setGoogleLoading(false);
 }
 };

 const handleSubmit = async () => {
 if (!identifier || !password) {
 setError('Please fill in all credential fields.');
 return;
 }
 setLoading(true);
 setError(null);
 try {
 await login(identifier, password);
 } catch (err: any) {
 setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
 } finally {
 setLoading(false);
 }
 };

 return (
 <SafeAreaView className="flex-1 bg-background">
 <StatusBar barStyle="default" />
 <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
 <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
 
 <TouchableOpacity 
 onPress={() => navigation.goBack()} 
 className="absolute top-4 left-4 h-10 w-10 bg-secondary/50 rounded-full flex items-center justify-center border border-border z-50"
 >
 <ChevronLeft color="#2563EB" size={20} />
 </TouchableOpacity>

 <View className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden mt-8">
 
 <View className="items-center mb-8 mt-2">
 <PulseLogo size={54} variant="vertical" showTagline={false} />
 <Text className="text-sm text-muted-foreground mt-3 text-center font-medium">Welcome back to intelligent healthcare</Text>
 </View>

 {error && (
 <View className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl mb-6 flex-row items-center gap-3">
 <ShieldAlert size={18} color="#ef4444" />
 <Text className="text-sm font-semibold text-destructive flex-1">{error}</Text>
 </View>
 )}

 <View className="space-y-5 mb-8">
 <View>
 <Text className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider ml-1">Email or Mobile</Text>
 <View className="relative justify-center">
 <View className="absolute left-4 z-10">
 <Mail size={18} color="#94a3b8" />
 </View>
 <TextInput
 value={identifier}
 onChangeText={setIdentifier}
 placeholder="name@example.com"
 placeholderTextColor="#94a3b8"
 autoCapitalize="none"
 className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground font-semibold text-base"
 />
 </View>
 </View>

 <View>
 <View className="flex-row justify-between items-center mb-2 ml-1">
 <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</Text>
 <TouchableOpacity onPress={() => navigation.navigate('Forgot')}>
 <Text className="text-xs text-primary font-bold">Forgot?</Text>
 </TouchableOpacity>
 </View>
 <View className="relative justify-center">
 <View className="absolute left-4 z-10">
 <Lock size={18} color="#94a3b8" />
 </View>
 <TextInput
 value={password}
 onChangeText={setPassword}
 placeholder="••••••••••••"
 placeholderTextColor="#94a3b8"
 secureTextEntry={!showPassword}
 className="w-full pl-12 pr-12 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground font-semibold text-base"
 />
 <TouchableOpacity 
 onPress={() => setShowPassword(!showPassword)}
 className="absolute right-4 z-10"
 >
 {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
 </TouchableOpacity>
 </View>
 </View>
 </View>

 <TouchableOpacity
 onPress={handleSubmit}
 disabled={loading || googleLoading}
 className={`w-full h-14 rounded-2xl flex-row items-center justify-center gap-2 ${loading ? 'bg-primary/50' : 'bg-primary'}`}
 >
 {loading ? <ActivityIndicator color="white" /> : <LogIn size={18} color="white" />}
 <Text className="text-white text-base font-extrabold">{loading ? 'Authenticating...' : 'Sign In'}</Text>
 </TouchableOpacity>

 <View className="flex-row items-center justify-center my-6 opacity-40">
 <View className="flex-1 h-[1px] bg-border" />
 <Text className="mx-4 text-xs font-bold text-muted-foreground tracking-widest uppercase">Or</Text>
 <View className="flex-1 h-[1px] bg-border" />
 </View>

 <TouchableOpacity
 onPress={handleGoogleLogin}
 disabled={loading || googleLoading}
 className={`w-full h-14 rounded-2xl flex-row items-center justify-center gap-3 border border-border bg-secondary/50 ${googleLoading ? 'opacity-50' : 'opacity-100'}`}
 >
 {googleLoading ? (
 <ActivityIndicator color="#64748b" />
 ) : (
 <>
 <Text className="font-extrabold text-xl text-foreground">G</Text>
 <Text className="text-foreground text-sm font-bold">Continue with Google</Text>
 </>
 )}
 </TouchableOpacity>

 <View className="flex-row items-center justify-center gap-1.5 mt-8">
 <Text className="text-sm text-muted-foreground">New to Pulse?</Text>
 <TouchableOpacity onPress={() => navigation.navigate('Register')}>
 <Text className="text-sm text-primary font-bold">Create an account</Text>
 </TouchableOpacity>
 </View>
 
 </View>
 </ScrollView>
 </KeyboardAvoidingView>
 </SafeAreaView>
 );
};

export default LoginScreen;
