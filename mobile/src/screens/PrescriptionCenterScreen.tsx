import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { useAuth } from '../context/AuthContext';
import { prescriptionAPI, Prescription } from '../services/api';
import { FileText, UploadCloud, FileSearch, CheckCircle2, Clock, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';

export const PrescriptionCenterScreen = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<Prescription | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Encrypting and uploading image...");
  const timeoutIds = React.useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await prescriptionAPI.getAll();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera roll permissions to upload prescriptions.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleUpload(result.assets[0]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUpload = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploading(true);
    setLatestAnalysis(null);
    setLoadingMessage("Encrypting and uploading image...");

    timeoutIds.current.push(setTimeout(() => setLoadingMessage("Squinting at the doctor's handwriting..."), 1200));
    timeoutIds.current.push(setTimeout(() => setLoadingMessage("Teaching the AI to read cursive..."), 2400));
    timeoutIds.current.push(setTimeout(() => setLoadingMessage("Cross-referencing the medical dictionary..."), 3600));
    timeoutIds.current.push(setTimeout(() => setLoadingMessage("Checking side effects and interactions..."), 4800));
    timeoutIds.current.push(setTimeout(() => setLoadingMessage("Finalizing clinical data..."), 6000));

    try {
      const formData = new FormData();
      const localUri = asset.uri;
      const filename = asset.fileName || localUri.split('/').pop() || 'prescription.jpg';
      const type = asset.mimeType || 'image/jpeg';

      let cleanUri = localUri;
      if (Platform.OS === 'ios') {
        cleanUri = localUri.startsWith('file://') ? localUri : `file://${localUri}`;
      }

      formData.append('file', {
        uri: cleanUri,
        name: filename,
        type: type,
      } as any);

      const userStr = await SecureStore.getItemAsync('pulse_user');
      if (userStr) {
        formData.append('userId', JSON.parse(userStr).id);
      }

      const res = await prescriptionAPI.upload(formData);
      setLatestAnalysis(res);
      await fetchHistory();
      Alert.alert('Success', 'Prescription analyzed successfully!');
    } catch (err) {
      console.error("Upload failed", err);
      Alert.alert('Upload Failed', 'Failed to analyze the prescription. Please try again.');
    } finally {
      setUploading(false);
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];
    }
  };

  if (uploading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center space-y-4 bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#007bff" />
        <Text className="text-gray-500 font-semibold text-center px-6 mt-4">
          {loadingMessage}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      
      {/* Header */}
      <View className="px-5 pt-4 pb-3 bg-white dark:bg-slate-900 border-b border-border z-20">
        <View className="flex-row items-center gap-2 mb-2">
          <View className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <FileText size={16} color="#10b981" />
          </View>
          <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Prescriptions</Text>
        </View>
        <Text className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">
          Upload handwritten prescriptions. Our AI will digitize them instantly.
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Upload Card */}
        <View className="p-5">
          <TouchableOpacity 
            onPress={handleImagePick}
            disabled={uploading}
            className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-3xl p-8 items-center justify-center shadow-sm"
          >
                <View className="h-16 w-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-800/50">
                  <UploadCloud size={32} color="#10b981" strokeWidth={1.5} />
                </View>
                <Text className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-wide mb-2">
                  Tap to Choose Image
                </Text>
                <Text className="text-[10px] text-slate-500 font-bold text-center">
                  Select a photo of your prescription
                </Text>
                <View className="mt-5 bg-emerald-600 px-6 py-2.5 rounded-full shadow-sm">
                  <Text className="text-white text-xs font-black tracking-wide">CHOOSE FILE</Text>
                </View>
          </TouchableOpacity>
        </View>

        {/* Latest Analysis Results */}
        {latestAnalysis && latestAnalysis.prescriptionAnalysis && latestAnalysis.prescriptionAnalysis.length > 0 && (
          <View className="px-5 pb-5">
            <Text className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3">Extracted Medicines</Text>
            {latestAnalysis.prescriptionAnalysis.map((med: any, idx: number) => (
              <View key={idx} className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl mb-3 border border-emerald-100 dark:border-emerald-800/50">
                <Text className="text-lg font-black text-emerald-700 dark:text-emerald-400 mb-1">{med.medicineName}</Text>
                <View className="flex-row gap-4 mb-2">
                  <View>
                    <Text className="text-[10px] text-slate-500 font-bold uppercase">Dosage</Text>
                    <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">{med.dosage}</Text>
                  </View>
                </View>
                <Text className="text-[10px] text-slate-500 font-bold uppercase mt-1">Instructions</Text>
                <Text className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">{med.instructions}</Text>

                {med.simplifiedExplanation ? (
                  <View className="mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
                    <Text className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-0.5">What it's for</Text>
                    <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">{med.simplifiedExplanation}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* History Log */}
        <View className="px-5 pb-5">
          <View className="flex-row items-center justify-between mb-4 mt-2">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Scanned Document History
            </Text>
            <TouchableOpacity>
              <Text className="text-[10px] font-bold text-primary">View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#10b981" className="my-10" />
          ) : history.length === 0 ? (
            <View className="bg-white dark:bg-slate-900 rounded-2xl border border-border p-8 items-center justify-center shadow-sm">
              <FileSearch size={32} color="#cbd5e1" className="mb-3" />
              <Text className="text-xs font-bold text-slate-500 text-center">
                No prescriptions digitized yet.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {history.map((item) => (
                <View key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-border overflow-hidden shadow-sm">
                  <View className="flex-row items-center p-4">
                    {/* Thumbnail Mock */}
                    <View className="h-12 w-10 bg-slate-100 dark:bg-slate-800 rounded border border-border items-center justify-center mr-4">
                      <FileText size={16} color="#94a3b8" />
                    </View>
                    
                    {/* Info */}
                    <View className="flex-1">
                      <View className="flex-row justify-between items-start mb-1">
                        <Text className="font-bold text-slate-800 dark:text-slate-100 text-sm flex-1 mr-2" numberOfLines={1}>
                          {item.fileUrl?.split('/').pop() || 'Prescription_Doc'}
                        </Text>
                        <View className="bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                          <Text className="text-[8px] font-black tracking-wider text-emerald-600 dark:text-emerald-400">PROCESSED</Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center gap-2">
                        <Clock size={10} color="#94a3b8" />
                        <Text className="text-[10px] font-semibold text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                        <Text className="text-slate-300">•</Text>
                        <Text className="text-[10px] font-semibold text-slate-500">
                          {item.prescriptionAnalysis?.length || 0} meds found
                        </Text>
                      </View>
                    </View>
                    
                    <ChevronRight size={16} color="#cbd5e1" className="ml-2" />
                  </View>
                  
                  {/* Results preview snippet */}
                  <View className="bg-slate-50 dark:bg-slate-950 px-4 py-2 border-t border-border flex-row items-center">
                    <CheckCircle2 size={12} color="#10b981" />
                    <Text className="text-[9px] font-bold text-slate-600 dark:text-slate-400 ml-1.5">
                      Digitized successfully using Pulse AI Engine
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default PrescriptionCenterScreen;
