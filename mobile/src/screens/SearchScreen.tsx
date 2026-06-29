import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { hospitalAPI, Hospital } from '../services/api';
import { Map } from '../components/Map';
import { Search as SearchIcon, MapPin, Star, Heart, Bookmark, ExternalLink, Phone, Sparkles, AlertCircle, Map as MapIcon, ChevronDown, CheckSquare } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useUserLocation } from '../context/LocationContext';
import LocationModal from '../components/LocationModal';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const specialtiesList = [
 { name: 'Cardiology', label: '🫀 Cardiology' },
 { name: 'Orthopedics', label: '🦴 Orthopedics' },
 { name: 'Neurology', label: '🧠 Neurology' },
 { name: 'Pediatrics', label: '👶 Pediatrics' },
 { name: 'Gynecology', label: '🤰 Gynecology' },
];

export const SearchScreen = () => {
 const navigation = useNavigation<any>();
 const { user } = useAuth();
 
 const [query, setQuery] = useState('');
 const [debouncedQuery, setDebouncedQuery] = useState('');
 const [specialty, setSpecialty] = useState('');
 const [radius, setRadius] = useState(15);
 const [emergencyOnly, setEmergencyOnly] = useState(false);
 const [sortBy, setSortBy] = useState('distance');

 const { latitude: lat, longitude: lng, label: cityName, locationStatus } = useUserLocation();
 const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

 const [hospitals, setHospitals] = useState<Hospital[]>([]);
 const [loading, setLoading] = useState(true);
 const [selectedHospitalId, setSelectedHospitalId] = useState<string | undefined>(undefined);
 const [savedIds, setSavedIds] = useState<string[]>([]);
 
 const [showMap, setShowMap] = useState(false);

 useEffect(() => {
 const handler = setTimeout(() => {
 setDebouncedQuery(query);
 }, 300);
 return () => clearTimeout(handler);
 }, [query]);

 const fetchHospitals = async (searchVal = debouncedQuery) => {
 if (!lat || !lng) return;
 setLoading(true);
 try {
 const data = await hospitalAPI.search(searchVal, specialty, radius, lat, lng, cityName);
 let filtered = emergencyOnly ? data.filter(h => h.emergencyAvailable) : data;
 if (sortBy === 'rating') filtered = filtered.sort((a, b) => b.rating - a.rating);
 else if (sortBy === 'distance') filtered = filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
 else filtered = filtered.sort((a, b) => b.recommendationScore - a.recommendationScore);
 
 setHospitals(filtered);
 if (filtered.length > 0) setSelectedHospitalId(filtered[0].id);
 else setSelectedHospitalId(undefined);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 const fetchSaved = async () => {
 if (!user || !lat || !lng) return;
 try {
 const saved = await hospitalAPI.getSaved(lat, lng);
 setSavedIds(saved.map(h => h.id));
 } catch (err) {}
 };

 useEffect(() => {
 if (locationStatus === 'granted') {
 fetchHospitals(debouncedQuery);
 fetchSaved();
 }
 }, [specialty, radius, emergencyOnly, sortBy, lat, lng, debouncedQuery, locationStatus]);

 const handleToggleSave = async (id: string) => {
 if (!user) return;
 try {
 if (savedIds.includes(id)) {
 await hospitalAPI.unsave(id);
 setSavedIds(prev => prev.filter(savedId => savedId !== id));
 } else {
 await hospitalAPI.save(id);
 setSavedIds(prev => [...prev, id]);
 }
 } catch (err) {}
 };

 return (
 <SafeAreaView className="flex-1 bg-background">
 <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
 <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
 
 {/* Page Header */}
 <View className="px-5 pt-5 pb-4">
 <View className="flex-row items-center gap-2 mb-1">
 <View className="h-7 w-7 rounded-lg bg-primary/10 items-center justify-center">
 <SearchIcon size={16} color="#2563EB" />
 </View>
 <Text className="text-xl font-extrabold text-foreground">Healthcare Navigation</Text>
 </View>
 <Text className="text-sm text-muted-foreground leading-relaxed">
 Discover hospitals matching your specialty, distance, and emergency needs.
 </Text>
 </View>

 {/* Location Bar */}
 <View className="px-5 mb-3">
 <View className="flex-row items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 ">
 <MapPin size={16} color="#2563EB" />
 <Text className="text-sm text-muted-foreground flex-1">
 Active Location: <Text className="font-bold text-foreground">{cityName || 'Unknown'}</Text>
 </Text>
 <TouchableOpacity onPress={() => setIsLocationModalOpen(true)} className="border border-primary/30 rounded-full px-3 py-1">
 <Text className="text-xs font-semibold text-primary">Change</Text>
 </TouchableOpacity>
 </View>
 </View>

 {/* Filters Card */}
 <View className="mx-5 mb-4 bg-card rounded-2xl border border-border p-5">
 {/* Search Input */}
 <View className="mb-4">
 <Text className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Hospital Name / Keywords</Text>
 <View className="flex-row items-center bg-muted border border-border rounded-xl px-3 h-11">
 <SearchIcon size={14} color="#64748b" />
 <TextInput
 value={query}
 onChangeText={setQuery}
 placeholder="Search hospital or specialty name..."
 placeholderTextColor="#94a3b8"
 className="flex-1 text-sm bg-transparent ml-2 text-foreground h-full"
 />
 </View>
 </View>

 {/* Specialty Row (Horizontal scroll) */}
 <View className="mb-4">
 <Text className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Clinical Specialty</Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
 {specialtiesList.map(spec => (
 <TouchableOpacity 
 key={spec.name} 
 onPress={() => setSpecialty(specialty === spec.name ? '' : spec.name)} 
 className={`px-3 py-1.5 rounded-xl border mr-2 ${specialty === spec.name ? 'bg-primary border-primary' : 'bg-muted border-border'}`}
 >
 <Text className={`text-[11px] font-bold ${specialty === spec.name ? 'text-white' : 'text-muted-foreground'}`}>{spec.label}</Text>
 </TouchableOpacity>
 ))}
 </ScrollView>
 </View>

 {/* Bottom Actions */}
 <View className="flex-row gap-2.5">
 <TouchableOpacity 
 onPress={() => setEmergencyOnly(!emergencyOnly)}
 className={`flex-1 flex-row items-center justify-center gap-2 h-11 rounded-xl border-2 transition-colors ${emergencyOnly ? 'border-primary bg-secondary' : 'border-border bg-transparent'}`}
 >
 <CheckSquare size={16} color={emergencyOnly ? '#2563EB' : '#64748b'} />
 <Text className={`text-sm font-semibold ${emergencyOnly ? 'text-primary' : 'text-muted-foreground'}`}>24/7 ER Room</Text>
 </TouchableOpacity>
 <Button className="flex-1 h-11 rounded-xl " onPress={() => fetchHospitals()}>
 <Text className="text-white font-bold">Apply Filters</Text>
 </Button>
 </View>
 </View>

 {/* Map Toggle */}
 <View className="mx-5 mb-4">
 <TouchableOpacity 
 onPress={() => setShowMap(!showMap)}
 className={`w-full flex-row items-center justify-center gap-2 py-3 rounded-2xl border-2 ${showMap ? 'border-primary bg-secondary' : 'border-border bg-transparent'}`}
 >
 <MapIcon size={16} color={showMap ? '#2563EB' : '#64748b'} />
 <Text className={`text-sm font-semibold ${showMap ? 'text-primary' : 'text-muted-foreground'}`}>
 {showMap ? "Hide Map" : "View on Map"}
 </Text>
 </TouchableOpacity>
 </View>

 {/* Map Section */}
 {showMap && lat && lng && (
 <View className="w-full h-64 border-t border-b border-border bg-slate-200 mb-4">
 <Map 
 hospitals={hospitals} 
 selectedHospitalId={selectedHospitalId} 
 onSelectHospital={setSelectedHospitalId}
 userLat={lat}
 userLng={lng}
 />
 </View>
 )}

 {/* Results */}
 <View className="px-5">
 <View className="flex-row items-center justify-between mb-3">
 <Text className="text-sm font-bold text-foreground">{hospitals.length} Results Found</Text>
 <Text className="text-xs text-muted-foreground">sorted by nearest</Text>
 </View>

 {loading ? (
 <ActivityIndicator size="large" color="#2563EB" className="my-10" />
 ) : hospitals.length === 0 ? (
 <Text className="text-center text-xs text-muted-foreground py-10">No hospitals found matching your criteria.</Text>
 ) : (
 <View className="flex-col gap-3">
 {hospitals.map(hospital => (
 <TouchableOpacity 
 key={hospital.id}
 onPress={() => setSelectedHospitalId(hospital.id)}
 className={`bg-card rounded-2xl border overflow-hidden ${selectedHospitalId === hospital.id ? 'border-primary border-2' : 'border-border'}`}
 >
 <View className="p-4">
 <View className="flex-row items-start justify-between mb-1">
 <View className="flex-1 pr-2">
 <Text className="font-bold text-foreground text-base leading-tight mb-1">{hospital?.name ?? 'Unknown Hospital'}</Text>
 <View className="flex-row items-center gap-1 mb-1">
 <MapPin size={12} color="#64748b" />
 <Text className="text-xs text-muted-foreground" numberOfLines={1}>{hospital?.address ?? 'Address not available'}</Text>
 <Text className="text-xs text-muted-foreground">·</Text>
 <Text className="text-xs font-bold text-primary">{hospital?.distance?.toFixed(1) ?? 'N/A'} km</Text>
 </View>
 </View>
 <View className="flex-row items-center gap-1.5">
 <TouchableOpacity onPress={() => handleToggleSave(hospital.id)} className={`h-8 w-8 rounded-full border items-center justify-center ${savedIds.includes(hospital.id) ? 'bg-secondary border-primary/30' : 'bg-card border-border'}`}>
 <Bookmark size={14} color={savedIds.includes(hospital.id) ? '#2563EB' : '#64748b'} fill={savedIds.includes(hospital.id) ? '#2563EB' : 'transparent'} />
 </TouchableOpacity>
 </View>
 </View>

 {/* Rating & Score */}
 <View className="flex-row items-center gap-2 mt-2 mb-2">
 <View className="flex-row items-center gap-1">
 <Star size={14} color="#d97706" fill="#d97706" />
 <Text className="text-sm font-bold text-foreground">{hospital?.rating?.toFixed(1) ?? 'N/A'}</Text>
 </View>
 <View className="border border-amber-500/40 bg-amber-100 rounded-full px-2 py-0.5">
 <Text className="text-[10px] font-bold text-amber-600">Match: {hospital?.recommendationScore ?? 0}%</Text>
 </View>
 {hospital.emergencyAvailable && (
 <View className="border border-destructive/40 bg-destructive/10 rounded-full px-2 py-0.5">
 <Text className="text-[10px] font-bold text-destructive">24/7 ER</Text>
 </View>
 )}
 </View>

 {/* Match Reason */}
 <View className="bg-secondary rounded-2xl p-3 border border-primary/10">
 <View className="flex-row items-start gap-2">
 <Sparkles size={14} color="#2563EB" style={{ marginTop: 2 }} />
 <Text className="text-xs text-foreground leading-relaxed flex-1">
 {hospital.emergencyAvailable ? 'Recommended for emergency response based on your proximity.' : 'Highly rated general facility near your current location.'}
 </Text>
 </View>
 </View>
 </View>

 {/* Footer */}
 <View className="flex-row items-center justify-between px-4 py-3 border-t border-border bg-slate-50 dark:bg-slate-800/50">
 <View className="flex-row items-center gap-1.5">
 <View className="h-2 w-2 rounded-full bg-emerald-500" />
 <Text className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{hospital?.workingHours ?? 'N/A'}</Text>
 </View>
 <TouchableOpacity onPress={() => navigation.navigate('HospitalDetail', { id: hospital.id })} className="flex-row items-center gap-1">
 <Text className="text-xs font-bold text-primary">Full Details</Text>
 <ExternalLink size={12} color="#2563EB" />
 </TouchableOpacity>
 </View>
 </TouchableOpacity>
 ))}
 </View>
 )}
 </View>
 </ScrollView>
 {isLocationModalOpen && <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />}
 </KeyboardAvoidingView>
 </SafeAreaView>
 );
};

export default SearchScreen;
