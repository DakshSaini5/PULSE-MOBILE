import React from 'react';
import { Modal, View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { Phone, ShieldAlert, X, Radio } from 'lucide-react-native';

interface PanicActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryContactPhone?: string;
  primaryContactName?: string;
  onTriggerSilentPanic: () => void;
}

const PanicActionModal: React.FC<PanicActionModalProps> = ({ 
  isOpen, 
  onClose, 
  primaryContactPhone,
  primaryContactName,
  onTriggerSilentPanic
}) => {

  const handleCallAmbulance = () => {
    Linking.openURL('tel:112');
  };

  const handleCallContact = () => {
    if (primaryContactPhone) {
      Linking.openURL(`tel:${primaryContactPhone}`);
    } else {
      Alert.alert("No Contact Saved", "You haven't saved any emergency contacts yet.");
    }
  };

  const handleSilentPanic = () => {
    onTriggerSilentPanic();
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-card w-full rounded-t-3xl overflow-hidden pb-10">
          
          {/* Header */}
          <View className="bg-destructive/10 p-6 flex-row items-center justify-between border-b border-destructive/20">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center">
                <ShieldAlert size={28} color="white" />
              </View>
              <View>
                <Text className="text-2xl font-black text-foreground">Emergency</Text>
                <Text className="text-sm font-semibold text-destructive mt-0.5">What do you need right now?</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-muted p-2 rounded-full">
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="p-6 gap-4">
            
            <TouchableOpacity 
              onPress={handleCallAmbulance}
              className="w-full bg-red-600 rounded-2xl flex-row items-center p-4 shadow-sm active:opacity-80"
            >
              <View className="bg-white/20 p-3 rounded-full mr-4">
                <Phone size={24} color="white" />
              </View>
              <View>
                <Text className="text-white font-black text-xl tracking-wide">Call Ambulance</Text>
                <Text className="text-red-100 font-semibold text-xs mt-1">Dials 112 directly</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleCallContact}
              className="w-full bg-slate-800 dark:bg-slate-100 rounded-2xl flex-row items-center p-4 shadow-sm active:opacity-80"
            >
              <View className="bg-white/20 dark:bg-black/10 p-3 rounded-full mr-4">
                <Phone size={24} className="text-white dark:text-slate-900" />
              </View>
              <View className="flex-1">
                <Text className="text-white dark:text-slate-900 font-black text-xl tracking-wide">Call Contact</Text>
                <Text className="text-slate-400 dark:text-slate-500 font-semibold text-xs mt-1" numberOfLines={1}>
                  {primaryContactName ? `Dials ${primaryContactName}` : 'No contact saved'}
                </Text>
              </View>
            </TouchableOpacity>

            <View className="h-px bg-border my-2" />

            <TouchableOpacity 
              onPress={handleSilentPanic}
              className="w-full bg-amber-500 rounded-2xl flex-row items-center p-4 shadow-sm active:opacity-80"
            >
              <View className="bg-white/20 p-3 rounded-full mr-4">
                <Radio size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-black text-xl tracking-wide">Silent SOS SMS</Text>
                <Text className="text-amber-100 font-semibold text-xs mt-1 leading-tight">
                  Dispatches background GPS SMS to your contacts
                </Text>
              </View>
            </TouchableOpacity>

          </View>
          
        </View>
      </View>
    </Modal>
  );
};

export default PanicActionModal;
