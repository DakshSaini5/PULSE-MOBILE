import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { useNavigation } from '@react-navigation/native';
import { ShieldCheck, ChevronLeft } from 'lucide-react-native';

export const PrivacyScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      
      {/* Custom Header for Privacy Screen */}
      <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="bg-slate-100 dark:bg-slate-900 h-10 w-10 rounded-full items-center justify-center mr-4"
        >
          <ChevronLeft size={20} color="#64748b" />
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          <ShieldCheck size={20} color="#2563EB" />
          <Text className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Privacy Policy</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        <Text className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-2 tracking-tighter">
          Pulse App Privacy Policy & Data Handling
        </Text>
        <Text className="text-sm font-semibold text-slate-500 mb-8">
          Last Updated: June 25, 2026
        </Text>

        {/* Section 1 */}
        <View className="mb-8">
          <Text className="text-lg font-black text-slate-800 dark:text-slate-100 mb-3 tracking-wide">
            1. What Data We Collect
          </Text>
          <Text className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-2">
            To provide life-saving features and medical triaging, Pulse collects specific data points:
          </Text>
          <View className="ml-2 gap-2">
            <Text className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <Text className="font-bold text-slate-800 dark:text-slate-200">• Account Identity:</Text> Names and Email addresses for secure authentication.
            </Text>
            <Text className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <Text className="font-bold text-slate-800 dark:text-slate-200">• Geolocation (GPS):</Text> Used strictly to map nearby hospitals and broadcast emergency locations during Panic Alerts.
            </Text>
            <Text className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <Text className="font-bold text-slate-800 dark:text-slate-200">• Medical Information:</Text> Images and text parsed from Prescriptions and Lab Reports uploaded by the user.
            </Text>
          </View>
        </View>

        {/* Section 2 */}
        <View className="mb-8">
          <Text className="text-lg font-black text-slate-800 dark:text-slate-100 mb-3 tracking-wide">
            2. How Your Data is Secured
          </Text>
          <Text className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Your data is encrypted both in transit (using TLS 1.3) and at rest. We utilize enterprise-grade, HIPAA-compliant databases (PostgreSQL/Supabase) for structured data and secure blob storage (Cloudinary) with strict access-control policies for all medical images.
          </Text>
        </View>

        {/* Section 3: Critical Clause */}
        <View className="mb-8 bg-blue-50 dark:bg-blue-950/30 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50">
          <Text className="text-lg font-black text-blue-900 dark:text-blue-300 mb-2 tracking-wide">
            3. Zero Sale Policy
          </Text>
          <Text className="text-sm font-bold text-blue-800 dark:text-blue-400 leading-relaxed">
            We do not sell, rent, or share your Protected Health Information (PHI) or personal data to third parties, advertisers, or data brokers under any circumstances.
          </Text>
        </View>

        {/* Section 4 */}
        <View className="mb-8">
          <Text className="text-lg font-black text-slate-800 dark:text-slate-100 mb-3 tracking-wide">
            4. AI Usage
          </Text>
          <Text className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            The Gemini AI integration is used strictly as an on-demand parsing and triage assistant to help you understand your medical reports. The AI does <Text className="font-bold text-slate-800 dark:text-white">not</Text> retain your patient data to train public models, and all processing is ephemeral.
          </Text>
        </View>

        {/* Section 5 */}
        <View className="mb-10">
          <Text className="text-lg font-black text-slate-800 dark:text-slate-100 mb-3 tracking-wide">
            5. Account & Data Deletion
          </Text>
          <Text className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-4">
            You have the absolute right to completely wipe your data from our servers instantly. You can exercise this right at any time by using the "Delete Account" button located in the App Settings.
          </Text>
          <Text className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Upon deletion, all your medical records, chat history, geolocation logs, and saved hospitals are permanently erased and cannot be recovered.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyScreen;
