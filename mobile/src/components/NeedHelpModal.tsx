import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { X, MapPin, PhoneCall, ShieldAlert } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface Props {
 isOpen: boolean;
 onClose: () => void;
}

export const NeedHelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
 const navigation = useNavigation<any>();

 return (
 <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
 <View className="flex-1 bg-black/70 justify-center items-center p-4">
 <View className="bg-card w-full max-w-lg rounded-2xl overflow-hidden">
 
 <View className="bg-red-500/10 p-6 flex-row items-start justify-between border-b border-red-500/20">
 <View className="flex-row items-center gap-3">
 <View className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
 <ShieldAlert size={20} color="#ef4444" />
 </View>
 <View>
 <Text className="text-xl font-bold text-foreground">Emergency Services</Text>
 <Text className="text-sm text-red-500 mt-1">Select an action for immediate assistance</Text>
 </View>
 </View>
 <TouchableOpacity onPress={onClose} className="p-1">
 <X size={20} color="#9ca3af" />
 </TouchableOpacity>
 </View>

 <View className="p-6">
 <Text className="text-sm text-muted-foreground mb-6">
 Please choose whether you want to navigate directly to the nearest emergency hospital map or connect immediately with a medical hotline:
 </Text>

 <View className="flex-col gap-4">
 <TouchableOpacity 
 onPress={() => {
 onClose();
 navigation.navigate('Search', { emergency: true, sort: 'distance' });
 }}
 className="p-5 rounded-2xl border border-red-900/30 bg-red-500/10 flex-row items-center gap-4 active:bg-red-500/20"
 >
 <View className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
 <MapPin size={24} color="#ef4444" />
 </View>
 <View className="flex-1">
 <Text className="font-bold text-foreground text-base">Show Hospital</Text>
 <Text className="text-xs text-muted-foreground mt-1 leading-snug">
 Locate and navigate to the nearest active 24/7 ER room automatically.
 </Text>
 </View>
 </TouchableOpacity>

 <TouchableOpacity 
 onPress={() => {
 onClose();
 navigation.navigate('Saved', { emergency_call: true });
 }}
 className="p-5 rounded-2xl border border-emerald-900/30 bg-emerald-500/10 flex-row items-center gap-4 active:bg-emerald-500/20"
 >
 <View className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
 <PhoneCall size={24} color="#10b981" />
 </View>
 <View className="flex-1">
 <Text className="font-bold text-foreground text-base">Emergency Call</Text>
 <Text className="text-xs text-muted-foreground mt-1 leading-snug">
 Dial the personal emergency contact number you filled in your profile immediately.
 </Text>
 </View>
 </TouchableOpacity>
 </View>
 </View>
 </View>
 </View>
 </Modal>
 );
};

export default NeedHelpModal;
