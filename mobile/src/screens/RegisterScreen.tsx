import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, ShieldAlert, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { PulseLogo } from '../components/PulseLogo';
import { authAPI } from '../services/api';

export const RegisterScreen = () => {
 const { register, googleLogin } = useAuth();
 const navigation = useNavigation<any>();
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [mobileNumber, setMobileNumber] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const [googleLoading, setGoogleLoading] = useState(false);
 const [step, setStep] = useState<'INPUT' | 'OTP'>('INPUT');
 const [code, setCode] = useState('');
 const [resendCooldown, setResendCooldown] = useState(0);

 useEffect(() => {
 let timer: any;
 if (resendCooldown > 0) {
 timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
 }
 return () => {
 if (timer) clearTimeout(timer);
 };
 }, [resendCooldown]);

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

 const handleRequestOTP = async () => {
 if (!name || !email || !mobileNumber || !password) {
 setError('Please fill in all registration fields.');
 return;
 }
 
 if (mobileNumber.length !== 10) {
 setError('Please enter a valid 10-digit mobile number.');
 return;
 }

 const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
 if (!PASSWORD_REGEX.test(password)) {
 setError('Password must be at least 8 characters, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
 return;
 }

 setLoading(true);
 setError(null);
 try {
 await authAPI.sendRegisterOTP(email);
 setStep('OTP');
 setResendCooldown(30);
 } catch (err: any) {
 setError(err.response?.data?.message || 'Failed to send verification code. Please check your email.');
 } finally {
 setLoading(false);
 }
 };

 const handleResendOTP = async () => {
 setLoading(true);
 setError(null);
 try {
 await authAPI.sendRegisterOTP(email);
 setResendCooldown(30);
 } catch (err: any) {
 setError(err.response?.data?.message || 'Failed to send verification code.');
 } finally {
 setLoading(false);
 }
 };

 const handleVerifyOTP = async () => {
 if (code.length !== 6) {
 setError('Please enter the 6-digit verification code.');
 return;
 }

 const fullMobileNumber = `+91${mobileNumber}`;

 setLoading(true);
 setError(null);
 try {
 await register(name, email, fullMobileNumber, password, code);
 // Navigation happens automatically since context user is updated
 } catch (err: any) {
 setError(err.response?.data?.message || 'Registration failed. Try checking your inputs.');
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
 
 <View className="items-center mb-6">
 <PulseLogo size={54} variant="vertical" showTagline={false} />
 <Text className="text-sm text-muted-foreground mt-3 text-center font-medium">Create your intelligent health profile</Text>
 </View>

 {error && (
 <View className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl mb-6 flex-row items-center gap-3">
 <ShieldAlert size={18} color="#ef4444" />
 <Text className="text-sm font-semibold text-destructive flex-1">{error}</Text>
 </View>
 )}

 {step === 'INPUT' ? (
 <View className="space-y-4 mb-6">
 <View>
 <Text className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider ml-1">Full Name</Text>
 <View className="relative justify-center">
 <View className="absolute left-4 z-10"><User size={18} color="#94a3b8" /></View>
 <TextInput value={name} onChangeText={setName} placeholder="Enter your name" placeholderTextColor="#94a3b8" className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground font-semibold text-base" />
 </View>
 </View>

 <View>
 <Text className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider ml-1">Email Address</Text>
 <View className="relative justify-center">
 <View className="absolute left-4 z-10"><Mail size={18} color="#94a3b8" /></View>
 <TextInput value={email} onChangeText={setEmail} placeholder="john@example.com" placeholderTextColor="#94a3b8" autoCapitalize="none" keyboardType="email-address" className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground font-semibold text-base" />
 </View>
 </View>

 <View>
 <Text className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider ml-1">Mobile Number</Text>
 <View className="relative justify-center flex-row">
 <View className="absolute left-0 z-10 h-full justify-center px-4 border-r border-border flex-row items-center">
 <Text className="text-sm font-bold text-muted-foreground">🇮🇳 +91</Text>
 </View>
 <TextInput value={mobileNumber} onChangeText={(v) => setMobileNumber(v.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" placeholderTextColor="#94a3b8" keyboardType="phone-pad" className="w-full pl-20 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground font-semibold text-base" />
 </View>
 </View>

 <View>
 <Text className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider ml-1">Password</Text>
 <View className="relative justify-center">
 <View className="absolute left-4 z-10"><Lock size={18} color="#94a3b8" /></View>
 <TextInput value={password} onChangeText={setPassword} placeholder="Strong password" placeholderTextColor="#94a3b8" secureTextEntry={!showPassword} className="w-full pl-12 pr-12 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground font-semibold text-base" />
 <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="absolute right-4 z-10">
 {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
 </TouchableOpacity>
 </View>
 </View>

 <TouchableOpacity onPress={handleRequestOTP} disabled={loading || googleLoading} className={`w-full h-14 rounded-2xl flex-row items-center justify-center gap-2 mt-4 ${loading ? 'bg-primary/50' : 'bg-primary'}`}>
 {loading ? <ActivityIndicator color="white" /> : <Mail size={18} color="white" />}
 <Text className="text-white text-base font-extrabold">{loading ? 'Sending Code...' : 'Send Verification Code'}</Text>
 </TouchableOpacity>

 <View className="flex-row items-center justify-center my-6 opacity-40">
 <View className="flex-1 h-[1px] bg-border" />
 <Text className="mx-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Or</Text>
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
 <Text className="font-extrabold text-xl text-foreground">G</Text>
 )}
 <Text className="text-foreground text-sm font-bold ml-1">Continue with Google</Text>
 </TouchableOpacity>
 </View>
 ) : (
 <View className="space-y-5 mb-6">
 <View className="items-center mb-4">
 <Text className="text-sm text-muted-foreground mb-2">We sent a 6-digit code to</Text>
 <View className="bg-secondary/50 px-4 py-2 rounded-xl border border-border">
 <Text className="text-sm font-bold text-foreground">{email}</Text>
 </View>
 </View>

 <View>
 <Text className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider ml-1">Verification Code</Text>
 <View className="relative justify-center">
 <View className="absolute left-4 z-10"><Lock size={18} color="#94a3b8" /></View>
 <TextInput value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="------" placeholderTextColor="#94a3b8" keyboardType="number-pad" maxLength={6} className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground font-bold tracking-[12px] text-center text-lg" />
 </View>
 </View>

 <TouchableOpacity onPress={handleVerifyOTP} disabled={loading || code.length !== 6} className={`w-full h-14 rounded-2xl flex-row items-center justify-center gap-2 mt-4 ${(loading || code.length !== 6) ? 'bg-primary/50' : 'bg-primary'}`}>
 {loading ? <ActivityIndicator color="white" /> : <UserPlus size={18} color="white" />}
 <Text className="text-white text-base font-extrabold">{loading ? 'Verifying...' : 'Verify & Create Account'}</Text>
 </TouchableOpacity>

 <View className="flex-row items-center justify-between mt-4">
 <TouchableOpacity onPress={() => { setStep('INPUT'); setError(null); }}>
 <Text className="text-sm text-muted-foreground font-semibold">← Edit details</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={handleResendOTP} disabled={resendCooldown > 0 || loading}>
 <Text className={`text-sm font-bold ${resendCooldown > 0 ? 'text-muted-foreground/40' : 'text-primary'}`}>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</Text>
 </TouchableOpacity>
 </View>
 </View>
 )}

 <View className="flex-row items-center justify-center gap-1.5 mt-6">
 <Text className="text-sm text-muted-foreground">Already have a login?</Text>
 <TouchableOpacity onPress={() => navigation.navigate('Login')}>
 <Text className="text-sm text-primary font-bold">Sign In Instead</Text>
 </TouchableOpacity>
 </View>
 
 </View>
 </ScrollView>
 </KeyboardAvoidingView>
 </SafeAreaView>
 );
};

export default RegisterScreen;
