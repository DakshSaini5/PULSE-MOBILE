import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MapPin, X, Locate } from 'lucide-react-native';
import { useUserLocation } from '../context/LocationContext';
import { geocodingAPI } from '../services/api';

interface Props {
 isOpen: boolean;
 onClose: () => void;
}

const LocationModal: React.FC<Props> = ({ isOpen, onClose }) => {
 const { setManualLocation, requestGPSLocation } = useUserLocation();
 const [street, setStreet] = useState('');
 const [city, setCity] = useState('');
 const [state, setStateName] = useState('');
 const [pincode, setPincode] = useState('');
 const [loading, setLoading] = useState(false);
 const [gpsLoading, setGpsLoading] = useState(false);

 const handleSubmit = async () => {
 if (!city) {
 console.warn('City is required');
 return;
 }

 setLoading(true);
 try {
 const result = await geocodingAPI.geocode({ street, city, state, pincode });
 const cleanCity = result.city || city;
 const cleanState = result.state || state;
 const cleanLabel = `${cleanCity}${cleanState ? `, ${cleanState}` : ''}`;
 
 setManualLocation(result.latitude, result.longitude, cleanLabel);
 onClose();
 } catch (err: any) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 const handleUseGPS = async () => {
 setGpsLoading(true);
 try {
 const success = await requestGPSLocation();
 if (success) onClose();
 } catch (err) {
 console.error(err);
 } finally {
 setGpsLoading(false);
 }
 };

 return (
 <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
 <View className="flex-1 bg-black/60 justify-center items-center p-4">
 <View className="bg-card w-full max-w-md rounded-2xl overflow-hidden">
 
 <View className="bg-blue-500/10 p-6 flex-row items-start justify-between border-b border-blue-500/20">
 <View className="flex-row items-center gap-3">
 <View className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
 <MapPin size={20} color="#3b82f6" />
 </View>
 <View>
 <Text className="text-xl font-bold text-foreground">Set Search Location</Text>
 <Text className="text-sm text-blue-500 mt-1">Specify your current coverage zone</Text>
 </View>
 </View>
 <TouchableOpacity onPress={onClose} className="p-1">
 <X size={20} color="#9ca3af" />
 </TouchableOpacity>
 </View>

 <View className="p-6">
 <TouchableOpacity onPress={handleUseGPS} disabled={gpsLoading} className="w-full flex-row items-center justify-center gap-2 py-3 bg-blue-600 rounded-xl mb-4">
 <Locate size={20} color="white" />
 <Text className="text-white font-medium">{gpsLoading ? 'Detecting Location...' : 'Use Live GPS Location'}</Text>
 </TouchableOpacity>

 <View className="flex-row items-center justify-center mb-4">
 <View className="flex-1 h-[1px] bg-border" />
 <Text className="mx-4 text-xs font-semibold text-muted-foreground uppercase">Or Enter Address</Text>
 <View className="flex-1 h-[1px] bg-border" />
 </View>

 <View className="mb-3">
 <Text className="text-sm font-medium text-foreground mb-1">Area / Street Address (Optional)</Text>
 <TextInput value={street} onChangeText={setStreet} placeholder="Area / Street Address" placeholderTextColor="#9ca3af" className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground" />
 </View>

 <View className="flex-row gap-3 mb-3">
 <View className="flex-1">
 <Text className="text-sm font-medium text-foreground mb-1">City *</Text>
 <TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#9ca3af" className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground" />
 </View>
 <View className="flex-1">
 <Text className="text-sm font-medium text-foreground mb-1">State</Text>
 <TextInput value={state} onChangeText={setStateName} placeholder="State" placeholderTextColor="#9ca3af" className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground" />
 </View>
 </View>

 <View className="mb-6">
 <Text className="text-sm font-medium text-foreground mb-1">Pincode / ZIP Code</Text>
 <TextInput value={pincode} onChangeText={setPincode} placeholder="Pincode" placeholderTextColor="#9ca3af" className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground" />
 </View>

 <View className="flex-row gap-3">
 <TouchableOpacity onPress={onClose} className="flex-1 py-3 border border-border rounded-xl items-center justify-center">
 <Text className="text-foreground font-medium">Cancel</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={handleSubmit} disabled={loading} className="flex-1 py-3 bg-blue-600 rounded-xl items-center justify-center">
 <Text className="text-white font-medium">{loading ? 'Locating...' : 'Set Location'}</Text>
 </TouchableOpacity>
 </View>
 </View>
 </View>
 </View>
 </Modal>
 );
};

export default LocationModal;
