import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { userAPI, emergencyAPI, UserProfile, EmergencyContact } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Activity, FileText, Calendar, Shield, Lock, Trash2, LogOut, Settings as SettingsIcon, Save } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

export const ProfileScreen = () => {
 const { user, logout } = useAuth();
 const navigation = useNavigation<any>();

 const [profile, setProfile] = useState<UserProfile | null>(null);
 const [loading, setLoading] = useState(true);
 
 const [contacts, setContacts] = useState<EmergencyContact[]>([]);
 const [showEmergencyModal, setShowEmergencyModal] = useState(false);
 const [newContactName, setNewContactName] = useState('');
 const [newContactPhone, setNewContactPhone] = useState('');
 const [newContactRel, setNewContactRel] = useState('Family');

 const [isEditing, setIsEditing] = useState(false);
 const [editName, setEditName] = useState('');

 useEffect(() => {
 const fetchData = async () => {
 if (!user) return;
 try {
 const [profileData, contactsData] = await Promise.all([
 userAPI.getProfile(),
 emergencyAPI.getContacts()
 ]);
 setProfile(profileData);
 setEditName(profileData.name);
 setContacts(contactsData);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };
 fetchData();
 }, [user]);

 const handleUpdateProfile = async () => {
 if (!editName.trim()) return;
 try {
 const updated = await userAPI.updateProfile({ name: editName });
 setProfile(prev => prev ? { ...prev, ...updated } : null);
 setIsEditing(false);
 Alert.alert('Success', 'Profile updated successfully.');
 } catch (err) {
 Alert.alert('Error', 'Failed to update profile.');
 }
 };

 const handleAddContact = async () => {
 if (!newContactName || !newContactPhone) return;
 try {
 const res = await emergencyAPI.addContact({
 name: newContactName,
 phoneNumber: newContactPhone,
 relationship: newContactRel
 });
 setContacts(prev => [...prev, res]);
 setShowEmergencyModal(false);
 setNewContactName('');
 setNewContactPhone('');
 } catch (err) {
 Alert.alert('Error', 'Failed to add emergency contact.');
 }
 };

 const handleDeleteContact = async (id: string) => {
 Alert.alert('Delete Contact', 'Are you sure?', [
 { text: 'Cancel', style: 'cancel' },
 { text: 'Delete', style: 'destructive', onPress: async () => {
 try {
 await emergencyAPI.deleteContact(id);
 setContacts(prev => prev.filter(c => c.id !== id));
 } catch (err) {}
 }}
 ]);
 };

 const handleDeleteAccount = () => {
 Alert.alert('Delete Account', 'This is permanent and cannot be undone. All data will be lost.', [
 { text: 'Cancel', style: 'cancel' },
 { text: 'Delete My Account', style: 'destructive', onPress: async () => {
 try {
 await userAPI.deleteAccount();
 logout();
 } catch (err) {
 Alert.alert('Error', 'Failed to delete account.');
 }
 }}
 ]);
 };

 if (loading || !profile) {
 return (
 <SafeAreaView className="flex-1 bg-background justify-center items-center">
 <ActivityIndicator size="large" color="#1E60D5" />
 </SafeAreaView>
 );
 }

 return (
 <SafeAreaView className="flex-1 bg-background">
 <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
 
 <View className="flex-row justify-between items-center mb-6">
 <View>
 <Text className="text-2xl font-extrabold text-foreground">My Profile</Text>
 <Text className="text-xs text-muted-foreground">Manage your account and emergencies</Text>
 </View>
 <TouchableOpacity onPress={() => navigation.navigate('Settings')} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
 <SettingsIcon size={20} color="#1E60D5" />
 </TouchableOpacity>
 </View>

 {/* Profile Card */}
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 mb-6 relative overflow-hidden">
 <View className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full opacity-50 -mr-10 -mt-10" />
 
 {isEditing ? (
 <View className="space-y-4">
 <Text className="text-xs font-bold uppercase text-muted-foreground">Edit Name</Text>
 <TextInput 
 value={editName}
 onChangeText={setEditName}
 className="border border-border rounded-xl px-4 py-3 text-sm text-foreground"
 />
 <View className="flex-row gap-2">
 <TouchableOpacity onPress={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl border border-border items-center">
 <Text className="font-bold text-xs">Cancel</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={handleUpdateProfile} className="flex-1 py-3 rounded-xl bg-primary items-center">
 <Text className="font-bold text-white text-xs">Save</Text>
 </TouchableOpacity>
 </View>
 </View>
 ) : (
 <View className="items-center">
 <View className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white mb-3">
 <Text className="text-3xl font-black text-primary">{profile.name.charAt(0).toUpperCase()}</Text>
 </View>
 <Text className="text-xl font-extrabold text-foreground">{profile.name}</Text>
 <Text className="text-xs text-muted-foreground">{profile.email}</Text>
 
 <TouchableOpacity onPress={() => setIsEditing(true)} className="mt-3 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full">
 <Text className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Edit Profile</Text>
 </TouchableOpacity>
 </View>
 )}

 <View className="flex-row gap-3 mt-6 pt-6 border-t border-border">
 <View className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 items-center border border-border">
 <Activity size={16} color="#1E60D5" className="mb-1" />
 <Text className="text-lg font-black text-foreground">{profile._count.prescriptions}</Text>
 <Text className="text-[9px] font-bold uppercase text-muted-foreground text-center">Rx Scans</Text>
 </View>
 <View className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 items-center border border-border">
 <FileText size={16} color="#1E60D5" className="mb-1" />
 <Text className="text-lg font-black text-foreground">{profile._count.medicalReports}</Text>
 <Text className="text-[9px] font-bold uppercase text-muted-foreground text-center">Lab Reports</Text>
 </View>
 </View>
 </View>

 {/* Emergency Contacts */}
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 mb-6 ">
 <View className="flex-row justify-between items-center mb-4">
 <View className="flex-row items-center gap-2">
 <Shield size={16} color="#ef4444" />
 <Text className="text-sm font-extrabold text-foreground">Emergency Contacts</Text>
 </View>
 <TouchableOpacity onPress={() => setShowEmergencyModal(true)} className="bg-danger/10 px-3 py-1.5 rounded-lg border border-danger/20">
 <Text className="text-xs font-bold text-danger">+ Add New</Text>
 </TouchableOpacity>
 </View>
 
 <Text className="text-[10px] text-muted-foreground mb-4">Contacts listed here will be notified via SMS if you trigger the Panic Button.</Text>
 
 <View className="space-y-3">
 {contacts.length === 0 ? (
 <View className="py-6 border border-dashed border-border rounded-xl items-center">
 <Text className="text-xs text-muted-foreground">No contacts added yet.</Text>
 </View>
 ) : (
 contacts.map(c => (
 <View key={c.id} className="flex-row justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border">
 <View>
 <Text className="text-xs font-bold text-foreground">{c.name}</Text>
 <Text className="text-[10px] text-muted-foreground mt-0.5">{c.relationship} • {c.phoneNumber}</Text>
 </View>
 <TouchableOpacity onPress={() => handleDeleteContact(c.id)} className="p-2">
 <Trash2 size={16} color="#ef4444" />
 </TouchableOpacity>
 </View>
 ))
 )}
 </View>
 </View>

 {user?.role === 'ADMIN' && (
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 mb-6">
 <View className="flex-row items-center gap-2 mb-4">
 <Shield size={16} color="#1E60D5" />
 <Text className="text-sm font-extrabold text-foreground">Admin Controls</Text>
 </View>
 <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')} className="bg-primary/10 px-4 py-3 rounded-xl border border-primary/20 items-center">
 <Text className="text-xs font-bold text-primary">Open Admin Dashboard</Text>
 </TouchableOpacity>
 </View>
 )}

 {/* Danger Zone */}
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 mb-6">
 <Text className="text-sm font-extrabold text-danger mb-4">Danger Zone</Text>
 
 <TouchableOpacity onPress={logout} className="flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border mb-3">
 <View className="flex-row items-center gap-3">
 <LogOut size={16} color="#64748b" />
 <Text className="text-xs font-bold text-foreground">Sign Out Device</Text>
 </View>
 </TouchableOpacity>

 <TouchableOpacity onPress={handleDeleteAccount} className="flex-row items-center justify-between p-4 bg-danger/5 rounded-2xl border border-danger/20">
 <View className="flex-row items-center gap-3">
 <Trash2 size={16} color="#ef4444" />
 <Text className="text-xs font-bold text-danger">Delete Account Permanently</Text>
 </View>
 </TouchableOpacity>
 </View>

 </ScrollView>

 {/* Add Contact Modal */}
 <Modal visible={showEmergencyModal} transparent animationType="slide">
 <View className="flex-1 justify-end bg-slate-900/40">
 <View className="bg-white dark:bg-slate-900 p-6 rounded-t-3xl border-t border-border">
 <Text className="text-lg font-extrabold text-foreground mb-4">Add Emergency Contact</Text>
 
 <Text className="text-xs font-bold text-muted-foreground uppercase mb-1 mt-2">Full Name</Text>
 <TextInput value={newContactName} onChangeText={setNewContactName} className="border border-border rounded-xl px-4 py-3 text-sm text-foreground mb-3" placeholder="John Doe" />
 
 <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Phone Number</Text>
 <TextInput value={newContactPhone} onChangeText={setNewContactPhone} keyboardType="phone-pad" className="border border-border rounded-xl px-4 py-3 text-sm text-foreground mb-3" placeholder="+1234567890" />
 
 <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Relationship</Text>
 <TextInput value={newContactRel} onChangeText={setNewContactRel} className="border border-border rounded-xl px-4 py-3 text-sm text-foreground mb-6" placeholder="Family, Friend, Doctor" />

 <View className="flex-row gap-3">
 <TouchableOpacity onPress={() => setShowEmergencyModal(false)} className="flex-1 py-3.5 border border-border rounded-xl items-center">
 <Text className="font-bold text-xs text-foreground">Cancel</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={handleAddContact} className="flex-1 py-3.5 bg-danger rounded-xl items-center">
 <Text className="font-bold text-xs text-white">Save Contact</Text>
 </TouchableOpacity>
 </View>
 </View>
 </View>
 </Modal>

 </SafeAreaView>
 );
};

export default ProfileScreen;
