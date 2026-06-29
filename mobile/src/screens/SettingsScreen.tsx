import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Moon, Bell, Shield, Map, Key, ArrowLeft, Sun, Info, FileText, Mail } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

export const SettingsScreen = () => {
 const { user } = useAuth();
 const navigation = useNavigation<any>();

 // Preferences
 const [isDarkMode, setIsDarkMode] = useState(false);
 const [notifyOcr, setNotifyOcr] = useState(true);
 const [notifyWeekly, setNotifyWeekly] = useState(false);
 const [notifyEmergency, setNotifyEmergency] = useState(true);
 const [autoPurgePdf, setAutoPurgePdf] = useState(true);
 const [cacheCoords, setCacheCoords] = useState(true);

 useEffect(() => {
 const loadPrefs = async () => {
 const dark = await SecureStore.getItemAsync('pulse_pref_dark_mode');
 if (dark) setIsDarkMode(dark === 'true');
 
 const ocr = await SecureStore.getItemAsync('pulse_pref_notify_ocr');
 if (ocr) setNotifyOcr(ocr === 'true');
 
 const weekly = await SecureStore.getItemAsync('pulse_pref_notify_weekly');
 if (weekly) setNotifyWeekly(weekly === 'true');
 
 const purge = await SecureStore.getItemAsync('pulse_pref_auto_purge');
 if (purge) setAutoPurgePdf(purge === 'true');
 };
 loadPrefs();
 }, []);

 const savePref = async (key: string, value: boolean) => {
 await SecureStore.setItemAsync(key, value.toString());
 };

 return (
 <SafeAreaView className="flex-1 bg-background">
 <View className="px-5 py-4 border-b border-border bg-white dark:bg-slate-900 flex-row items-center ">
 <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
 <ArrowLeft size={20} color="#64748b" />
 </TouchableOpacity>
 <Text className="text-lg font-extrabold text-foreground">App Settings</Text>
 </View>
 
 <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
 
 {/* Appearance */}
 <Text className="text-sm font-bold text-foreground mb-3 mt-2 flex-row items-center">Visual & Maps</Text>
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-2 mb-6">
 <View className="flex-row items-center justify-between p-3 border-b border-border">
 <View className="flex-row items-center gap-3">
 <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
 {isDarkMode ? <Moon size={16} color="#1E60D5" /> : <Sun size={16} color="#1E60D5" />}
 </View>
 <View>
 <Text className="text-xs font-bold text-foreground">Dark Mode</Text>
 <Text className="text-[10px] text-muted-foreground mt-0.5">Applies to UI and Map style</Text>
 </View>
 </View>
 <Switch 
 value={isDarkMode} 
 onValueChange={(val) => {
 setIsDarkMode(val);
 savePref('pulse_pref_dark_mode', val);
 }} 
 />
 </View>
 <View className="flex-row items-center justify-between p-3">
 <View className="flex-row items-center gap-3">
 <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
 <Map size={16} color="#1E60D5" />
 </View>
 <View>
 <Text className="text-xs font-bold text-foreground">Cache Coordinates</Text>
 <Text className="text-[10px] text-muted-foreground mt-0.5">Improves map loading speeds</Text>
 </View>
 </View>
 <Switch 
 value={cacheCoords} 
 onValueChange={(val) => {
 setCacheCoords(val);
 savePref('pulse_pref_cache_coords', val);
 }} 
 />
 </View>
 </View>

 {/* Notifications */}
 <Text className="text-sm font-bold text-foreground mb-3 flex-row items-center">Notifications</Text>
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-2 mb-6">
 <View className="flex-row items-center justify-between p-3 border-b border-border">
 <View className="flex-row items-center gap-3 pr-4 flex-1">
 <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
 <Bell size={16} color="#1E60D5" />
 </View>
 <View>
 <Text className="text-xs font-bold text-foreground">AI Analysis Complete</Text>
 <Text className="text-[10px] text-muted-foreground mt-0.5" numberOfLines={2}>Get alerted when server finishes OCR processing</Text>
 </View>
 </View>
 <Switch 
 value={notifyOcr} 
 onValueChange={(val) => {
 setNotifyOcr(val);
 savePref('pulse_pref_notify_ocr', val);
 }} 
 />
 </View>
 <View className="flex-row items-center justify-between p-3 border-b border-border">
 <View className="flex-row items-center gap-3 pr-4 flex-1">
 <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
 <Bell size={16} color="#1E60D5" />
 </View>
 <View>
 <Text className="text-xs font-bold text-foreground">Weekly Health Summary</Text>
 <Text className="text-[10px] text-muted-foreground mt-0.5" numberOfLines={2}>Receive trend alerts on your biomarkers</Text>
 </View>
 </View>
 <Switch 
 value={notifyWeekly} 
 onValueChange={(val) => {
 setNotifyWeekly(val);
 savePref('pulse_pref_notify_weekly', val);
 }} 
 />
 </View>
 <View className="flex-row items-center justify-between p-3">
 <View className="flex-row items-center gap-3 pr-4 flex-1">
 <View className="w-8 h-8 rounded-lg bg-danger/10 items-center justify-center">
 <Shield size={16} color="#ef4444" />
 </View>
 <View>
 <Text className="text-xs font-bold text-foreground">Emergency Contact Mod</Text>
 <Text className="text-[10px] text-muted-foreground mt-0.5" numberOfLines={2}>Alert when contacts are updated</Text>
 </View>
 </View>
 <Switch 
 value={notifyEmergency} 
 onValueChange={(val) => {
 setNotifyEmergency(val);
 savePref('pulse_pref_notify_emergency', val);
 }} 
 />
 </View>
 </View>

 {/* Privacy */}
 <Text className="text-sm font-bold text-foreground mb-3 flex-row items-center">Privacy & Security</Text>
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-2 mb-6">
 <View className="flex-row items-center justify-between p-3 border-b border-border">
 <View className="flex-row items-center gap-3 pr-4 flex-1">
 <View className="w-8 h-8 rounded-lg bg-emerald-500/10 items-center justify-center">
 <Shield size={16} color="#10b981" />
 </View>
 <View>
 <View className="flex-row items-center gap-2">
 <Text className="text-xs font-bold text-foreground">Auto-Purge PDFs</Text>
 <Text className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1 py-0.5 rounded font-bold uppercase">HIPAA</Text>
 </View>
 <Text className="text-[10px] text-muted-foreground mt-0.5" numberOfLines={2}>Delete raw files after AI extraction finishes</Text>
 </View>
 </View>
 <Switch 
 value={autoPurgePdf} 
 onValueChange={(val) => {
 setAutoPurgePdf(val);
 savePref('pulse_pref_auto_purge', val);
 }} 
 />
 </View>
 </View>

 {/* Support & Legal */}
 <Text className="text-sm font-bold text-foreground mb-3 flex-row items-center">Support & Legal</Text>
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-2 mb-6">
 <TouchableOpacity onPress={() => navigation.navigate('About')} className="flex-row items-center justify-between p-3 border-b border-border">
 <View className="flex-row items-center gap-3">
 <View className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center"><Info size={16} color="#64748b" /></View>
 <Text className="text-xs font-bold text-foreground">About Pulse</Text>
 </View>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => navigation.navigate('Contact')} className="flex-row items-center justify-between p-3 border-b border-border">
 <View className="flex-row items-center gap-3">
 <View className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center"><Mail size={16} color="#64748b" /></View>
 <Text className="text-xs font-bold text-foreground">Contact Us</Text>
 </View>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => navigation.navigate('Privacy')} className="flex-row items-center justify-between p-3 border-b border-border">
 <View className="flex-row items-center gap-3">
 <View className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center"><Shield size={16} color="#64748b" /></View>
 <Text className="text-xs font-bold text-foreground">Privacy Policy</Text>
 </View>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => navigation.navigate('Terms')} className="flex-row items-center justify-between p-3">
 <View className="flex-row items-center gap-3">
 <View className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center"><FileText size={16} color="#64748b" /></View>
 <Text className="text-xs font-bold text-foreground">Terms of Service</Text>
 </View>
 </TouchableOpacity>
 </View>

 </ScrollView>
 </SafeAreaView>
 );
};

export default SettingsScreen;
