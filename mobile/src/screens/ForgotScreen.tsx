import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { useNavigation } from '@react-navigation/native';
import { ShieldAlert, Mail, KeyRound, Lock, CheckCircle2, ArrowLeft, LogIn, MessageSquare } from 'lucide-react-native';
import { PulseLogo } from '../components/PulseLogo';
import { authAPI } from '../services/api';

type RecoveryStep = 'METHOD' | 'OTP' | 'RESET' | 'SUCCESS';

export const ForgotScreen = () => {
 const navigation = useNavigation<any>();
 const [step, setStep] = useState<RecoveryStep>('METHOD');
 const [email, setEmail] = useState('');
 const [otpCode, setOtpCode] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [resetToken, setResetToken] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const [cooldown, setCooldown] = useState(0);

 React.useEffect(() => {
 let timer: any;
 if (cooldown > 0) {
 timer = setInterval(() => setCooldown(c => c - 1), 1000);
 }
 return () => clearInterval(timer);
 }, [cooldown]);

 const handleRequestCode = async () => {
 setError(null);
 setLoading(true);
 try {
 if (!email) throw new Error('Please enter your registered email address.');
 await authAPI.requestEmailOTP(email);
 setCooldown(30);
 setStep('OTP');
 } catch (err: any) {
 setError(err.response?.data?.message || err.message || 'Verification request failed. Try again.');
 } finally {
 setLoading(false);
 }
 };

 const handleVerifyOTP = async () => {
 if (!otpCode || otpCode.length !== 6) {
 setError('Please enter the 6-digit verification code.');
 return;
 }
 setError(null);
 setLoading(true);
 try {
 const result = await authAPI.verifyEmailOTP(email, otpCode);
 setResetToken(result.resetToken);
 setStep('RESET');
 } catch (err: any) {
 setError(err.response?.data?.message || err.message || 'Invalid or expired verification code.');
 } finally {
 setLoading(false);
 }
 };

 const handleResetPassword = async () => {
 const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
 if (!PASSWORD_REGEX.test(newPassword)) {
 setError('Password must be at least 8 characters, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
 return;
 }
 if (newPassword !== confirmPassword) {
 setError('Passwords do not match. Please verify.');
 return;
 }
 setError(null);
 setLoading(true);
 try {
 await authAPI.resetPassword({ newPassword, resetToken: resetToken || undefined });
 setStep('SUCCESS');
 } catch (err: any) {
 setError(err.response?.data?.message || err.message || 'Failed to update password.');
 } finally {
 setLoading(false);
 }
 };

 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
 <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
 <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 relative overflow-hidden">
 
 <View className="items-center mb-6">
 <PulseLogo size={54} variant="vertical" showTagline={true} />
 <Text className="text-sm font-bold text-foreground mt-2">Password Recovery</Text>
 </View>

 {error && (
 <View className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl mb-4 flex-row items-center gap-2">
 <ShieldAlert size={16} color="#ef4444" />
 <Text className="text-xs text-destructive flex-1">{error}</Text>
 </View>
 )}

 {step === 'METHOD' && (
 <View className="space-y-4 mb-6">
 <View>
 <Text className="text-xs font-semibold text-muted-foreground mb-1">Registered Email Address</Text>
 <View className="relative justify-center">
 <View className="absolute left-3 z-10"><Mail size={16} color="#64748b" /></View>
 <TextInput value={email} onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor="#94a3b8" autoCapitalize="none" keyboardType="email-address" className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-border rounded-xl text-foreground font-medium" />
 </View>
 </View>
 <TouchableOpacity onPress={handleRequestCode} disabled={loading} className={`w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 mt-2 ${loading ? 'bg-primary/50' : 'bg-primary'}`}>
 {loading ? <ActivityIndicator color="white" /> : <MessageSquare size={16} color="white" />}
 <Text className="text-white text-xs font-bold">{loading ? 'Sending Verification Code...' : 'Send Recovery OTP'}</Text>
 </TouchableOpacity>
 </View>
 )}

 {step === 'OTP' && (
 <View className="space-y-4 mb-6">
 <View className="p-4 bg-primary/5 border border-primary/10 rounded-2xl mb-2 items-center">
 <Text className="text-xs text-foreground text-center">Enter the code sent to</Text>
 <Text className="text-xs font-bold text-foreground text-center">{email}</Text>
 </View>
 <View>
 <Text className="text-xs font-semibold text-muted-foreground mb-1">Verification Code</Text>
 <View className="relative justify-center">
 <View className="absolute left-3 z-10"><KeyRound size={16} color="#64748b" /></View>
 <TextInput value={otpCode} onChangeText={(v) => setOtpCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="000000" placeholderTextColor="#94a3b8" keyboardType="number-pad" maxLength={6} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-border rounded-xl text-foreground font-bold tracking-[8px] text-center" />
 </View>
 </View>
 <TouchableOpacity onPress={handleVerifyOTP} disabled={loading} className={`w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 mt-2 ${loading ? 'bg-primary/50' : 'bg-primary'}`}>
 {loading ? <ActivityIndicator color="white" /> : <CheckCircle2 size={16} color="white" />}
 <Text className="text-white text-xs font-bold">{loading ? 'Confirming Code...' : 'Verify Code'}</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={handleRequestCode} disabled={cooldown > 0 || loading} className="w-full py-2.5 mt-2 rounded-xl border border-border items-center justify-center">
 <Text className={`text-xs font-bold ${cooldown > 0 ? 'text-muted-foreground' : 'text-foreground'}`}>{cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend OTP Code'}</Text>
 </TouchableOpacity>
 </View>
 )}

 {step === 'RESET' && (
 <View className="space-y-4 mb-6">
 <View>
 <Text className="text-xs font-semibold text-muted-foreground mb-1">New Password</Text>
 <View className="relative justify-center">
 <View className="absolute left-3 z-10"><Lock size={16} color="#64748b" /></View>
 <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="Create a strong password" placeholderTextColor="#94a3b8" secureTextEntry className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-border rounded-xl text-foreground font-medium" />
 </View>
 </View>
 <View>
 <Text className="text-xs font-semibold text-muted-foreground mb-1">Confirm New Password</Text>
 <View className="relative justify-center">
 <View className="absolute left-3 z-10"><Lock size={16} color="#64748b" /></View>
 <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor="#94a3b8" secureTextEntry className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-border rounded-xl text-foreground font-medium" />
 </View>
 </View>
 <TouchableOpacity onPress={handleResetPassword} disabled={loading} className={`w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 mt-2 ${loading ? 'bg-primary/50' : 'bg-primary'}`}>
 {loading ? <ActivityIndicator color="white" /> : <CheckCircle2 size={16} color="white" />}
 <Text className="text-white text-xs font-bold">{loading ? 'Updating Password...' : 'Save New Password'}</Text>
 </TouchableOpacity>
 </View>
 )}

 {step === 'SUCCESS' && (
 <View className="space-y-5 text-center py-4 items-center">
 <View className="w-16 h-16 bg-green-500/10 rounded-full items-center justify-center mb-4 border border-green-500/20">
 <CheckCircle2 size={32} color="#22c55e" />
 </View>
 <Text className="text-sm font-bold text-foreground">Password Updated!</Text>
 <Text className="text-xs text-muted-foreground text-center">Your password has been successfully reset. You can now log in using your new credentials.</Text>
 <TouchableOpacity onPress={() => navigation.navigate('Login')} className="w-full py-3.5 mt-4 rounded-xl bg-primary flex-row items-center justify-center gap-2">
 <LogIn size={16} color="white" />
 <Text className="text-white text-xs font-bold">Back to Login</Text>
 </TouchableOpacity>
 </View>
 )}

 {step !== 'SUCCESS' && (
 <TouchableOpacity onPress={() => {
 if (step === 'METHOD') navigation.navigate('Login');
 else { setStep('METHOD'); setOtpCode(''); setError(null); }
 }} className="flex-row items-center justify-center gap-1 mt-4">
 <ArrowLeft size={14} color="#64748b" />
 <Text className="text-xs text-muted-foreground font-semibold">
 {step === 'METHOD' ? 'Return to Sign In' : 'Back'}
 </Text>
 </TouchableOpacity>
 )}
 
 </View>
 </ScrollView>
 </KeyboardAvoidingView>
 </SafeAreaView>
 );
};

export default ForgotScreen;



