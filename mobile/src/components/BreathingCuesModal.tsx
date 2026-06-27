import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { X, Heart, ShieldAlert, PhoneCall, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface Props {
 isOpen: boolean;
 onClose: () => void;
 emergencyContactPhone?: string;
 emergencyContactName?: string;
}

type BreathingState = 'IN' | 'HOLD' | 'OUT';

export const BreathingCuesModal: React.FC<Props> = ({ 
 isOpen, 
 onClose, 
 emergencyContactPhone, 
 emergencyContactName = 'Emergency Contact'
}) => {
 const [step, setStep] = useState<'BREATHE' | 'OPTIONS' | 'YES_OKAY' | 'NO_HELP'>('BREATHE');
 const [breathState, setBreathState] = useState<BreathingState>('IN');
 const [secondsLeft, setSecondsLeft] = useState(4);
 const [cycleCount, setCycleCount] = useState(1);
 const [affirmationIdx, setAffirmationIdx] = useState(0);

 const affirmations = [
 "This feeling will pass. You have survived every panic attack before this one.",
 "You are safe. These sensations cannot harm you.",
 "Focus only on this screen. Nothing else right now.",
 "Slowly relax your shoulders and let your jaw loosen.",
 "You are doing great. Keep following the rhythm.",
 "With each breath out, let go of a bit of tension.",
 "Your heart rate is slowing down. You are in control."
 ];

 const helplines = [
 { name: 'National Emergency Line', phone: '112' },
 { name: 'Ambulance Service', phone: '102' },
 { name: 'Disaster Management', phone: '108' }
 ];

 useEffect(() => {
 if (!isOpen) return;
 setStep('BREATHE');
 setBreathState('IN');
 setSecondsLeft(4);
 setCycleCount(1);
 setAffirmationIdx(0);
 }, [isOpen]);

 useEffect(() => {
 if (!isOpen || step !== 'BREATHE') return;
 const timer = setTimeout(() => {
 if (secondsLeft <= 1) {
 if (breathState === 'IN') {
 setBreathState('HOLD');
 setSecondsLeft(3);
 } else if (breathState === 'HOLD') {
 setBreathState('OUT');
 setSecondsLeft(6);
 } else {
 if (cycleCount >= 7) {
 setStep('OPTIONS');
 } else {
 setBreathState('IN');
 setSecondsLeft(4);
 setCycleCount((c) => c + 1);
 }
 }
 } else {
 setSecondsLeft((s) => s - 1);
 }
 }, 1000);
 return () => clearTimeout(timer);
 }, [isOpen, step, secondsLeft, breathState, cycleCount]);

 useEffect(() => {
 if (!isOpen || step !== 'BREATHE') return;
 const swapInterval = setInterval(() => {
 setAffirmationIdx((prev) => (prev + 1) % affirmations.length);
 }, 6000);
 return () => clearInterval(swapInterval);
 }, [isOpen, step]);

 const getBreathingLabel = () => {
 switch (breathState) {
 case 'IN': return 'Breathe In...';
 case 'HOLD': return 'Hold In...';
 case 'OUT': return 'Breathe Out...';
 default: return '';
 }
 };

 const getBreathingInstructions = () => {
 switch (breathState) {
 case 'IN': return 'Let your chest expand and take a deep breath.';
 case 'HOLD': return 'Keep the air inside and try to relax your shoulders.';
 case 'OUT': return 'Slowly and gently let the air out of your lungs.';
 default: return '';
 }
 };

 return (
 <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
 <View className="flex-1 bg-black/80 justify-center items-center p-4">
 <View className="bg-card w-full max-w-lg rounded-2xl p-6 relative">
 
 <TouchableOpacity onPress={onClose} className="absolute top-4 right-4 z-10 p-2 bg-muted rounded-full">
 <X size={18} color="#64748b" />
 </TouchableOpacity>

 {step === 'BREATHE' && (
 <View className="items-center py-2">
 <View className="bg-primary/20 px-3 py-1 rounded-full mb-2">
 <Text className="text-[10px] text-primary font-bold uppercase tracking-wider">Calming Exercise • Cycle {cycleCount}</Text>
 </View>
 <Text className="text-2xl font-black text-foreground">You're Safe</Text>
 <Text className="text-xs text-muted-foreground mt-1 text-center max-w-[250px]">Follow the animated circle to regulate your heart rate and ease panic.</Text>

 <View className="h-44 w-full flex items-center justify-center relative my-4">
 <View className="w-32 h-32 rounded-full bg-blue-500 justify-center items-center ">
 <Text className="text-xl font-black text-white">{secondsLeft}s</Text>
 </View>
 </View>

 <Text className="text-lg font-extrabold text-foreground">{getBreathingLabel()}</Text>
 <Text className="text-xs text-muted-foreground text-center mt-1 h-8">{getBreathingInstructions()}</Text>

 <View className="min-h-[48px] justify-center my-2">
 <Text className="text-xs text-foreground italic font-semibold text-center">"{affirmations[affirmationIdx]}"</Text>
 </View>

 <View className="flex-row gap-3 w-full mt-4">
 <TouchableOpacity onPress={() => setStep('YES_OKAY')} className="flex-1 py-3 bg-primary rounded-xl flex-row justify-center items-center gap-2">
 <Check size={16} color="white" />
 <Text className="text-white text-xs font-black">Yes, I am okay</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => setStep('NO_HELP')} className="flex-1 py-3 bg-destructive rounded-xl flex-row justify-center items-center gap-2">
 <ShieldAlert size={16} color="white" />
 <Text className="text-white text-xs font-black">Need support</Text>
 </TouchableOpacity>
 </View>
 </View>
 )}

 {step === 'OPTIONS' && (
 <View className="items-center py-6">
 <View className="w-14 h-14 bg-primary/10 rounded-full items-center justify-center mb-4">
 <Heart size={32} color="#1E60D5" />
 </View>
 <Text className="text-2xl font-black text-foreground">Exercise Completed</Text>
 <Text className="text-xs text-muted-foreground text-center max-w-[250px] mt-2 mb-6">You have completed 7 full cycles of deep breathing. How are you feeling now?</Text>
 
 <View className="flex-row gap-3 w-full">
 <TouchableOpacity onPress={() => setStep('YES_OKAY')} className="flex-1 py-3 bg-primary rounded-xl flex-row justify-center items-center gap-2">
 <Check size={16} color="white" />
 <Text className="text-white text-xs font-black">Yes, I am okay</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => setStep('NO_HELP')} className="flex-1 py-3 bg-destructive rounded-xl flex-row justify-center items-center gap-2">
 <ShieldAlert size={16} color="white" />
 <Text className="text-white text-xs font-black">Need support</Text>
 </TouchableOpacity>
 </View>
 </View>
 )}

 {step === 'YES_OKAY' && (
 <View className="items-center py-6">
 <View className="w-14 h-14 bg-emerald-500/10 rounded-full items-center justify-center mb-4">
 <Check size={32} color="#10b981" />
 </View>
 <Text className="text-2xl font-black text-foreground">Glad you are safe!</Text>
 <Text className="text-xs text-muted-foreground text-center max-w-[250px] mt-2 mb-6">Take care of yourself, sip some warm water, and rest. If symptoms persist or feel critical, please consult a medical provider.</Text>
 
 <TouchableOpacity onPress={onClose} className="w-full py-3 bg-muted rounded-xl items-center">
 <Text className="text-foreground text-xs font-bold">Close Guidance</Text>
 </TouchableOpacity>
 </View>
 )}

 {step === 'NO_HELP' && (
 <View className="py-4">
 <View className="mb-4">
 <Text className="text-2xl font-black text-foreground text-center">Let's Connect You</Text>
 <Text className="text-xs text-muted-foreground text-center">Connecting to your contacts or national services can help ease your panic.</Text>
 </View>

 {emergencyContactPhone ? (
 <View className="p-4 rounded-2xl border border-primary/20 bg-primary/5 mb-4">
 <Text className="text-[10px] text-primary uppercase font-bold tracking-wider">Saved Contact</Text>
 <Text className="font-extrabold text-sm text-foreground mt-0.5">{emergencyContactName}</Text>
 <Text className="text-xs text-muted-foreground mb-3">{emergencyContactPhone}</Text>
 <TouchableOpacity className="w-full py-3 bg-emerald-600 rounded-xl flex-row justify-center items-center gap-2">
 <PhoneCall size={16} color="white" />
 <Text className="text-white text-xs font-bold">Call Emergency Contact</Text>
 </TouchableOpacity>
 </View>
 ) : (
 <View className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 mb-4 items-center">
 <Text className="text-xs text-foreground font-medium text-center">No saved emergency contact located.</Text>
 <Text className="text-[10px] text-muted-foreground mt-1 text-center">Please dial verified national medical emergency hotlines below.</Text>
 </View>
 )}

 <View>
 <Text className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">India Emergency Hotlines</Text>
 {helplines.map((hp) => (
 <View key={hp.phone} className="p-3 bg-muted border border-border rounded-xl flex-row items-center justify-between mb-2">
 <View>
 <Text className="font-bold text-xs text-foreground">{hp.name}</Text>
 <Text className="text-[10px] text-muted-foreground">{hp.phone}</Text>
 </View>
 <TouchableOpacity className="py-1.5 px-3 bg-destructive rounded-lg flex-row items-center gap-1">
 <PhoneCall size={12} color="white" />
 <Text className="text-white text-[10px] font-bold">Dial {hp.phone}</Text>
 </TouchableOpacity>
 </View>
 ))}
 </View>
 </View>
 )}

 </View>
 </View>
 </Modal>
 );
};

export default BreathingCuesModal;
