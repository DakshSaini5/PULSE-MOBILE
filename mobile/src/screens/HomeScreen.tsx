import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Modal } from 'react-native';
import { Stethoscope, Syringe, Activity, Heart, Brain, Eye, Baby, Droplet, Search, Menu, Bell, MapPin } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounce } from '../hooks/useDebounce';
import { hospitalAPI, Hospital, emergencyAPI } from '../services/api';
import { ShieldAlert } from 'lucide-react-native';

const SERVICES = [
  { id: '1', title: 'General', icon: Stethoscope },
  { id: '2', title: 'Vaccine', icon: Syringe },
  { id: '3', title: 'Blood Test', icon: Droplet },
  { id: '4', title: 'Dental', icon: Activity },
  { id: '5', title: 'Cardiology', icon: Heart },
  { id: '6', title: 'Neurology', icon: Brain },
  { id: '7', title: 'Eye Care', icon: Eye },
  { id: '8', title: 'Pediatrics', icon: Baby },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Hospital[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 400);

  // Emergency Contact Prompt State
  const [showEmergencyPrompt, setShowEmergencyPrompt] = useState(false);

  useEffect(() => {
    const checkEmergencyContacts = async () => {
      try {
        const contacts = await emergencyAPI.getContacts();
        if (contacts.length === 0) {
          setShowEmergencyPrompt(true);
        }
      } catch (error) {
        console.error('Failed to check emergency contacts', error);
      }
    };
    // Only check if user is logged in
    if (user) {
      checkEmergencyContacts();
    }
  }, [user]);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const results = await hospitalAPI.searchGlobal(debouncedQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Failed to search hospitals', error);
      } finally {
        setIsSearching(false);
      }
    };
    
    fetchResults();
  }, [debouncedQuery]);

  return (
    <View className="flex-1 bg-white relative">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Vibrant Header Section */}
        <View 
          className="bg-blue-600 rounded-b-[40px] px-6 pb-8 shadow-md relative z-10"
          style={{ paddingTop: Math.max(insets.top, 50) }}
        >
          {/* Top Bar */}
          <View className="flex-row justify-between items-center mb-6 mt-2">
            <TouchableOpacity onPress={() => navigation.openDrawer()} className="bg-white/20 p-2.5 rounded-full">
              <Menu color="#fff" size={24} />
            </TouchableOpacity>
            
            <View className="flex-row items-center justify-center">
              <Text className="text-white text-3xl font-black tracking-widest">PULSE</Text>
            </View>
            
            <TouchableOpacity className="bg-white/20 p-2.5 rounded-full">
              <Bell color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          {/* Welcome Text */}
          <View className="mb-4 mt-2">
            <Text className="text-blue-100 text-base font-medium mb-1">
              Welcome back, {user?.name?.split(' ')[0] || 'Guest'} 👋
            </Text>
            <Text className="text-white text-3xl font-extrabold leading-tight mb-2">
              Your Personal Health 
            </Text>
            <Text className="text-white text-3xl font-extrabold leading-tight mb-4">
              Ecosystem
            </Text>
            <Text className="text-blue-50 text-sm opacity-90 leading-relaxed max-w-[280px]">
              Access your digital prescriptions, track AI-generated health trends, and find top-rated hospitals all in one place.
            </Text>
          </View>

          {/* Global Search inside Header */}
          <View className="flex-row items-center bg-white rounded-2xl px-5 py-4 mt-4 shadow-xl border border-white/50 z-20">
            <Search color="#2563EB" size={22} />
            <TextInput
              placeholder="Search hospitals, doctors or clinics..."
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-3 text-base text-slate-900 font-medium"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {isSearching && <ActivityIndicator size="small" color="#2563EB" />}
          </View>
          
          {/* Search Dropdown Overlay */}
          {searchQuery.trim().length >= 2 && (
            <View className="absolute top-[340px] left-6 right-6 bg-white rounded-2xl shadow-xl z-50 border border-slate-100 overflow-hidden">
              {searchResults.length > 0 ? (
                searchResults.map((hospital, idx) => (
                  <TouchableOpacity
                    key={hospital.id}
                    className={`p-4 flex-row items-center ${idx !== searchResults.length - 1 ? 'border-b border-slate-100' : ''}`}
                    onPress={() => navigation.navigate('HospitalDetail', { id: hospital.id })}
                  >
                    <View className="bg-blue-50 p-3 rounded-full mr-4">
                      <MapPin color="#2563EB" size={20} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 font-bold text-base" numberOfLines={1}>{hospital.name}</Text>
                      {hospital.specialtyTags && hospital.specialtyTags.length > 0 && (
                        <Text className="text-slate-500 text-xs mt-1" numberOfLines={1}>
                          {hospital.specialtyTags.join(', ')}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              ) : !isSearching ? (
                <View className="p-6 items-center">
                  <Text className="text-slate-500 font-medium">No hospitals found.</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        <View className="px-5 pt-8 -z-10">
          {/* Quick Health Tips */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-black text-slate-900">Daily Health Tips</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
              <View className="bg-amber-50 border border-amber-200 rounded-3xl p-5 w-[240px] mr-4 shadow-sm">
                <Text className="text-amber-800 font-bold mb-2">💧 Stay Hydrated</Text>
                <Text className="text-amber-700 text-sm leading-relaxed">
                  Drinking at least 8 glasses of water daily improves energy levels and keeps your skin glowing.
                </Text>
              </View>
              
              <View className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 w-[240px] mr-4 shadow-sm">
                <Text className="text-emerald-800 font-bold mb-2">🚶‍♂️ Keep Moving</Text>
                <Text className="text-emerald-700 text-sm leading-relaxed">
                  A brisk 30-minute walk every day can significantly boost your cardiovascular health and mood.
                </Text>
              </View>

              <View className="bg-purple-50 border border-purple-200 rounded-3xl p-5 w-[240px] shadow-sm">
                <Text className="text-purple-800 font-bold mb-2">😴 Quality Sleep</Text>
                <Text className="text-purple-700 text-sm leading-relaxed">
                  Try to get 7-8 hours of sleep. A consistent sleep schedule improves memory and immunity.
                </Text>
              </View>
            </ScrollView>
          </View>

          {/* Services Grid */}
          <View className="mb-24">
            <Text className="text-xl font-black text-slate-900 mb-4">Quick Services</Text>
            <View className="flex-row flex-wrap justify-between gap-y-6">
              {SERVICES.map((service, index) => {
                const Icon = service.icon;
                
                return (
                  <TouchableOpacity 
                    key={service.id} 
                    className="w-[22%] items-center"
                    activeOpacity={0.6}
                  >
                    <View className="w-[68px] h-[68px] bg-slate-50 rounded-full items-center justify-center mb-2 border border-slate-200 shadow-sm">
                      <Icon color="#64748B" size={26} />
                    </View>
                    <Text className="text-[11px] text-slate-700 font-bold text-center">{service.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Emergency Contact Startup Prompt */}
      <Modal visible={showEmergencyPrompt} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm items-center">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <ShieldAlert size={32} color="#ef4444" />
            </View>
            <Text className="text-xl font-black text-slate-900 text-center mb-2">Safety First!</Text>
            <Text className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
              For your safety in critical moments, please add at least one emergency contact. We will alert them automatically if you trigger the SOS Panic Button.
            </Text>
            
            <TouchableOpacity 
              onPress={() => {
                setShowEmergencyPrompt(false);
                navigation.navigate('Settings');
              }}
              className="w-full bg-blue-600 py-3.5 rounded-xl items-center justify-center mb-3"
            >
              <Text className="text-white font-bold text-base">Add Contact Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowEmergencyPrompt(false)}
              className="w-full bg-slate-100 py-3.5 rounded-xl items-center justify-center"
            >
              <Text className="text-slate-600 font-bold">Remind Me Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}
