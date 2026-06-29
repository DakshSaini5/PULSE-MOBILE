import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CloudUpload, FileText, Download, MoreVertical, Calendar } from 'lucide-react-native';
import BaseLayout from '../components/BaseLayout';
import CustomHeader from '../components/CustomHeader';

const MOCK_HISTORY = [
  { id: '1', title: 'Blood Test Results', type: 'Lab Report', date: 'Oct 24, 2024' },
  { id: '2', title: 'Dr. Smith Prescription', type: 'Prescription', date: 'Oct 15, 2024' },
  { id: '3', title: 'Chest X-Ray', type: 'Scan', date: 'Sep 10, 2024' },
];

export default function ScansAndReportsScreen() {
  return (
    <BaseLayout>
      <CustomHeader title="Scans & Reports" />
      
      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Upload Box */}
        <TouchableOpacity 
          className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-3xl p-8 items-center justify-center mb-10"
          activeOpacity={0.7}
        >
          <View className="bg-blue-100 p-4 rounded-full mb-4">
            <CloudUpload color="#2563EB" size={36} />
          </View>
          <Text className="text-lg font-bold text-slate-900 mb-1 text-center">
            Upload Document
          </Text>
          <Text className="text-slate-500 text-center text-sm px-4">
            Tap here to scan a prescription or upload your lab results securely.
          </Text>
        </TouchableOpacity>

        {/* History List */}
        <View className="mb-24">
          <Text className="text-xl font-bold text-slate-900 mb-4">Upload History</Text>
          
          <View className="space-y-4">
            {MOCK_HISTORY.map((item) => (
              <View key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex-row items-center shadow-sm mb-3">
                <View className="bg-slate-50 p-3 rounded-xl mr-4 border border-slate-100">
                  <FileText color="#64748B" size={24} />
                </View>
                
                <View className="flex-1">
                  <Text className="text-base font-bold text-slate-900 mb-1">{item.title}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-sm font-medium text-blue-600 mr-3">{item.type}</Text>
                    <View className="flex-row items-center">
                      <Calendar color="#94A3B8" size={14} />
                      <Text className="text-xs text-slate-500 ml-1">{item.date}</Text>
                    </View>
                  </View>
                </View>
                
                <View className="flex-row items-center space-x-2">
                  <TouchableOpacity className="p-2 bg-slate-50 rounded-full">
                    <Download color="#64748B" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity className="p-2 ml-1">
                    <MoreVertical color="#94A3B8" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </BaseLayout>
  );
}
