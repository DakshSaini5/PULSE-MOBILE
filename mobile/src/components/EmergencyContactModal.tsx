import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { ShieldAlert, X, Phone, User, Heart } from 'lucide-react-native';
import { emergencyAPI } from '../services/api';

interface Props {
 isOpen: boolean;
 onClose: () => void;
 onSuccess: () => void;
}

const EmergencyContactModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
 const [name, setName] = useState('');
 const [phone, setPhone] = useState('');
 const [relationship, setRelationship] = useState('');
 const [loading, setLoading] = useState(false);

 const handleSubmit = async () => {
 if (!name || !phone || !relationship) {
 console.warn('Please fill in all fields');
 return;
 }

 setLoading(true);
 try {
 await emergencyAPI.addContact({ name, phoneNumber: phone, relationship });
 onSuccess();
 } catch (err: any) {
 console.error(err.response?.data?.message || 'Failed to save contact');
 } finally {
 setLoading(false);
 }
 };

 return (
 <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
 <View className="flex-1 bg-black/60 justify-center items-center p-4">
 <View className="bg-card w-full max-w-md rounded-2xl overflow-hidden">
 
 <View className="bg-destructive/10 p-6 flex-row items-start justify-between border-b border-destructive/20">
 <View className="flex-row items-center gap-3">
 <View className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
 <ShieldAlert size={20} color="#ef4444" />
 </View>
 <View>
 <Text className="text-xl font-bold text-foreground">Emergency Contact</Text>
 <Text className="text-sm text-destructive mt-1">Required for Panic Button feature</Text>
 </View>
 </View>
 <TouchableOpacity onPress={onClose} className="p-1">
 <X size={20} color="#9ca3af" />
 </TouchableOpacity>
 </View>

 <View className="p-6">
 <Text className="text-sm text-muted-foreground mb-4">
 Add a trusted contact. If you use the Panic Button, we will instantly notify them with your location.
 </Text>

 <View className="mb-4 relative">
 <Text className="text-sm font-medium text-foreground mb-1">Contact Name</Text>
 <View className="relative justify-center">
 <View className="absolute left-3 z-10">
 <User size={20} color="#9ca3af" />
 </View>
 <TextInput
 value={name}
 onChangeText={setName}
 placeholder="Enter your name"
 placeholderTextColor="#9ca3af"
 className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl text-foreground"
 />
 </View>
 </View>

 <View className="mb-4 relative">
 <Text className="text-sm font-medium text-foreground mb-1">Phone Number</Text>
 <View className="relative justify-center">
 <View className="absolute left-3 z-10">
 <Phone size={20} color="#9ca3af" />
 </View>
 <TextInput
 value={phone}
 onChangeText={setPhone}
 placeholder="Enter your mobile number"
 keyboardType="phone-pad"
 placeholderTextColor="#9ca3af"
 className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl text-foreground"
 />
 </View>
 </View>

 <View className="mb-6 relative">
 <Text className="text-sm font-medium text-foreground mb-1">Relationship</Text>
 <View className="relative justify-center">
 <View className="absolute left-3 z-10">
 <Heart size={20} color="#9ca3af" />
 </View>
 <TextInput
 value={relationship}
 onChangeText={setRelationship}
 placeholder="Relationship"
 placeholderTextColor="#9ca3af"
 className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl text-foreground"
 />
 </View>
 </View>

 <View className="flex-row gap-3">
 <TouchableOpacity onPress={onClose} className="flex-1 py-3 border border-border rounded-xl items-center justify-center">
 <Text className="text-foreground font-medium">Skip for now</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={handleSubmit} disabled={loading} className="flex-1 py-3 bg-destructive rounded-xl items-center justify-center">
 <Text className="text-white font-medium">{loading ? 'Saving...' : 'Save Contact'}</Text>
 </TouchableOpacity>
 </View>
 </View>
 </View>
 </View>
 </Modal>
 );
};

export default EmergencyContactModal;
