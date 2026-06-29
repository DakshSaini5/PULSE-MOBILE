import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Activity, Download, MoreVertical, Calendar, UploadCloud, Camera, Image as ImageIcon, Sparkles } from 'lucide-react-native';
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

export default function ReportCenterScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [reports, setReports] = useState<ScanItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    // Connect to Socket.io backend
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('scan_processed', (payload) => {
      // payload: { scanId, data: { labResults: [], ... } }
      setReports((prev) => 
        prev.map(p => 
          p.id === payload.scanId 
            ? { ...p, status: 'PROCESSED', data: payload.data } 
            : p
        )
      );
      // Auto-navigate to result when processed
      navigation.navigate('ScanResult', { item: { ...payload, data: payload.data }, type: 'report' });
    });

    newSocket.on('scan_failed', (payload) => {
      setReports((prev) => 
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
      formData.append('type', 'LAB_REPORT');
      
      const fileUri = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri;
      
      formData.append('file', {
        uri: fileUri,
        name: asset.fileName || 'report.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const response = await fetch(`${API_URL}/api/scans/upload`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Add to list as PENDING
      setReports([{
        id: data.scanId,
        title: 'New Scan (Processing...)',
        status: 'PENDING',
        date: new Date().toLocaleDateString()
      }, ...reports]);

    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <BaseLayout>
      <CustomHeader title="Lab Reports" />
      
      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* Upload Area */}
        <View className="border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-[32px] p-6 mb-8 shadow-sm">
          <View className="items-center mb-4">
            <View className="bg-indigo-100 p-3 rounded-full mb-2">
              {isUploading ? (
                <ActivityIndicator color="#4F46E5" />
              ) : (
                <UploadCloud color="#4F46E5" size={28} />
              )}
            </View>
            <Text className="text-lg font-black text-slate-900 text-center">Upload Lab Report</Text>
            <Text className="text-slate-500 text-center text-sm px-2 mt-1">
              Upload your test results. Pulse AI will extract biomarkers in the background.
            </Text>
          </View>

          <View className="flex-row justify-center space-x-4 mt-2">
            <TouchableOpacity 
              onPress={() => pickImage(true)}
              disabled={isUploading}
              className={`flex-row items-center bg-white px-5 py-3 rounded-full border border-indigo-100 shadow-sm ${isUploading ? 'opacity-50' : ''}`}
            >
              <Camera color="#4F46E5" size={18} />
              <Text className="font-bold text-indigo-600 ml-2">Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => pickImage(false)}
              disabled={isUploading}
              className={`flex-row items-center bg-white px-5 py-3 rounded-full border border-indigo-100 shadow-sm ${isUploading ? 'opacity-50' : ''}`}
            >
              <ImageIcon color="#4F46E5" size={18} />
              <Text className="font-bold text-indigo-600 ml-2">Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History List */}
        <View className="mb-24">
          <Text className="text-xl font-black text-slate-900 mb-4">Past Reports</Text>
          
          <View className="space-y-4">
            {reports.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => {
                  if (item.status === 'PROCESSED') {
                    navigation.navigate('ScanResult', { item, type: 'report' });
                  }
                }}
                className={`bg-white rounded-3xl p-5 border shadow-sm mb-4 ${item.status === 'PROCESSED' ? 'border-indigo-200' : 'border-slate-100'}`}
              >
                
                <View className="flex-row items-center">
                  <View className="bg-indigo-50 p-4 rounded-2xl mr-4 relative">
                    <Activity color="#4F46E5" size={28} />
                    {item.status === 'PENDING' && (
                      <View className="absolute top-0 right-0 bottom-0 left-0 bg-indigo-50/80 items-center justify-center rounded-2xl">
                        <ActivityIndicator size="small" color="#4F46E5" />
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

            {reports.length === 0 && (
              <View className="items-center justify-center py-10">
                <Text className="text-slate-400 font-medium text-center">No lab reports uploaded yet.</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </BaseLayout>
  );
}
