import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { User, Phone, Shield, LogOut, Trash2, Edit3, Settings, Check, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import BaseLayout from '../components/BaseLayout';
import CustomHeader from '../components/CustomHeader';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'Guest User',
    email: user?.email || 'guest@pulse.com',
    bloodType: 'O+',
    age: '28',
    weight: '72',
    emergencyContactName: 'Jane Doe',
    emergencyContactRelation: 'Wife',
    emergencyContactPhone: '+1 (555) 123-4567'
  });

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your health data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Account deletion requested') },
      ]
    );
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Save logic mock
      Alert.alert('Profile Saved', 'Your information has been securely updated.');
    }
    setIsEditing(!isEditing);
  };

  return (
    <BaseLayout>
      <CustomHeader title="Profile" />
      
      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6 items-center relative">
          
          <TouchableOpacity 
            onPress={toggleEdit}
            className="absolute top-4 right-4 bg-slate-50 p-2 rounded-full border border-slate-100"
          >
            {isEditing ? <Check color="#059669" size={20} /> : <Edit3 color="#2563EB" size={20} />}
          </TouchableOpacity>

          <View className="relative mb-4 mt-2">
            <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center border-4 border-white shadow-sm">
              <User color="#2563EB" size={40} />
            </View>
          </View>
          
          {isEditing ? (
            <TextInput 
              value={formData.name}
              onChangeText={(t) => setFormData({...formData, name: t})}
              className="text-2xl font-bold text-slate-900 mb-1 border-b border-blue-200 text-center w-full pb-1"
            />
          ) : (
            <Text className="text-2xl font-bold text-slate-900 mb-1">{formData.name}</Text>
          )}

          {isEditing ? (
            <TextInput 
              value={formData.email}
              onChangeText={(t) => setFormData({...formData, email: t})}
              className="text-base text-slate-500 mb-4 border-b border-blue-200 text-center w-full pb-1"
              keyboardType="email-address"
            />
          ) : (
            <Text className="text-base text-slate-500 mb-4">{formData.email}</Text>
          )}
          
          <View className="flex-row items-center justify-center space-x-6 w-full pt-4 border-t border-slate-100">
            <View className="items-center">
              <Text className="text-slate-500 text-xs uppercase tracking-wider mb-1">Blood Type</Text>
              {isEditing ? (
                 <TextInput value={formData.bloodType} onChangeText={(t) => setFormData({...formData, bloodType: t})} className="text-lg font-bold text-slate-900 border-b border-blue-200 text-center w-12" />
              ) : (
                 <Text className="text-lg font-bold text-slate-900">{formData.bloodType}</Text>
              )}
            </View>
            <View className="w-px h-8 bg-slate-200" />
            <View className="items-center">
              <Text className="text-slate-500 text-xs uppercase tracking-wider mb-1">Age</Text>
              {isEditing ? (
                 <TextInput value={formData.age} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, age: t})} className="text-lg font-bold text-slate-900 border-b border-blue-200 text-center w-12" />
              ) : (
                 <Text className="text-lg font-bold text-slate-900">{formData.age}</Text>
              )}
            </View>
            <View className="w-px h-8 bg-slate-200" />
            <View className="items-center">
              <Text className="text-slate-500 text-xs uppercase tracking-wider mb-1">Weight</Text>
              {isEditing ? (
                 <View className="flex-row items-end border-b border-blue-200"><TextInput value={formData.weight} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, weight: t})} className="text-lg font-bold text-slate-900 text-center w-12" /><Text className="text-slate-900 font-bold mb-1 ml-1">kg</Text></View>
              ) : (
                 <Text className="text-lg font-bold text-slate-900">{formData.weight}kg</Text>
              )}
            </View>
          </View>
        </View>

        {/* Emergency Contacts Layout */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-slate-900 mb-4">Emergency Contacts</Text>
          <View className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <TouchableOpacity className="flex-row items-center p-4 border-b border-slate-100 active:bg-slate-50">
              <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-4">
                <Phone color="#DC2626" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900">Emergency Services</Text>
                <Text className="text-sm text-slate-500">911</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-row items-center p-4 active:bg-slate-50">
              <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center mr-4 border border-slate-100">
                <User color="#64748B" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900">Jane Doe</Text>
                <Text className="text-sm text-slate-500">Wife • +1 (555) 123-4567</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Links */}
        <View className="mb-8">
          <TouchableOpacity 
            onPress={() => navigation.navigate('Privacy')}
            className="flex-row items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mb-3 active:bg-slate-50"
          >
            <Shield color="#64748B" size={20} className="mr-4" />
            <Text className="text-base font-medium text-slate-900">Privacy & Security</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm active:bg-slate-50">
            <Settings color="#64748B" size={20} className="mr-4" />
            <Text className="text-base font-medium text-slate-900">App Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Destructive Actions Section */}
        <View className="mb-24 pt-4 border-t border-slate-200">
          <TouchableOpacity 
            onPress={handleLogout}
            className="flex-row items-center p-4 mb-2 active:opacity-50"
          >
            <LogOut color="#64748B" size={20} className="mr-4" />
            <Text className="text-base font-bold text-slate-600">Log Out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleDeleteAccount}
            className="flex-row items-center p-4 bg-red-50 rounded-2xl border border-red-100 active:opacity-70"
          >
            <Trash2 color="#DC2626" size={20} className="mr-4" />
            <Text className="text-base font-bold text-red-600">Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BaseLayout>
  );
}
