import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Linking } from 'react-native';
import { hospitalAPI, Hospital } from '../services/api';
import { Heart, MapPin, Star, AlertCircle, PhoneCall, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUserLocation } from '../context/LocationContext';

export const SavedHospitalsScreen = () => {
 const { user } = useAuth();
 const navigation = useNavigation<any>();
 const route = useRoute<any>();
 const isEmergencyCallMode = route.params?.emergency_call === true;

 const [hospitals, setHospitals] = useState<Hospital[]>([]);
 const [loading, setLoading] = useState(true);
 const { latitude: lat, longitude: lng } = useUserLocation();

 const emergencyHelplines = [
 { name: 'National Emergency Helpline (All-in-One)', phone: '112', desc: 'Central emergency response integration across India.' },
 { name: 'Ambulance Service', phone: '102', desc: 'Primary medical emergency response and hospital transport.' },
 { name: 'Trauma & Disaster Response (Ambulance)', phone: '108', desc: 'Accidents, trauma care, and state disaster helplines.' },
 { name: 'Police Dispatch', phone: '100', desc: 'Immediate civil safety and law enforcement dispatch.' },
 { name: 'Fire & Rescue Department', phone: '101', desc: 'Fire outbreaks and critical rescue operations.' },
 { name: 'Women Helpline', phone: '1091', desc: 'Dedicated civil security and protection response.' }
 ];

 const fetchSaved = async () => {
 if (!user) return;
 setLoading(true);
 try {
 const data = await hospitalAPI.getSaved(lat, lng);
 setHospitals(data);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchSaved();
 }, [lat, lng]);

 const handleUnsave = async (id: string) => {
 try {
 await hospitalAPI.unsave(id);
 setHospitals(prev => prev.filter(h => h.id !== id));
 } catch (err) {
 console.error(err);
 }
 };

 return (
 <SafeAreaView className="flex-1 bg-background">
 <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1">
 {isEmergencyCallMode && (
 <View className="bg-red-600 rounded-2xl p-4 flex-row items-center gap-3 mb-6 ">
 <View className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
 <AlertCircle size={20} color="white" />
 </View>
 <View className="flex-1">
 <Text className="font-extrabold text-xs uppercase tracking-wider text-white">🚨 Emergency Call Directory Active</Text>
 <Text className="text-[10px] text-white/90 font-medium mt-0.5">Tap any calling button below to direct-dial instantly from your mobile dialer!</Text>
 </View>
 </View>
 )}

 <View className="mb-6">
 <View className="flex-row items-center gap-2 mb-1">
 <Heart size={24} color="#ef4444" fill="#ef4444" />
 <Text className="text-2xl font-extrabold text-foreground">{isEmergencyCallMode ? 'Emergency Call Directory' : 'Saved Care & Favorites'}</Text>
 </View>
 <Text className="text-xs text-muted-foreground">
 {isEmergencyCallMode 
 ? 'Access hotlines and direct contact lines for your bookmarked medical facilities immediately.' 
 : 'Manage and browse clinics or medical departments you bookmarked for later navigation.'}
 </Text>
 </View>

 {loading ? (
 <View className="flex-1 items-center justify-center py-20">
 <ActivityIndicator size="large" color="#1E60D5" />
 </View>
 ) : hospitals.length === 0 ? (
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-8 items-center mt-4">
 <Heart size={48} color="#94a3b8" className="mb-4" />
 <Text className="text-base font-bold text-foreground">No Saved Hospitals</Text>
 <Text className="text-xs text-muted-foreground text-center mt-2">Bookmarked clinics from the search map will appear here for fast emergency dialer access.</Text>
 <TouchableOpacity onPress={() => navigation.navigate('SearchTab')} className="mt-6 px-4 py-2 bg-primary rounded-xl">
 <Text className="text-white text-xs font-semibold">Explore Discover Maps</Text>
 </TouchableOpacity>
 </View>
 ) : (
 <View className="space-y-4">
 {hospitals.map(hosp => (
 <TouchableOpacity
 key={hosp.id}
 onPress={() => navigation.navigate('HospitalDetail', { id: hosp.id })}
 className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-border "
 >
 <View className="flex-row justify-between items-start mb-2">
 <View className="flex-1 pr-2">
 <Text className="font-extrabold text-foreground text-sm">{hosp.name}</Text>
 <View className="flex-row items-center mt-1">
 <MapPin size={12} color="#64748b" />
 <Text className="text-[10px] text-muted-foreground ml-1 flex-1" numberOfLines={1}>{hosp.address}</Text>
 </View>
 </View>
 <TouchableOpacity onPress={() => handleUnsave(hosp.id)} className="p-2 bg-danger/10 rounded-xl">
 <Heart size={16} color="#ef4444" fill="#ef4444" />
 </TouchableOpacity>
 </View>

 <View className="flex-row items-center gap-2 mb-4">
 <View className="flex-row items-center bg-warning/10 px-2 py-0.5 rounded-lg border border-warning/20">
 <Star size={12} color="#f59e0b" fill="#f59e0b" />
 <Text className="text-[10px] text-warning font-semibold ml-1">{hosp.rating.toFixed(1)}</Text>
 </View>
 {hosp.emergencyAvailable && (
 <View className="bg-danger/10 px-2 py-0.5 rounded-lg border border-danger/20">
 <Text className="text-[9px] text-danger font-bold uppercase">24/7 ER Room</Text>
 </View>
 )}
 </View>

 {hosp.phone ? (
 <TouchableOpacity onPress={() => Linking.openURL(`tel:${hosp.phone}`)} className="bg-emerald-600 py-3 rounded-xl flex-row justify-center items-center gap-2 mt-2">
 <PhoneCall size={14} color="white" />
 <Text className="text-white text-xs font-bold">Call Hospital: {hosp.phone}</Text>
 </TouchableOpacity>
 ) : (
 <TouchableOpacity onPress={() => Linking.openURL('tel:112')} className="bg-red-600 py-3 rounded-xl flex-row justify-center items-center gap-2 mt-2">
 <PhoneCall size={14} color="white" />
 <Text className="text-white text-xs font-bold">Call Emergency Hotline (112)</Text>
 </TouchableOpacity>
 )}
 </TouchableOpacity>
 ))}
 </View>
 )}

 {isEmergencyCallMode && (
 <View className="mt-8 pt-6 border-t border-border">
 <Text className="text-sm font-extrabold text-foreground">Verified National Helplines</Text>
 <Text className="text-[10px] text-muted-foreground mt-1 mb-4">Instant hotlines for dispatching ambulances across India.</Text>
 <View className="space-y-3">
 {emergencyHelplines.map((hl, idx) => (
 <View key={idx} className="bg-white dark:bg-slate-900 border border-red-500/20 rounded-2xl p-4">
 <Text className="font-extrabold text-foreground text-xs">{hl.name}</Text>
 <Text className="text-[10px] text-muted-foreground mt-1 mb-3">{hl.desc}</Text>
 <TouchableOpacity onPress={() => Linking.openURL(`tel:${hl.phone}`)} className="bg-red-600 py-2.5 rounded-xl flex-row justify-center items-center gap-2">
 <PhoneCall size={12} color="white" />
 <Text className="text-white text-[11px] font-bold">Dial Hot: {hl.phone}</Text>
 </TouchableOpacity>
 </View>
 ))}
 </View>
 </View>
 )}
 </ScrollView>
 </SafeAreaView>
 );
};

export default SavedHospitalsScreen;
