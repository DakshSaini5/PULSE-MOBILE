import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Pill, AlertCircle, Activity, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomHeader from '../components/CustomHeader';

export default function ScanResultScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { item, type } = route.params || {};

  const isPrescription = type === 'prescription';
  const data = item?.data;

  // Fallback if data is missing
  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <CustomHeader title="Scan Results" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-500">No results found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle both raw AI keys and Prisma relation keys
  const medicationsList = data.medications || data.medicines || [];
  const labResultsList = data.labResults || data.biomarkers || [];

  let aiSummary = data.summary || null;
  if (data.aiSummaryJson && typeof data.aiSummaryJson === 'string') {
    try {
      aiSummary = JSON.parse(data.aiSummaryJson);
    } catch (e) {}
  }

  // Helper to parse reference range for visual gauge
  const getGaugePercentage = (valStr: string, rangeStr: string) => {
    try {
      const val = parseFloat(valStr);
      if (isNaN(val)) return null;
      const parts = rangeStr.split('-');
      if (parts.length === 2) {
        const min = parseFloat(parts[0]);
        const max = parseFloat(parts[1]);
        if (!isNaN(min) && !isNaN(max)) {
          const range = max - min;
          if (range === 0) return 50;
          let pct = ((val - min) / range) * 100;
          if (pct < 0) pct = 5;
          if (pct > 100) pct = 95;
          return pct;
        }
      }
    } catch (e) {}
    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 bg-gray-50 p-2 rounded-full">
          <ArrowLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-black text-slate-900">
            {isPrescription ? 'Prescription Insights' : 'Lab Report Insights'}
          </Text>
          <Text className="text-xs text-blue-600 font-bold uppercase tracking-wider">
            Verified by Pulse AI
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 bg-slate-50 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        
        {/* Prescription View */}
        {isPrescription && medicationsList.length > 0 && (
          <View className="space-y-4 mb-10">
            {medicationsList.map((med: any, idx: number) => (
              <View key={idx} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <View className="bg-blue-50 p-3 rounded-2xl mr-3">
                    <Pill color="#2563EB" size={24} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-black text-slate-900">{med.medicineName || med.name}</Text>
                    <Text className="text-blue-600 font-bold">{med.dosage}</Text>
                  </View>
                </View>
                
                {(med.simplifiedExplanation || med.description) && (
                  <View className="bg-blue-50/50 p-4 rounded-2xl mb-4 border border-blue-100">
                    <Text className="text-slate-700 font-medium leading-5">
                      {med.simplifiedExplanation || med.description}
                    </Text>
                  </View>
                )}
                
                {(med.instructions || med.frequency) && (
                  <View className="flex-row items-start mb-3">
                    <CheckCircle2 color="#10B981" size={18} className="mt-0.5 mr-2" />
                    <View className="flex-1">
                      <Text className="font-bold text-slate-800 mb-0.5">Instructions</Text>
                      <Text className="text-slate-600 leading-5">{med.instructions || med.frequency}</Text>
                    </View>
                  </View>
                )}

                {med.sideEffects && med.sideEffects.length > 0 && (
                  <View className="flex-row items-start mb-3">
                    <AlertCircle color="#F59E0B" size={18} className="mt-0.5 mr-2" />
                    <View className="flex-1">
                      <Text className="font-bold text-slate-800 mb-0.5">Common Side Effects</Text>
                      <Text className="text-slate-600 leading-5">
                        {Array.isArray(med.sideEffects) ? med.sideEffects.join(', ') : med.sideEffects}
                      </Text>
                    </View>
                  </View>
                )}

                {med.drugInteractions && med.drugInteractions.length > 0 && (
                  <View className="flex-row items-start">
                    <ShieldAlert color="#EF4444" size={18} className="mt-0.5 mr-2" />
                    <View className="flex-1">
                      <Text className="font-bold text-slate-800 mb-0.5">Interactions</Text>
                      <Text className="text-slate-600 leading-5">
                        {Array.isArray(med.drugInteractions) ? med.drugInteractions.join(', ') : med.drugInteractions}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Report View */}
        {!isPrescription && labResultsList.length > 0 && (
          <View className="mb-10">
            {/* Displaying AI Summary if present */}
            {aiSummary && (
              <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-6">
                <View className="flex-row items-center mb-3">
                  <Sparkles color="#2563EB" size={24} className="mr-2" />
                  <Text className="text-lg font-black text-slate-900">Health Summary</Text>
                </View>
                <Text className="text-slate-700 leading-6">{aiSummary.healthSummary}</Text>
                
                <View className="mt-4 pt-4 border-t border-slate-100 flex-row items-center justify-between">
                  <Text className="font-bold text-slate-800">Overall Status</Text>
                  <View className={`px-3 py-1 rounded-full ${aiSummary.overallStatus === 'CRITICAL' ? 'bg-red-100' : 'bg-green-100'}`}>
                    <Text className={`font-black text-xs ${aiSummary.overallStatus === 'CRITICAL' ? 'text-red-600' : 'text-green-600'}`}>
                      {aiSummary.overallStatus}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <Text className="text-lg font-black text-slate-900 mb-4 px-1">Detailed Biomarkers</Text>
            
            <View className="space-y-3">
              {labResultsList.map((marker: any, idx: number) => {
                const pct = getGaugePercentage(marker.value, marker.referenceRange);
                return (
                  <View key={idx} className={`bg-white rounded-2xl p-4 border shadow-sm ${marker.isAbnormal ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}>
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1 pr-4">
                        <Text className="font-bold text-slate-900 text-base mb-1">{marker.key || marker.name}</Text>
                        <Text className="text-slate-500 text-xs">Range: {marker.referenceRange} {marker.unit}</Text>
                      </View>
                      <View className="items-end">
                        <Text className={`font-black text-xl ${marker.isAbnormal ? 'text-red-600' : 'text-slate-900'}`}>
                          {marker.value}
                        </Text>
                        <Text className="text-slate-400 text-xs">{marker.unit}</Text>
                      </View>
                    </View>
                    
                    {/* Visual Gauge */}
                    {pct !== null && (
                      <View className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 relative">
                        <View className="absolute top-0 bottom-0 left-0 bg-green-200" style={{ width: '100%' }} />
                        <View 
                          className={`absolute top-0 bottom-0 w-2 h-2 rounded-full -ml-1 ${marker.isAbnormal ? 'bg-red-500' : 'bg-green-600'}`} 
                          style={{ left: `${pct}%`, top: -1 }} 
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
