import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Activity, Search, FileText, User as UserIcon, ShieldAlert } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useUserLocation } from '../context/LocationContext';
import { emergencyAPI, EmergencyContact } from '../services/api';

// TODO: Replace toast with native toast component
// import toast from 'react-hot-toast';

export const MobileBottomNav: React.FC = () => {
 const { user } = useAuth();
 const { latitude, longitude } = useUserLocation();
 const navigation = useNavigation<any>();
 const route = useRoute();
 
 const [showPanicModal, setShowPanicModal] = useState(false);
 const [contacts, setContacts] = useState<EmergencyContact[]>([]);
 const [panicLoading, setPanicLoading] = useState(false);

 useEffect(() => {
 if (user) {
 emergencyAPI.getContacts()
 .then(setContacts)
 .catch(console.error);
 }
 }, [user]);

 const isActive = (path: string) => {
 return route.name.toLowerCase() === path.replace('/', '').toLowerCase();
 };

 const triggerPanic = async () => {
 if (contacts.length === 0) {
 console.warn('You must save at least one emergency contact before triggering a Panic alert!');
 return;
 }

 setPanicLoading(true);
 try {
 // Sending live GPS coordinates from LocationContext to emergency API
 const res = (await emergencyAPI.triggerPanic(latitude, longitude)) as any;
 if (res.simulated) {
 console.log('🚨 EMERGENCY ALERT SIMULATED');
 } else {
 console.log('Live emergency SMS alerts successfully dispatched!');
 }
 } catch (err: any) {
 console.error(err);
 } finally {
 setPanicLoading(false);
 }
 };

 const handlePanicClick = () => {
 setShowPanicModal(true);
 triggerPanic();
 };

 if (!user) return null;

 return (
 <>
 <View className="absolute bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-5">
 <View className="flex flex-row items-center justify-around px-2 py-2">
 
 <TouchableOpacity onPress={() => navigation.navigate('Search')} className="flex flex-col items-center gap-1 px-3 py-1">
 <Search size={20} color={isActive('/search') ? '#2563EB' : '#64748b'} />
 <Text className={`text-[10px] font-medium ${isActive('/search') ? 'text-primary' : 'text-muted-foreground'}`}>Discover</Text>
 </TouchableOpacity>

 <TouchableOpacity onPress={() => navigation.navigate('Prescriptions')} className="flex flex-col items-center gap-1 px-3 py-1">
 <FileText size={20} color={isActive('/prescriptions') ? '#2563EB' : '#64748b'} />
 <Text className={`text-[10px] font-medium ${isActive('/prescriptions') ? 'text-primary' : 'text-muted-foreground'}`}>Records</Text>
 </TouchableOpacity>

 <TouchableOpacity 
 onPress={handlePanicClick}
 disabled={panicLoading}
 className="flex flex-col items-center gap-1 -mt-6 active:opacity-80"
 >
 <View className="h-14 w-14 rounded-full bg-destructive flex items-center justify-center border-4 border-card">
 {panicLoading ? <Activity size={24} color="white" /> : <ShieldAlert size={24} color="white" />}
 </View>
 <Text className="text-[10px] font-bold text-destructive tracking-wide">PANIC</Text>
 </TouchableOpacity>

 <TouchableOpacity onPress={() => navigation.navigate('Trends')} className="flex flex-col items-center gap-1 px-3 py-1">
 <Activity size={20} color={isActive('/trends') ? '#2563EB' : '#64748b'} />
 <Text className={`text-[10px] font-medium ${isActive('/trends') ? 'text-primary' : 'text-muted-foreground'}`}>Trends</Text>
 </TouchableOpacity>

 <TouchableOpacity onPress={() => navigation.navigate('Profile')} className="flex flex-col items-center gap-1 px-3 py-1">
 <UserIcon size={20} color={isActive('/profile') ? '#2563EB' : '#64748b'} />
 <Text className={`text-[10px] font-medium ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}>Profile</Text>
 </TouchableOpacity>

 </View>
 </View>
 {/* TODO: Add BreathingCuesModal implementation */}
 </>
 );
};

export default MobileBottomNav;
