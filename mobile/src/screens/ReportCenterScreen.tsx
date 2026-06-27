import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, BackHandler, Platform } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { reportAPI, MedicalReport, hospitalAPI, Hospital } from '../services/api';
import { FileText, UploadCloud, Trash2, Plus, Sparkles, Activity, CheckCircle, MapPin, Star } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useUserLocation } from '../context/LocationContext';

export const ReportCenterScreen = () => {
 const { user } = useAuth();
 const navigation = useNavigation<any>();
 const { latitude: lat, longitude: lng } = useUserLocation();

 const [reports, setReports] = useState<MedicalReport[]>([]);
 const [loading, setLoading] = useState(true);
 const [uploading, setUploading] = useState(false);
 const [loadingMessage, setLoadingMessage] = useState("Encrypting and uploading image...");
 const timeoutIds = React.useRef<NodeJS.Timeout[]>([]);
 
 // Views: 'list' | 'detail' | 'verify'
 const [view, setView] = useState<'list' | 'detail' | 'verify'>('list');
 const [activeReport, setActiveReport] = useState<MedicalReport | null>(null);
 
 const [rawText, setRawText] = useState('');
 const [reportType, setReportType] = useState('CBC');
 const [reportValues, setReportValues] = useState<Array<any>>([]);
 const [verifying, setVerifying] = useState(false);

 // Specialist recommendation matched hospitals
 const [matchedHospitals, setMatchedHospitals] = useState<{ [specialty: string]: Hospital[] }>({});
 const [loadingClinics, setLoadingClinics] = useState(false);

 const fetchReports = async () => {
 if (!user) return;
 setLoading(true);
 try {
 const data = await reportAPI.getAll();
 setReports(data.data || data); // handle standard or paginated format
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    const fetchNearbyClinicsForReferrals = async () => {
      if (view !== 'detail' || !activeReport?.specialists || activeReport.specialists.length === 0) {
        return;
      }
      setLoadingClinics(true);
      try {
        const matches: { [specialty: string]: Hospital[] } = {};
        for (const spec of activeReport.specialists) {
          const specName = spec.specialtyName;
          const data = await hospitalAPI.search('', specName, 25, lat || 28.6139, lng || 77.2090);
          matches[specName] = data.slice(0, 3);
        }
        setMatchedHospitals(matches);
      } catch (err) {
        console.error('[Reports] Error fetching clinics for referrals:', err);
      } finally {
        setLoadingClinics(false);
      }
    };
    fetchNearbyClinicsForReferrals();
  }, [view, activeReport, lat, lng]);

  // Handle Android hardware back button to navigate between views
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (view === 'verify' || view === 'detail') {
          setView('list');
          return true; // prevent default back action
        }
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [view])
  );

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera roll permissions to upload medical reports.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        setLoadingMessage("Encrypting and uploading image...");
        
        timeoutIds.current.push(setTimeout(() => setLoadingMessage("Squinting at the doctor's handwriting..."), 1200));
        timeoutIds.current.push(setTimeout(() => setLoadingMessage("Teaching the AI to read cursive..."), 2400));
        timeoutIds.current.push(setTimeout(() => setLoadingMessage("Cross-referencing the medical dictionary..."), 3600));
        timeoutIds.current.push(setTimeout(() => setLoadingMessage("Checking side effects and interactions..."), 4800));
        timeoutIds.current.push(setTimeout(() => setLoadingMessage("Finalizing clinical data..."), 6000));

        const uploadedList: MedicalReport[] = [];
        let lastRes: MedicalReport | null = null;

        for (const asset of result.assets) {
          const formData = new FormData();
          const localUri = asset.uri;
          const filename = asset.fileName || localUri.split('/').pop() || 'report.jpg';
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

          const res = await reportAPI.upload(formData);
          uploadedList.push(res);
          lastRes = res;
        }

        setReports(prev => [...uploadedList, ...prev]);

        if (lastRes) {
          handleSelectReport(lastRes);
          Alert.alert('Success', 'Medical report analyzed successfully!');
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to upload report. Please try again.');
    } finally {
      setUploading(false);
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];
    }
  };

  if (uploading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center space-y-4 bg-background">
        <ActivityIndicator size="large" color="#007bff" />
        <Text className="text-gray-500 font-semibold text-center px-6 mt-4">
          {loadingMessage}
        </Text>
      </SafeAreaView>
    );
  }

 const handleSelectReport = (rep: MedicalReport) => {
 setActiveReport(rep);
 const text = rep.ocrResult?.rawText || '';
 setRawText(text);
 setReportType(rep.reportType || 'CBC');

 if (rep.values && rep.values.length > 0) {
 setReportValues(rep.values);
 setView('detail');
 } else {
 setReportValues([{ key: '', value: 0, unit: '', referenceRange: '', isAbnormal: false }]);
 setView('verify');
 }
 };

 const handleDelete = async (id: string) => {
 Alert.alert('Delete', 'Are you sure?', [
 { text: 'Cancel', style: 'cancel' },
 { text: 'Delete', style: 'destructive', onPress: async () => {
 try {
 await reportAPI.delete(id);
 setReports(prev => prev.filter(r => r.id !== id));
 if (activeReport?.id === id) setView('list');
 } catch (err) {}
 }}
 ]);
 };

 const handleVerifySubmit = async () => {
 if (!activeReport) return;
 setVerifying(true);
 try {
 const payload = { rawText, reportType, values: reportValues };
 const res = await reportAPI.verify(activeReport.id, payload);
 setReports(prev => prev.map(p => p.id === res.id ? res : p));
 setActiveReport(res);
 setView('detail');
 } catch (err: any) {
 Alert.alert('Error', err.response?.data?.message || 'Verification failed.');
 } finally {
 setVerifying(false);
 }
 };

 if (view === 'verify' && activeReport) {
 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
 <View className="px-5 py-4 border-b border-border bg-white dark:bg-slate-900 flex-row items-center justify-between ">
 <TouchableOpacity onPress={() => setView('list')}>
 <Text className="text-primary font-bold text-xs">← Back</Text>
 </TouchableOpacity>
 <Text className="text-sm font-extrabold text-foreground">Verify Lab Values</Text>
 <View className="w-10" />
 </View>
 <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1">
 <View className="bg-white dark:bg-slate-900 p-4 border border-border rounded-2xl mb-6 ">
 <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Report Type</Text>
 <TextInput value={reportType} onChangeText={setReportType} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs font-bold text-foreground" />
 
 <Text className="text-[10px] font-bold text-muted-foreground uppercase mt-4 mb-2">Raw Scanned Text</Text>
 <TextInput
 value={rawText}
 onChangeText={setRawText}
 multiline
 className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs font-mono text-foreground h-32"
 textAlignVertical="top"
 />
 </View>

 <View className="flex-row justify-between items-center mb-3">
 <Text className="text-sm font-bold text-foreground">Biomarkers Extracted</Text>
 <TouchableOpacity onPress={() => setReportValues(prev => [...prev, { key: '', value: 0, unit: '', referenceRange: '', isAbnormal: false }])}>
 <Text className="text-primary text-xs font-bold">+ Add Row</Text>
 </TouchableOpacity>
 </View>

 {reportValues.map((field, idx) => (
 <View key={idx} className="bg-white dark:bg-slate-900 p-4 border border-border rounded-2xl mb-4 relative">
 <TouchableOpacity onPress={() => setReportValues(prev => prev.filter((_, i) => i !== idx))} className="absolute top-3 right-3 p-1">
 <Trash2 size={16} color="#ef4444" />
 </TouchableOpacity>
 
 <View className="flex-row gap-3 mb-3 pr-6">
 <View className="flex-1">
 <Text className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Marker (e.g. Hb)</Text>
 <TextInput value={field.key} onChangeText={(val) => { const copy = [...reportValues]; copy[idx].key = val; setReportValues(copy); }} className="border border-border rounded-xl px-3 py-2 text-xs text-foreground" />
 </View>
 <View className="w-1/3">
 <Text className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Value</Text>
 <TextInput value={field.value.toString()} keyboardType="numeric" onChangeText={(val) => { const copy = [...reportValues]; copy[idx].value = parseFloat(val)||0; setReportValues(copy); }} className="border border-border rounded-xl px-3 py-2 text-xs text-foreground" />
 </View>
 </View>
 
 <View className="flex-row gap-3 items-end">
 <View className="flex-1">
 <Text className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Unit</Text>
 <TextInput value={field.unit} onChangeText={(val) => { const copy = [...reportValues]; copy[idx].unit = val; setReportValues(copy); }} className="border border-border rounded-xl px-3 py-2 text-xs text-foreground" />
 </View>
 <View className="flex-1">
 <Text className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Ref Range</Text>
 <TextInput value={field.referenceRange} onChangeText={(val) => { const copy = [...reportValues]; copy[idx].referenceRange = val; setReportValues(copy); }} className="border border-border rounded-xl px-3 py-2 text-xs text-foreground" />
 </View>
 </View>

 <TouchableOpacity onPress={() => { const copy = [...reportValues]; copy[idx].isAbnormal = !copy[idx].isAbnormal; setReportValues(copy); }} className="mt-3 flex-row items-center gap-2">
 <View className={`w-4 h-4 rounded border flex items-center justify-center ${field.isAbnormal ? 'bg-danger border-danger' : 'border-slate-300'}`}>
 {field.isAbnormal && <CheckCircle size={10} color="#fff" />}
 </View>
 <Text className="text-xs font-bold text-foreground">Mark as Abnormal</Text>
 </TouchableOpacity>
 </View>
 ))}

 <TouchableOpacity onPress={handleVerifySubmit} disabled={verifying} className="bg-primary rounded-xl py-3 items-center flex-row justify-center gap-2 mt-4 ">
 {verifying ? <ActivityIndicator color="#fff" size="small" /> : <Sparkles size={16} color="#fff" />}
 <Text className="text-white font-bold">{verifying ? 'Analyzing...' : 'Submit & Analyze with Pulse AI'}</Text>
 </TouchableOpacity>
 </ScrollView>
 </SafeAreaView>
 );
 }

 if (view === 'detail' && activeReport) {
 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
 <View className="px-5 py-4 border-b border-border bg-white dark:bg-slate-900 flex-row items-center justify-between ">
 <TouchableOpacity onPress={() => setView('list')}>
 <Text className="text-primary font-bold text-xs">← Back</Text>
 </TouchableOpacity>
 <Text className="text-sm font-extrabold text-foreground">Report Snapshot</Text>
 <TouchableOpacity onPress={() => setView('verify')}>
 <Text className="text-primary font-bold text-xs">Edit</Text>
 </TouchableOpacity>
 </View>
 <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1">
 {activeReport.summary && (
 <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border mb-6">
 <View className="flex-row justify-between items-center mb-3 border-b border-border pb-3">
 <Text className="text-sm font-extrabold text-foreground">{activeReport.reportType}</Text>
 <View className={`px-2 py-1 rounded-full ${activeReport.summary.overallStatus === 'STABLE' ? 'bg-success/15' : 'bg-danger/15'}`}>
 <Text className={`text-[10px] font-bold ${activeReport.summary.overallStatus === 'STABLE' ? 'text-success' : 'text-danger'}`}>{activeReport.summary.overallStatus}</Text>
 </View>
 </View>
 <Text className="text-xs text-foreground leading-relaxed mb-4">{activeReport.summary.healthSummary}</Text>
 <View className="flex-row gap-3">
 <View className="flex-1 bg-success/10 border border-success/20 p-3 rounded-xl">
 <Text className="text-[10px] text-success font-bold uppercase mb-1">Normal</Text>
 <Text className="text-xl font-black text-success">{activeReport.summary.normalFindingsCount}</Text>
 </View>
 <View className="flex-1 bg-danger/10 border border-danger/20 p-3 rounded-xl">
 <Text className="text-[10px] text-danger font-bold uppercase mb-1">Abnormal</Text>
 <Text className="text-xl font-black text-danger">{activeReport.summary.abnormalFindingsCount}</Text>
 </View>
 </View>
 </View>
 )}

 <Text className="text-sm font-bold text-foreground mb-3">Parameter Index</Text>
 <View className="flex-row flex-wrap justify-between">
 {activeReport.values?.map((val: any, idx: number) => (
 <View key={idx} className={`w-[48%] p-3 mb-3 border rounded-2xl ${val.isAbnormal ? 'border-rose-300 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/20' : 'border-emerald-300 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20'}`}>
 <Text className={`text-xs font-bold mb-1 ${val.isAbnormal ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{val.key}</Text>
 <View className="flex-row items-baseline gap-1">
 <Text className={`text-lg font-black ${val.isAbnormal ? 'text-rose-600 dark:text-rose-500' : 'text-emerald-600 dark:text-emerald-500'}`}>{val.value}</Text>
 <Text className={`text-[9px] ${val.isAbnormal ? 'text-rose-500/80 dark:text-rose-400/80' : 'text-emerald-500/80 dark:text-emerald-400/80'}`}>{val.unit}</Text>
 </View>
 <Text className={`text-[9px] mt-1 font-semibold ${val.isAbnormal ? 'text-rose-600/70 dark:text-rose-400/70' : 'text-emerald-600/70 dark:text-emerald-400/70'}`}>Ref: {val.referenceRange}</Text>
 </View>
 ))}
 </View>

 {activeReport.specialists && activeReport.specialists.length > 0 && (
    <View className="mt-6 mb-6">
      <Text className="text-sm font-bold text-foreground mb-3">Specialist Referrals</Text>
      {activeReport.specialists.map((spec: any, i: number) => {
        const clinics = matchedHospitals[spec.specialtyName] || [];
        return (
          <View key={i} className="p-4 bg-primary/10 border border-primary/20 rounded-2xl mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-bold text-primary">{spec.specialtyName}</Text>
              <Text className="text-[10px] text-primary/80 font-bold">{Math.round(spec.confidenceScore * 100)}% Conf.</Text>
            </View>
            <Text className="text-[11px] text-foreground font-light leading-relaxed mb-4">{spec.reason}</Text>

            {/* Nearest matched clinics */}
            <View className="border-t border-primary/10 pt-3">
              <Text className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Closest Specialized Clinics</Text>
              {loadingClinics ? (
                <ActivityIndicator size="small" color="#2563EB" className="my-2 self-start" />
              ) : clinics.length === 0 ? (
                <Text className="text-[11px] text-slate-400 font-semibold">No clinics found matching this specialty nearby.</Text>
              ) : (
                <View className="gap-2.5">
                  {clinics.map((clinic) => (
                    <TouchableOpacity
                      key={clinic.id}
                      onPress={() => {
                        setView('list');
                        navigation.navigate('HospitalDetail', { id: clinic.id });
                      }}
                      className="bg-white dark:bg-slate-900 border border-border p-2.5 rounded-xl flex-row justify-between items-center"
                    >
                      <View className="flex-1 pr-2">
                        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200" numberOfLines={1}>{clinic.name}</Text>
                        <Text className="text-[10px] text-slate-500" numberOfLines={1}>{clinic.address}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-[10px] font-bold text-primary">{clinic.distance?.toFixed(1) || '0.0'} km</Text>
                        <View className="flex-row items-center gap-0.5 mt-0.5">
                          <Star size={9} color="#f59e0b" fill="#f59e0b" />
                          <Text className="text-[9px] font-bold text-slate-600 dark:text-slate-400">{clinic.rating?.toFixed(1)}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
 )}
 </ScrollView>
 </SafeAreaView>
 );
 }

 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
 <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1">
 
 <View className="mb-6">
 <View className="flex-row items-center gap-2 mb-1">
 <FileText size={24} color="#2563EB" />
 <Text className="text-2xl font-extrabold text-foreground">Lab Reports</Text>
 </View>
 <Text className="text-xs text-muted-foreground">Scan panels, verify data, and get AI insights.</Text>
 </View>

 {/* Upload Button */}
 <TouchableOpacity 
 onPress={handleImagePick}
 disabled={uploading}
 className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl p-6 items-center justify-center mb-8"
 >
 <UploadCloud size={32} color="#2563EB" className="mb-2" />
 <Text className="text-xs font-bold text-primary">Upload Medical Report</Text>
 <Text className="text-[10px] text-muted-foreground mt-1">PNG, JPG (Up to 5MB)</Text>
 </TouchableOpacity>

 <Text className="text-sm font-bold text-foreground mb-3">Analysis History</Text>
 {loading ? (
 <ActivityIndicator size="large" color="#2563EB" />
 ) : reports.length === 0 ? (
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 items-center">
 <Text className="text-xs text-muted-foreground">No reports analyzed yet.</Text>
 </View>
 ) : (
 <View className="space-y-3">
 {reports.map(rep => (
 <TouchableOpacity key={rep.id} onPress={() => handleSelectReport(rep)} className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-4 flex-row justify-between items-center ">
 <View className="flex-row items-center gap-3 flex-1">
 <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center">
 <Activity size={16} color="#2563EB" />
 </View>
 <View className="flex-1 pr-2">
 <Text className="font-bold text-xs text-foreground" numberOfLines={1}>
 {rep.status === 'ANALYZED' || rep.reportType !== 'GENERAL'
 ? `${rep.reportType === 'GENERAL' ? 'Medical' : rep.reportType} Report`
 : `Scan #${rep.id.slice(0, 8)}`}
 </Text>
 <Text className="text-[10px] text-muted-foreground mt-0.5">{new Date(rep.createdAt).toLocaleDateString()}</Text>
 </View>
 </View>
 <TouchableOpacity onPress={() => handleDelete(rep.id)} className="p-2">
 <Trash2 size={16} color="#ef4444" />
 </TouchableOpacity>
 </TouchableOpacity>
 ))}
 </View>
 )}
 </ScrollView>
 </SafeAreaView>
 );
};

export default ReportCenterScreen;



