import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react-native';

export const MedicalDisclaimer: React.FC = () => {
 const [isVisible, setIsVisible] = useState(true);

 if (!isVisible) return null;

 return (
 <View className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl mb-6 flex-row gap-3 relative overflow-hidden">
 <View className="pt-0.5">
 <ShieldAlert size={20} color="#d97706" />
 </View>
 <View className="flex-1 pr-6">
 <Text className="text-sm font-bold text-amber-800">Educational Purpose Only</Text>
 <Text className="text-sm text-amber-700 mt-1">
 Pulse provides AI-generated information. This is <Text className="font-bold">NOT medical advice</Text>. 
 Always consult a qualified healthcare professional before making any health decisions.
 </Text>
 </View>
 <TouchableOpacity 
 onPress={() => setIsVisible(false)}
 className="absolute top-2 right-2 p-1.5"
 >
 <X size={16} color="#d97706" />
 </TouchableOpacity>
 </View>
 );
};

export const AIModalDisclaimer: React.FC<{ onAcknowledge: () => void }> = ({ onAcknowledge }) => {
 return (
 <Modal transparent animationType="fade">
 <View className="flex-1 justify-center items-center p-4 bg-slate-900/40">
 <View className="bg-card max-w-md w-full rounded-2xl overflow-hidden border border-border">
 <View className="bg-amber-500/10 p-6 items-center border-b border-amber-500/20">
 <View className="w-14 h-14 bg-amber-500/20 rounded-full items-center justify-center mb-4">
 <AlertTriangle size={28} color="#d97706" />
 </View>
 <Text className="text-xl font-bold text-foreground">Important Medical Notice</Text>
 </View>
 <View className="p-6">
 <Text className="text-sm text-muted-foreground leading-relaxed mb-4">
 You are about to use Pulse's AI-assisted analysis tools. Please understand that:
 </Text>
 <View className="mb-4 ml-2">
 <Text className="text-sm text-muted-foreground">• AI outputs may contain errors.</Text>
 <Text className="text-sm text-muted-foreground mt-1">• This tool cannot diagnose conditions.</Text>
 <Text className="text-sm text-muted-foreground mt-1">• For educational purposes only.</Text>
 </View>
 <Text className="font-semibold text-foreground pt-2 border-t border-border">
 By proceeding, you agree to consult a licensed physician for any medical concerns.
 </Text>
 </View>
 <View className="p-4 bg-muted border-t border-border items-end">
 <TouchableOpacity
 onPress={onAcknowledge}
 className="px-6 py-2.5 bg-primary rounded-xl"
 >
 <Text className="text-primary-foreground font-bold text-center">I Understand & Agree</Text>
 </TouchableOpacity>
 </View>
 </View>
 </View>
 </Modal>
 );
};
