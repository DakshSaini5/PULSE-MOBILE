import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Search, MapPin, Star, Clock, Activity } from 'lucide-react-native';
import BaseLayout from '../components/BaseLayout';
import CustomHeader from '../components/CustomHeader';

const SPECIALTIES = ['All', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dental', 'General'];

const MOCK_HOSPITALS = [
  {
    id: '1',
    name: 'City General Hospital',
    distance: '1.2 km',
    rating: 4.8,
    waitTime: '15 mins',
    match: 94,
  },
  {
    id: '2',
    name: 'Mercy Medical Center',
    distance: '3.5 km',
    rating: 4.5,
    waitTime: '45 mins',
    match: 78,
  }
];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  return (
    <BaseLayout>
      <CustomHeader title="Find Hospital" />
      
      <View className="px-5 pt-4 pb-2">
        {/* Search Input */}
        <View className="flex-row items-center bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200">
          <Search color="#94A3B8" size={20} />
          <TextInput
            placeholder="Search by name, location, or specialty..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-3 text-base text-slate-900"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Chips ScrollView */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="mt-4 overflow-visible"
        >
          {SPECIALTIES.map((spec) => (
            <TouchableOpacity
              key={spec}
              onPress={() => setSelectedSpecialty(spec)}
              className={`px-5 py-2.5 rounded-full mr-3 border ${
                selectedSpecialty === spec 
                  ? 'bg-blue-600 border-blue-600' 
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text className={`font-medium ${
                selectedSpecialty === spec ? 'text-white' : 'text-slate-600'
              }`}>
                {spec}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        <View className="mb-24">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-slate-900">Compare Options</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-medium">See all map</Text>
            </TouchableOpacity>
          </View>

          {/* Side-by-side comparison */}
          <View className="flex-row justify-between">
            {MOCK_HOSPITALS.map((hospital) => (
              <View key={hospital.id} className="w-[48%] bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
                <Text className="font-bold text-slate-900 text-base mb-1" numberOfLines={2}>
                  {hospital.name}
                </Text>
                
                {/* Match Progress Indicator */}
                <View className="mt-2 mb-4">
                  <View className="flex-row justify-between items-end mb-1">
                    <Text className="text-xs text-slate-500 font-medium">Match</Text>
                    <Text className="text-blue-600 font-bold text-sm">{hospital.match}%</Text>
                  </View>
                  <View className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${hospital.match}%` }} 
                    />
                  </View>
                </View>

                {/* Data Rows */}
                <View className="space-y-3">
                  <View className="flex-row items-center">
                    <MapPin color="#94A3B8" size={16} />
                    <Text className="text-sm text-slate-600 ml-2">{hospital.distance}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Star color="#F59E0B" size={16} fill="#F59E0B" />
                    <Text className="text-sm text-slate-600 ml-2">{hospital.rating} Rating</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock color="#94A3B8" size={16} />
                    <Text className="text-sm text-slate-600 ml-2">{hospital.waitTime} wait</Text>
                  </View>
                </View>

                <TouchableOpacity className="mt-5 bg-slate-50 border border-slate-200 py-2.5 rounded-xl items-center">
                  <Text className="text-blue-600 font-semibold text-sm">Select</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </BaseLayout>
  );
}
