import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  Stethoscope, Syringe, FlaskConical, Bone, 
  Heart, Brain, Eye, Baby 
} from 'lucide-react-native';

const services = [
  { id: "general", label: "General", icon: Stethoscope, bg: "bg-blue-100 dark:bg-blue-900/30", color: "#3b82f6" },
  { id: "vaccination", label: "Vaccination", icon: Syringe, bg: "bg-emerald-100 dark:bg-emerald-900/30", color: "#10b981" },
  { id: "blood-test", label: "Blood Test", icon: FlaskConical, bg: "bg-rose-100 dark:bg-rose-900/30", color: "#f43f5e" },
  { id: "dental", label: "Dental", icon: Bone, bg: "bg-amber-100 dark:bg-amber-900/30", color: "#f59e0b" },
  { id: "cardiology", label: "Cardiology", icon: Heart, bg: "bg-red-100 dark:bg-red-900/30", color: "#ef4444" },
  { id: "neurology", label: "Neurology", icon: Brain, bg: "bg-purple-100 dark:bg-purple-900/30", color: "#8b5cf6" },
  { id: "eye-care", label: "Eye Care", icon: Eye, bg: "bg-cyan-100 dark:bg-cyan-900/30", color: "#06b6d4" },
  { id: "pediatrics", label: "Pediatrics", icon: Baby, bg: "bg-pink-100 dark:bg-pink-900/30", color: "#ec4899" },
];

export const ServicesGrid = () => {
  const navigation = useNavigation<any>();

  return (
    <View className="px-5 py-2">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Browse Services</Text>
        <TouchableOpacity>
          <Text className="text-xs font-bold text-primary">View All</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-5">
        {services.map((service) => {
          const Icon = service.icon;
          
          const handleServicePress = () => {
            const label = service.label;
            if (label === 'General') {
              navigation.navigate('SearchTab', { specialty: 'General', query: '' });
            } else if (label === 'Vaccination') {
              navigation.navigate('SearchTab', { specialty: 'Pediatrics', query: '' });
            } else if (label === 'Blood Test') {
              navigation.navigate('SearchTab', { specialty: 'Hematology', query: '' });
            } else if (label === 'Eye Care') {
              navigation.navigate('SearchTab', { specialty: 'Ophthalmology', query: '' });
            } else {
              navigation.navigate('SearchTab', { specialty: label, query: '' });
            }
          };

          return (
            <TouchableOpacity
              key={service.id}
              className="w-[22%] flex-col items-center active:scale-95 transition-transform"
              onPress={handleServicePress}
            >
              <View className={`h-14 w-14 rounded-full items-center justify-center mb-2 ${service.bg}`}>
                <Icon size={24} color={service.color} strokeWidth={2.5} />
              </View>
              <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center tracking-tight leading-tight">
                {service.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
