import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { ArrowLeft, Star, MapPin, CheckCircle2, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { hospitalAPI, Hospital } from '../services/api';

export default function HospitalFinderScreen() {
  const navigation = useNavigation<any>();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const searchRadius = 10; // 10km radius

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        // Default to a central location (e.g., Delhi, India) if denied
        const defaultLocation = { lat: 28.6139, lng: 77.2090 };
        setLocation(defaultLocation);
        fetchHospitals(defaultLocation.lat, defaultLocation.lng);
        return;
      }

      let userLoc = await Location.getCurrentPositionAsync({});
      const coords = { lat: userLoc.coords.latitude, lng: userLoc.coords.longitude };
      setLocation(coords);
      fetchHospitals(coords.lat, coords.lng);
    })();
  }, []);

  const fetchHospitals = async (lat: number, lng: number) => {
    try {
      const data = await hospitalAPI.getNearby(lat, lng, searchRadius);
      setHospitals(data);
    } catch (error) {
      console.error('Error fetching nearby hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHospitalCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      className="bg-white rounded-2xl p-5 mb-4 border border-slate-100 shadow-sm"
      onPress={() => navigation.navigate('HospitalDetail', { id: item.id })}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-black text-slate-900 flex-1 pr-2">{item.name}</Text>
        <View className="bg-blue-50 px-2 py-1 rounded-lg flex-row items-center">
          <Star color="#2563EB" size={12} fill="#2563EB" />
          <Text className="text-blue-700 font-bold text-xs ml-1">{item.rating?.toFixed(1) || '4.0'}</Text>
        </View>
      </View>

      <View className="flex-row items-center mb-3">
        <MapPin color="#64748B" size={14} />
        <Text className="text-slate-500 text-xs ml-1 font-medium">
          {item.distance ? `${item.distance.toFixed(1)} km away` : 'Nearby'}
        </Text>
        
        <View className="w-1 h-1 rounded-full bg-slate-300 mx-2" />
        
        <Clock color="#64748B" size={14} />
        <Text className="text-slate-500 text-xs ml-1 font-medium">
          {item.waitTimes || 15} mins wait
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {item.services && item.services.slice(0, 4).map((service: string, idx: number) => (
          <View key={idx} className="flex-row items-center bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <CheckCircle2 color="#2563EB" size={12} />
            <Text className="text-xs text-slate-600 font-medium ml-1">{service}</Text>
          </View>
        ))}
        {item.services && item.services.length > 4 && (
          <View className="bg-slate-50 px-2 py-1 rounded-md border border-slate-100 justify-center">
            <Text className="text-xs text-slate-600 font-bold">+{item.services.length - 4}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-gray-100 bg-white z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 bg-gray-50 p-2 rounded-full">
          <ArrowLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-black text-slate-900">Hospital Finder</Text>
          <Text className="text-xs text-blue-600 font-bold uppercase tracking-wider">
            Within {searchRadius}km radius
          </Text>
        </View>
      </View>

      {/* Map Section (Top 40%) */}
      <View className="h-[40%] bg-slate-100 relative">
        {location ? (
          <MapView
            style={{ width: '100%', height: '100%' }}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location.lat,
              longitude: location.lng,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
          >
            {hospitals.map((hospital, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: hospital.latitude,
                  longitude: hospital.longitude,
                }}
                title={hospital.name}
                description={hospital.specialtyTags ? hospital.specialtyTags.join(', ') : 'Hospital'}
                pinColor="#2563EB"
              />
            ))}
          </MapView>
        ) : (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="text-slate-500 mt-2 font-medium">Locating...</Text>
          </View>
        )}
      </View>

      {/* List Section (Bottom 60%) */}
      <View className="flex-1 bg-slate-50 px-5 pt-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : hospitals.length > 0 ? (
          <FlatList
            data={hospitals}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={renderHospitalCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-slate-500 font-medium text-base">No hospitals found nearby.</Text>
            {errorMsg && <Text className="text-red-500 text-sm mt-2 text-center">{errorMsg}</Text>}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
