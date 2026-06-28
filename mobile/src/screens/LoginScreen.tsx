import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, ShieldAlert, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { PulseLogo } from '../components/PulseLogo';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AnimatedBackground } from '../components/AnimatedBackground';

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen = () => {
  const { login, setGoogleUser } = useAuth();
  const navigation = useNavigation<any>();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    responseType: 'id_token',
    redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT,
    extraParams: {
      state: AuthSession.makeRedirectUri() + '--/googleauth'
    }
  });

  const handleGoogleLogin = async () => {
    if (!request || !request.url) {
      Alert.alert("Error", "Google Auth is not ready yet.");
      return;
    }
    try {
      const returnUrl = AuthSession.makeRedirectUri();
      // Inject the returnUrl into the state parameter by piping it |
      const modifiedUrl = request.url.replace(/(state=[^&]+)/, `$1|${encodeURIComponent(returnUrl)}`);
      
      const result = await WebBrowser.openAuthSessionAsync(modifiedUrl, returnUrl);
      
      if (result.type === 'success' && result.url) {
        processGoogleDeepLink(result.url);
      } else if (result.type !== 'cancel') {
        // Just log, don't alert unless error
        console.log("WebBrowser result:", result);
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to open Google Login: " + err?.message);
    }
  };

  const processGoogleDeepLink = (url: string) => {
    const idTokenMatch = url.match(/id_token=([^&]+)/);
    if (idTokenMatch && idTokenMatch[1]) {
      WebBrowser.dismissBrowser();
      handleGoogleCallback(idTokenMatch[1]);
    } else {
      Alert.alert("Deep Link Error", "Woke up but no id_token found: " + url);
    }
  };

  useEffect(() => {
    // Catch deep links if openAuthSessionAsync fails to intercept them
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log("MANUAL LISTENER CAUGHT URL:", url);
      if (url.includes('id_token=')) {
        processGoogleDeepLink(url);
      }
    });
    return () => subscription.remove();
  }, []);

  const handleGoogleCallback = async (idToken: string) => {
    setGoogleLoading(true);
    setError(null);
    try {
      // Use the custom api instance from services/api to ensure the URL is correct
      const api = require('../services/api').default;
      const res = await api.post('/api/auth/google', { token: idToken });
      
      if (res.data.token) {
        await SecureStore.setItemAsync('pulse_token', res.data.token);
        if (res.data.user) {
          await SecureStore.setItemAsync('pulse_user', JSON.stringify(res.data.user));
          setGoogleUser(res.data.user);
        }
      } else {
        throw new Error(res.data.message || 'No token returned from server');
      }
    } catch (err: any) {
      Alert.alert("Google Login Failed", err?.message || "Could not complete Google Sign-In.");
      console.log("GOOGLE LOGIN ERROR:", err);
      setError(err?.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-transparent">
      <StatusBar barStyle="default" />
      <AnimatedBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
          
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            className="absolute top-4 left-4 h-10 w-10 bg-white/80 rounded-full flex items-center justify-center border border-slate-200 z-50 shadow-sm backdrop-blur-sm"
          >
            <ChevronLeft color="#2563EB" size={20} />
          </TouchableOpacity>

          <View className="bg-white/90 border border-slate-200/50 rounded-[28px] p-6 relative overflow-hidden mt-8 shadow-xl">
            
            <View className="items-center mb-8 mt-2">
              <PulseLogo size={54} variant="vertical" showTagline={false} />
              <Text className="text-sm text-slate-500 mt-3 text-center font-medium">Access your intelligent health profile</Text>
            </View>

            {error && (
              <View className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl mb-6 flex-row items-center gap-3">
                <ShieldAlert size={18} color="#ef4444" />
                <Text className="text-sm font-semibold text-red-600 dark:text-red-400 flex-1">{error}</Text>
              </View>
            )}

            <View className="space-y-5 mb-8">
              <View>
                <Text className="text-[11px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest ml-1">Email or Mobile</Text>
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
                    className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 font-bold text-base"
                  />
                </View>
              </View>

              <View>
                <View className="flex-row justify-between items-center mb-2 ml-1">
                  <Text className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Password</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Forgot')}>
                    <Text className="text-xs text-primary font-black">Forgot?</Text>
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
                    className="w-full pl-12 pr-12 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 font-bold text-base"
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
              <Text className="text-white text-base font-black">{loading ? 'Authenticating...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-center my-6 opacity-40">
              <View className="flex-1 h-[1px] bg-slate-300 dark:bg-slate-600" />
              <Text className="mx-4 text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase">Or</Text>
              <View className="flex-1 h-[1px] bg-slate-300 dark:bg-slate-600" />
            </View>

            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={loading || googleLoading}
              className={`w-full h-14 rounded-2xl flex-row items-center justify-center gap-3 bg-white border border-slate-200 shadow-sm ${googleLoading ? 'opacity-50' : 'opacity-100'}`}
            >
              {googleLoading ? (
                <ActivityIndicator color="#64748b" />
              ) : (
                <>
                  <Text className="font-extrabold text-xl text-slate-800">G</Text>
                  <Text className="text-slate-800 text-sm font-bold">Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center justify-center gap-1.5 mt-8">
              <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">New to Pulse?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text className="text-sm text-primary font-black">Create an account</Text>
              </TouchableOpacity>
            </View>
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
