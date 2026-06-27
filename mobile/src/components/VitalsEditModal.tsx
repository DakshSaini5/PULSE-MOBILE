import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Shield, X, Save } from 'lucide-react-native';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface VitalsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VitalsEditModal: React.FC<VitalsEditModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setAge(user.age ? user.age.toString() : '');
      setGender(user.gender || '');
      setWeight(user.weight || '');
      setBloodGroup(user.bloodGroup || '');
      setMedicalConditions(user.medicalConditions || '');
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await userAPI.updateProfile({
        age,
        gender,
        weight,
        bloodGroup,
        medicalConditions
      });
      await refreshUser();
      onClose();
    } catch (err) {
      Alert.alert("Error", "Failed to save vitals.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-card w-full rounded-t-3xl overflow-hidden max-h-[85%]">
          
          <View className="bg-primary/10 p-5 flex-row items-center justify-between border-b border-primary/20">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield size={20} color="#2563EB" />
              </View>
              <View>
                <Text className="text-xl font-black text-foreground">Medical Vitals</Text>
                <Text className="text-xs font-semibold text-primary">Used for emergencies</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-muted p-2 rounded-full">
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="mb-4">
              <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Age</Text>
              <TextInput 
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="e.g. 28"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Gender</Text>
              <TextInput 
                value={gender}
                onChangeText={setGender}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="e.g. Male, Female, Other"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Weight</Text>
              <TextInput 
                value={weight}
                onChangeText={setWeight}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="e.g. 72 kg"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Blood Group</Text>
              <TextInput 
                value={bloodGroup}
                onChangeText={setBloodGroup}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="e.g. O+, A-, AB+"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View className="mb-6">
              <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Medical Conditions</Text>
              <TextInput 
                value={medicalConditions}
                onChangeText={setMedicalConditions}
                multiline
                numberOfLines={3}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="e.g. Asthma, Diabetes Type 1, Penicillin Allergy"
                placeholderTextColor="#94a3b8"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            <TouchableOpacity 
              onPress={handleSave} 
              disabled={loading}
              className="w-full bg-primary rounded-xl flex-row items-center justify-center p-4 shadow-sm"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Save size={20} color="white" className="mr-2" />
                  <Text className="text-white font-bold text-base tracking-wide">Save Vitals</Text>
                </>
              )}
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
