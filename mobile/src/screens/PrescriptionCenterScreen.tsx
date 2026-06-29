import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { FileText, Download, MoreVertical, Calendar, UploadCloud, Camera, Image as ImageIcon, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import BaseLayout from '../components/BaseLayout';
import CustomHeader from '../components/CustomHeader';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';

const API_URL = 'http://192.168.1.3:3000';

interface ScanItem {
  id: string;
  title: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  date: string;
  data?: any;
}

export default function PrescriptionCenterScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [prescriptions, setPrescriptions] = useState<ScanItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    // Connect to Socket.io backend
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('scan_processed', (payload) => {
      // payload: { scanId, data: { medications: [], ... } }
      setPrescriptions((prev) => 
        prev.map(p => 
          p.id === payload.scanId 
            ? { ...p, status: 'PROCESSED', data: payload.data } 
            : p
        )
      );
      // Auto-navigate to result when processed
      navigation.navigate('ScanResult', { item: { ...payload, data: payload.data }, type: 'prescription' });
    });

    newSocket.on('scan_failed', (payload) => {
      setPrescriptions((prev) => 
        prev.map(p => 
          p.id === payload.scanId 
            ? { ...p, status: 'FAILED' } 
            : p
        )
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const pickImage = async (useCamera = false) => {
    let result;
    if (useCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return Alert.alert('Permission needed');
      result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return Alert.alert('Permission needed');
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    }

    if (!result.canceled && result.assets && result.assets[0].uri) {
      uploadToServer(result.assets[0]);
    }
  };

  const uploadToServer = async (asset: any) => {
    if (!user) return Alert.alert('Error', 'You must be logged in to upload.');
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('type', 'PRESCRIPTION');
      
      const fileUri = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri;
      
      formData.append('file', {
        uri: fileUri,
        name: asset.fileName || 'prescription.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const response = await fetch(`${API_URL}/api/scans/upload`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          // Note: Content-Type is intentionally omitted so fetch sets the correct multipart boundary
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Add to list as PENDING
      setPrescriptions([{
        id: data.scanId,
        title: 'New Scan (Processing...)',
        status: 'PENDING',
        date: new Date().toLocaleDateString()
      }, ...prescriptions]);

    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <BaseLayout>
      <CustomHeader title="Prescriptions" />
      
      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* Upload Area */}
        <View className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-[32px] p-6 mb-8 shadow-sm">
          <View className="items-center mb-4">
            <View className="bg-blue-100 p-3 rounded-full mb-2">
              {isUploading ? (
                <ActivityIndicator color="#2563EB" />
              ) : (
                <UploadCloud color="#2563EB" size={28} />
              )}
            </View>
            <Text className="text-lg font-black text-slate-900 text-center">Digitize Prescription</Text>
            <Text className="text-slate-500 text-center text-sm px-2 mt-1">
              Upload a photo. Pulse AI will extract it securely in the background.
            </Text>
          </View>

          <View className="flex-row justify-center space-x-4 mt-2">
            <TouchableOpacity 
              onPress={() => pickImage(true)}
              disabled={isUploading}
              className={`flex-row items-center bg-white px-5 py-3 rounded-full border border-blue-100 shadow-sm ${isUploading ? 'opacity-50' : ''}`}
            >
              <Camera color="#2563EB" size={18} />
              <Text className="font-bold text-blue-600 ml-2">Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => pickImage(false)}
              disabled={isUploading}
              className={`flex-row items-center bg-white px-5 py-3 rounded-full border border-blue-100 shadow-sm ${isUploading ? 'opacity-50' : ''}`}
            >
              <ImageIcon color="#2563EB" size={18} />
              <Text className="font-bold text-blue-600 ml-2">Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History List */}
        <View className="mb-24">
          <Text className="text-xl font-black text-slate-900 mb-4">Digital Prescriptions</Text>
          
          <View className="space-y-4">
            {prescriptions.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => {
                  if (item.status === 'PROCESSED') {
                    navigation.navigate('ScanResult', { item, type: 'prescription' });
                  }
                }}
                className={`bg-white rounded-3xl p-5 border shadow-sm mb-4 ${item.status === 'PROCESSED' ? 'border-blue-200' : 'border-slate-100'}`}
              >
                
                <View className="flex-row items-center">
                  <View className="bg-blue-50 p-4 rounded-2xl mr-4 relative">
                    <FileText color="#2563EB" size={28} />
                    {item.status === 'PENDING' && (
                      <View className="absolute top-0 right-0 bottom-0 left-0 bg-blue-50/80 items-center justify-center rounded-2xl">
                        <ActivityIndicator size="small" color="#2563EB" />
                      </View>
                    )}
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900 mb-1">
                      {item.status === 'PENDING' ? 'Processing Scan...' : item.status === 'FAILED' ? 'Scan Failed' : 'Pulse AI Scanned'}
                    </Text>
                    <View className="flex-row items-center">
                      <Calendar color="#94A3B8" size={14} />
                      <Text className="text-xs text-slate-500 ml-1">{item.date}</Text>
                    </View>
                  </View>
                </View>

              </TouchableOpacity>
            ))}

            {prescriptions.length === 0 && (
              <View className="items-center justify-center py-10">
                <Text className="text-slate-400 font-medium text-center">No prescriptions uploaded yet.</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </BaseLayout>
  );
}
