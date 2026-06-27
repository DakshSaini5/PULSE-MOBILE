import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { userAPI, emergencyAPI, UserProfile, EmergencyContact } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Activity, FileText, Calendar, Shield, Lock, Trash2, LogOut, Settings as SettingsIcon, Save } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

export const ProfileScreen = () => {
 const { user, logout, refreshUser } = useAuth();
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
 const [editAge, setEditAge] = useState('');
 const [editGender, setEditGender] = useState('Male');
 const [editWeight, setEditWeight] = useState('');
 const [editBloodGroup, setEditBloodGroup] = useState('O+');
 const [editMedicalConditions, setEditMedicalConditions] = useState('');
 const [saving, setSaving] = useState(false);
 const [addingContact, setAddingContact] = useState(false);

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
 setEditAge(profileData.age ? profileData.age.toString() : '');
 setEditGender(profileData.gender || 'Male');
 setEditWeight(profileData.weight || '');
 setEditBloodGroup(profileData.bloodGroup || 'O+');
 setEditMedicalConditions(profileData.medicalConditions || '');
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
 setSaving(true);
 try {
 const updated = await userAPI.updateProfile({ 
    name: editName,
    age: editAge,
    gender: editGender,
    weight: editWeight,
    bloodGroup: editBloodGroup,
    medicalConditions: editMedicalConditions
 });
 setProfile(prev => prev ? { ...prev, ...updated } : null);
 await refreshUser();
 setIsEditing(false);
 Alert.alert('Success', 'Profile updated successfully.');
 } catch (err) {
 Alert.alert('Error', 'Failed to update profile.');
 } finally {
 setSaving(false);
 }
 };

 const handleAddContact = async () => {
 if (!newContactName || !newContactPhone) return;
 setAddingContact(true);
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
 } finally {
 setAddingContact(false);
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
 Alert.alert('Error', 'Failed to delete account. Please try again.');
 }
 }}
 ]);
 };

 if (loading || !profile) {
 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background justify-center items-center">
 <ActivityIndicator size="large" color="#1E60D5" />
 </SafeAreaView>
 );
 }

 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
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
  className="border border-border rounded-xl px-4 py-3 text-sm text-foreground bg-white dark:bg-slate-900"
  />

  <View className="flex-row gap-3">
    <View className="flex-1">
      <Text className="text-xs font-bold uppercase text-muted-foreground">Age</Text>
      <TextInput 
        value={editAge}
        onChangeText={setEditAge}
        keyboardType="numeric"
        placeholder="e.g. 28"
        placeholderTextColor="#94a3b8"
        className="border border-border rounded-xl px-4 py-3 text-sm text-foreground mt-1.5 bg-white dark:bg-slate-900"
      />
    </View>
    <View className="flex-1">
      <Text className="text-xs font-bold uppercase text-muted-foreground">Weight</Text>
      <TextInput 
        value={editWeight}
        onChangeText={setEditWeight}
        placeholder="e.g. 72 kg"
        placeholderTextColor="#94a3b8"
        className="border border-border rounded-xl px-4 py-3 text-sm text-foreground mt-1.5 bg-white dark:bg-slate-900"
      />
    </View>
  </View>

  <Text className="text-xs font-bold uppercase text-muted-foreground mt-2">Gender</Text>
  <View className="flex-row gap-2 mt-1">
    {['Male', 'Female', 'Other'].map(g => (
      <TouchableOpacity 
        key={g} 
        onPress={() => setEditGender(g)} 
        className={`px-4 py-2 rounded-xl border ${editGender === g ? 'bg-primary/10 border-primary' : 'bg-transparent border-border'}`}
      >
        <Text className={`text-xs font-bold ${editGender === g ? 'text-primary' : 'text-muted-foreground'}`}>{g}</Text>
      </TouchableOpacity>
    ))}
  </View>

  <Text className="text-xs font-bold uppercase text-muted-foreground mt-2">Blood Group</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mt-1" contentContainerStyle={{ gap: 8 }}>
    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
      <TouchableOpacity 
        key={bg} 
        onPress={() => setEditBloodGroup(bg)} 
        className={`px-3 py-2 rounded-xl border ${editBloodGroup === bg ? 'bg-primary/10 border-primary' : 'bg-transparent border-border'}`}
      >
        <Text className={`text-xs font-bold ${editBloodGroup === bg ? 'text-primary' : 'text-muted-foreground'}`}>{bg}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>

  <Text className="text-xs font-bold uppercase text-muted-foreground mt-2">Medical Conditions</Text>
  <TextInput 
    value={editMedicalConditions}
    onChangeText={setEditMedicalConditions}
    placeholder="e.g. Hypertension, Asthma"
    placeholderTextColor="#94a3b8"
    multiline
    numberOfLines={3}
    className="border border-border rounded-xl px-4 py-3 text-sm text-foreground mt-1 bg-white dark:bg-slate-900 min-h-[60px] text-left align-top"
  />

  <View className="flex-row gap-2 pt-2">
  <TouchableOpacity onPress={() => setIsEditing(false)} className="flex-1 py-3.5 rounded-xl border border-border items-center">
  <Text className="font-bold text-xs">Cancel</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={handleUpdateProfile} disabled={saving} className="flex-1 py-3.5 rounded-xl bg-primary items-center">
  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text className="font-bold text-white text-xs">Save</Text>}
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

  {/* Vitals / Profile Specs Grid */}
  <View className="flex-row flex-wrap gap-2 justify-center mt-4 w-full">
    <View className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-border items-center min-w-[70px]">
      <Text className="text-[9px] font-bold text-muted-foreground uppercase">Age</Text>
      <Text className="text-xs font-extrabold text-foreground mt-0.5">{profile.age || '—'}</Text>
    </View>
    <View className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-border items-center min-w-[70px]">
      <Text className="text-[9px] font-bold text-muted-foreground uppercase">Gender</Text>
      <Text className="text-xs font-extrabold text-foreground mt-0.5">{profile.gender || '—'}</Text>
    </View>
    <View className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-border items-center min-w-[70px]">
      <Text className="text-[9px] font-bold text-muted-foreground uppercase">Weight</Text>
      <Text className="text-xs font-extrabold text-foreground mt-0.5">{profile.weight || '—'}</Text>
    </View>
    <View className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-border items-center min-w-[70px]">
      <Text className="text-[9px] font-bold text-muted-foreground uppercase">Blood</Text>
      <Text className="text-xs font-extrabold text-danger mt-0.5">{profile.bloodGroup || '—'}</Text>
    </View>
  </View>
  
  {profile.medicalConditions ? (
    <View className="mt-3 w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-border">
      <Text className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Medical Conditions</Text>
      <Text className="text-xs text-foreground font-medium leading-relaxed">{profile.medicalConditions}</Text>
    </View>
  ) : null}
  
  <TouchableOpacity 
    onPress={() => setIsEditing(true)} 
    className="mt-4 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-full"
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  >
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
 <TouchableOpacity onPress={handleAddContact} disabled={addingContact} className="flex-1 py-3.5 bg-danger rounded-xl items-center">
 {addingContact ? <ActivityIndicator color="#fff" size="small" /> : <Text className="font-bold text-xs text-white">Save Contact</Text>}
 </TouchableOpacity>
 </View>
 </View>
 </View>
 </Modal>

 </SafeAreaView>
 );
};

export default ProfileScreen;



