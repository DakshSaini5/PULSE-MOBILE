import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Moon, Bell, Shield, Map, Key, ArrowLeft, Sun, Info, FileText, Mail, Plus, Trash2, HeartPulse, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { emergencyAPI, EmergencyContact } from '../services/api';

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

 // Emergency Contacts State
 const [contacts, setContacts] = useState<EmergencyContact[]>([]);
 const [isLoadingContacts, setIsLoadingContacts] = useState(true);
 const [showAddContactModal, setShowAddContactModal] = useState(false);
 const [newContactName, setNewContactName] = useState('');
 const [newContactPhone, setNewContactPhone] = useState('');
 const [newContactRelation, setNewContactRelation] = useState('');
 const [isSubmittingContact, setIsSubmittingContact] = useState(false);

 useEffect(() => {
   const fetchContacts = async () => {
     try {
       const data = await emergencyAPI.getContacts();
       setContacts(data);
     } catch (err) {
       console.error('Error fetching emergency contacts', err);
     } finally {
       setIsLoadingContacts(false);
     }
   };
   fetchContacts();
 }, []);

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

 const handleAddContact = async () => {
   if (!newContactName || !newContactPhone || !newContactRelation) {
     Alert.alert('Error', 'Please fill all fields');
     return;
   }
   setIsSubmittingContact(true);
   try {
     const newContact = await emergencyAPI.addContact({
       name: newContactName,
       phoneNumber: newContactPhone,
       relationship: newContactRelation
     });
     setContacts([...contacts, newContact]);
     setShowAddContactModal(false);
     setNewContactName('');
     setNewContactPhone('');
     setNewContactRelation('');
   } catch (err) {
     Alert.alert('Error', 'Failed to add contact');
   } finally {
     setIsSubmittingContact(false);
   }
 };

 const handleDeleteContact = (id: string) => {
   Alert.alert('Delete Contact', 'Are you sure you want to remove this emergency contact?', [
     { text: 'Cancel', style: 'cancel' },
     { text: 'Delete', style: 'destructive', onPress: async () => {
       try {
         await emergencyAPI.deleteContact(id);
         setContacts(contacts.filter(c => c.id !== id));
       } catch (err) {
         Alert.alert('Error', 'Failed to delete contact');
       }
     }}
   ]);
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
 
 {/* Emergency Contacts */}
 <Text className="text-sm font-bold text-foreground mb-3 flex-row items-center">Emergency Contacts</Text>
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl mb-6 overflow-hidden">
   {isLoadingContacts ? (
     <View className="p-6 items-center justify-center">
       <ActivityIndicator color="#2563EB" />
     </View>
   ) : contacts.length === 0 ? (
     <View className="p-6 items-center justify-center">
       <View className="w-12 h-12 bg-red-50 rounded-full items-center justify-center mb-3">
         <HeartPulse size={24} color="#ef4444" />
       </View>
       <Text className="text-sm font-bold text-slate-800 text-center mb-1">No Emergency Contacts</Text>
       <Text className="text-xs text-slate-500 text-center mb-4">Add a trusted contact to alert in emergencies.</Text>
       <TouchableOpacity 
         onPress={() => setShowAddContactModal(true)}
         className="bg-red-500 flex-row items-center px-4 py-2 rounded-xl"
       >
         <Plus size={16} color="#ffffff" className="mr-2" />
         <Text className="text-white font-bold text-sm">Add Contact</Text>
       </TouchableOpacity>
     </View>
   ) : (
     <>
       {contacts.map((contact, idx) => (
         <View key={contact.id} className={`flex-row items-center justify-between p-4 ${idx !== contacts.length - 1 ? 'border-b border-border' : ''}`}>
           <View className="flex-row items-center gap-3">
             <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
               <User size={18} color="#64748b" />
             </View>
             <View>
               <Text className="text-sm font-bold text-slate-900">{contact.name}</Text>
               <View className="flex-row items-center mt-1">
                 <Text className="text-xs text-slate-500 font-medium">{contact.relationship}</Text>
                 <Text className="text-xs text-slate-300 mx-2">•</Text>
                 <Text className="text-xs text-slate-500">{contact.phoneNumber}</Text>
               </View>
             </View>
           </View>
           <TouchableOpacity onPress={() => handleDeleteContact(contact.id)} className="p-2 bg-red-50 rounded-lg">
             <Trash2 size={16} color="#ef4444" />
           </TouchableOpacity>
         </View>
       ))}
       <TouchableOpacity 
         onPress={() => setShowAddContactModal(true)}
         className="flex-row items-center justify-center p-4 border-t border-border bg-slate-50"
       >
         <Plus size={16} color="#2563EB" className="mr-2" />
         <Text className="text-blue-600 font-bold text-sm">Add Another Contact</Text>
       </TouchableOpacity>
     </>
   )}
 </View>
 
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

 {/* Add Contact Modal */}
 <Modal visible={showAddContactModal} transparent animationType="fade">
   <View className="flex-1 bg-black/50 justify-center px-6">
     <View className="bg-white rounded-3xl p-6 shadow-2xl">
       <View className="items-center mb-6">
         <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center mb-3">
           <HeartPulse size={24} color="#ef4444" />
         </View>
         <Text className="text-xl font-bold text-slate-900">Add Emergency Contact</Text>
         <Text className="text-sm text-slate-500 text-center mt-1">This person will be alerted if you use the SOS Panic Button.</Text>
       </View>

       <Text className="text-xs font-bold text-slate-700 mb-1.5 ml-1">Full Name</Text>
       <TextInput 
         value={newContactName}
         onChangeText={setNewContactName}
         placeholder="e.g. Jane Doe"
         className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 text-slate-900 font-medium"
       />

       <Text className="text-xs font-bold text-slate-700 mb-1.5 ml-1">Phone Number</Text>
       <TextInput 
         value={newContactPhone}
         onChangeText={setNewContactPhone}
         placeholder="e.g. +1 234 567 8900"
         keyboardType="phone-pad"
         className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 text-slate-900 font-medium"
       />

       <Text className="text-xs font-bold text-slate-700 mb-1.5 ml-1">Relationship</Text>
       <TextInput 
         value={newContactRelation}
         onChangeText={setNewContactRelation}
         placeholder="e.g. Mother, Spouse"
         className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 text-slate-900 font-medium"
       />

       <View className="flex-row gap-3">
         <TouchableOpacity 
           onPress={() => setShowAddContactModal(false)}
           className="flex-1 bg-slate-100 py-3.5 rounded-xl items-center justify-center"
         >
           <Text className="font-bold text-slate-600">Cancel</Text>
         </TouchableOpacity>
         <TouchableOpacity 
           onPress={handleAddContact}
           disabled={isSubmittingContact}
           className="flex-1 bg-red-500 py-3.5 rounded-xl items-center justify-center"
         >
           {isSubmittingContact ? (
             <ActivityIndicator color="#fff" />
           ) : (
             <Text className="font-bold text-white">Save Contact</Text>
           )}
         </TouchableOpacity>
       </View>
     </View>
   </View>
 </Modal>

 </SafeAreaView>
 );
};

export default SettingsScreen;
