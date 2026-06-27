import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Activity, Search, FileText, User as UserIcon, ShieldAlert, Wind } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useUserLocation } from '../context/LocationContext';
import { emergencyAPI, EmergencyContact } from '../services/api';

import BreathingCuesModal from './BreathingCuesModal';
import PanicActionModal from './PanicActionModal';

export const MobileBottomNav: React.FC = () => {
 const { user } = useAuth();
 const { latitude, longitude } = useUserLocation();
 const navigation = useNavigation<any>();
 const route = useRoute();
 
 const [showPanicModal, setShowPanicModal] = useState(false);
 const [showBreathingModal, setShowBreathingModal] = useState(false);
 const [contacts, setContacts] = useState<EmergencyContact[]>([]);
 const [panicLoading, setPanicLoading] = useState(false);

 useEffect(() => {
 if (user) {
 emergencyAPI.getContacts()
 .then(setContacts)
 .catch(console.error);
 }
 }, [user]);

  const isActive = (tabName: string) => {
    return route.name === tabName;
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
 };

 if (!user) return null;

 return (
 <>
 <View className="absolute bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-5">
 <View className="flex flex-row items-center justify-around px-2 py-2">
 
  <TouchableOpacity onPress={() => navigation.navigate('SearchTab')} className="flex flex-col items-center gap-1 px-3 py-1">
  <Search size={20} color={isActive('SearchTab') ? '#2563EB' : '#64748b'} />
  <Text className={`text-[10px] font-medium ${isActive('SearchTab') ? 'text-primary' : 'text-muted-foreground'}`}>Discover</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => navigation.navigate('PrescriptionTab')} className="flex flex-col items-center gap-1 px-3 py-1">
  <FileText size={20} color={isActive('PrescriptionTab') ? '#2563EB' : '#64748b'} />
  <Text className={`text-[10px] font-medium ${isActive('PrescriptionTab') ? 'text-primary' : 'text-muted-foreground'}`}>Records</Text>
  </TouchableOpacity>

  <TouchableOpacity 
  onPress={handlePanicClick}
  disabled={panicLoading}
  className="flex flex-col items-center gap-1 -mt-6 active:opacity-80"
  >
  <View className="h-14 w-14 rounded-full bg-destructive flex items-center justify-center border-4 border-card shadow-lg">
  {panicLoading ? <Activity size={24} color="white" /> : <ShieldAlert size={24} color="white" />}
  </View>
  <Text className="text-[10px] font-bold text-destructive tracking-wide mt-1">PANIC</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => navigation.navigate('HealthTrendsTab')} className="flex flex-col items-center gap-1 px-3 py-1">
  <Activity size={20} color={isActive('HealthTrendsTab') ? '#2563EB' : '#64748b'} />
  <Text className={`text-[10px] font-medium ${isActive('HealthTrendsTab') ? 'text-primary' : 'text-muted-foreground'}`}>Trends</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')} className="flex flex-col items-center gap-1 px-3 py-1">
  <UserIcon size={20} color={isActive('ProfileTab') ? '#2563EB' : '#64748b'} />
  <Text className={`text-[10px] font-medium ${isActive('ProfileTab') ? 'text-primary' : 'text-muted-foreground'}`}>Profile</Text>
  </TouchableOpacity>

 </View>
 </View>
 
 <TouchableOpacity 
 onPress={() => setShowBreathingModal(true)}
 className="absolute bottom-[90px] left-4 h-12 w-12 bg-sky-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 z-40"
 >
 <Wind size={22} color="white" />
 </TouchableOpacity>

 <BreathingCuesModal 
 isOpen={showBreathingModal} 
 onClose={() => setShowBreathingModal(false)} 
 emergencyContactPhone={contacts.length > 0 ? contacts[0].phoneNumber : undefined}
 emergencyContactName={contacts.length > 0 ? contacts[0].name : undefined}
 />

 <PanicActionModal 
 isOpen={showPanicModal}
 onClose={() => setShowPanicModal(false)}
 primaryContactPhone={contacts.length > 0 ? contacts[0].phoneNumber : undefined}
 primaryContactName={contacts.length > 0 ? contacts[0].name : undefined}
 onTriggerSilentPanic={triggerPanic}
 />
 </>
 );
};

export default MobileBottomNav;
