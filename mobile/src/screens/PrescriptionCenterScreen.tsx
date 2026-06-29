import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { prescriptionAPI, Prescription } from '../services/api';
import { ClipboardList, UploadCloud, Trash2, Plus, FileText, Sparkles, Activity, ShieldCheck, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

export const PrescriptionCenterScreen = () => {
 const { user } = useAuth();
 const navigation = useNavigation<any>();

 const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
 const [loading, setLoading] = useState(true);
 const [uploading, setUploading] = useState(false);
 
 // Views: 'list' | 'detail' | 'verify'
 const [view, setView] = useState<'list' | 'detail' | 'verify'>('list');
 const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
 
 const [rawText, setRawText] = useState('');
 const [medicineFields, setMedicineFields] = useState<Array<{ name: string; dosage: string; instructions: string }>>([]);
 const [verifying, setVerifying] = useState(false);
 
 const [checkingInteractions, setCheckingInteractions] = useState(false);
 const [interactionResult, setInteractionResult] = useState<{ interactions: string, severity: string, checked: number } | null>(null);

 const fetchPrescriptions = async () => {
 if (!user) return;
 setLoading(true);
 try {
 const data = await prescriptionAPI.getAll();
 setPrescriptions(data);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchPrescriptions();
 }, []);

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera roll permissions to upload prescriptions.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        const uploadedList: Prescription[] = [];
        let lastRes: Prescription | null = null;

        for (const asset of result.assets) {
          const file = {
            uri: asset.uri,
            name: asset.fileName || 'prescription.jpg',
            type: asset.mimeType || 'image/jpeg',
          } as any;

          const res = await prescriptionAPI.upload(file);
          uploadedList.push(res);
          lastRes = res;
        }

        setPrescriptions(prev => [...uploadedList, ...prev]);

        if (lastRes) {
          handleSelectPrescription(lastRes);
          Alert.alert('Success', 'Prescription analyzed successfully!');
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

 const handleSelectPrescription = (pres: Prescription) => {
 setActivePrescription(pres);
 const text = pres.ocrResult?.rawText || '';
 setRawText(text);

 if (pres.prescriptionAnalysis && pres.prescriptionAnalysis.length > 0) {
 setMedicineFields(pres.prescriptionAnalysis.map(med => ({
 name: med.medicineName,
 dosage: med.dosage,
 instructions: med.instructions
 })));
 setView('detail');
 } else {
 setMedicineFields([{ name: '', dosage: '', instructions: '' }]); // basic parser fallback
 setView('verify');
 }
 };

 const handleDelete = async (id: string) => {
 Alert.alert('Delete', 'Are you sure?', [
 { text: 'Cancel', style: 'cancel' },
 { text: 'Delete', style: 'destructive', onPress: async () => {
 try {
 await prescriptionAPI.delete(id);
 setPrescriptions(prev => prev.filter(p => p.id !== id));
 if (activePrescription?.id === id) setView('list');
 } catch (err) {}
 }}
 ]);
 };

 const handleVerifySubmit = async () => {
 if (!activePrescription) return;
 setVerifying(true);
 try {
 const payload = { rawText, medicines: medicineFields };
 const res = await prescriptionAPI.verify(activePrescription.id, payload);
 setPrescriptions(prev => prev.map(p => p.id === res.id ? res : p));
 setActivePrescription(res);
 setView('detail');
 } catch (err: any) {
 Alert.alert('Error', err.response?.data?.message || 'Verification failed.');
 } finally {
 setVerifying(false);
 }
 };

 const handleCheckInteractions = async () => {
 setCheckingInteractions(true);
 try {
 const res = await prescriptionAPI.checkInteractions();
 setInteractionResult({ interactions: res.interactions, severity: res.severity, checked: res.medicinesChecked });
 } catch (err) {
 Alert.alert('Error', 'Failed to check interactions.');
 } finally {
 setCheckingInteractions(false);
 }
 };

 if (view === 'verify' && activePrescription) {
 return (
 <SafeAreaView className="flex-1 bg-background">
 <View className="px-5 py-4 border-b border-border bg-white dark:bg-slate-900 flex-row items-center justify-between ">
 <TouchableOpacity onPress={() => setView('list')}>
 <Text className="text-primary font-bold text-xs">← Back</Text>
 </TouchableOpacity>
 <Text className="text-sm font-extrabold text-foreground">Verify Prescription</Text>
 <View className="w-10" />
 </View>
 <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1">
 <View className="bg-white dark:bg-slate-900 p-4 border border-border rounded-2xl mb-6 ">
 <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Raw OCR Text</Text>
 <TextInput
 value={rawText}
 onChangeText={setRawText}
 multiline
 className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs font-mono text-foreground h-32"
 textAlignVertical="top"
 />
 </View>

 <View className="flex-row justify-between items-center mb-3">
 <Text className="text-sm font-bold text-foreground">Medicines Extracted</Text>
 <TouchableOpacity onPress={() => setMedicineFields(prev => [...prev, { name: '', dosage: '', instructions: '' }])}>
 <Text className="text-primary text-xs font-bold">+ Add Row</Text>
 </TouchableOpacity>
 </View>

 {medicineFields.map((field, idx) => (
 <View key={idx} className="bg-white dark:bg-slate-900 p-4 border border-border rounded-2xl mb-4 relative">
 <TouchableOpacity onPress={() => setMedicineFields(prev => prev.filter((_, i) => i !== idx))} className="absolute top-3 right-3 p-1">
 <Trash2 size={16} color="#ef4444" />
 </TouchableOpacity>
 
 <Text className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Medicine Name</Text>
 <TextInput value={field.name} onChangeText={(val) => { const copy = [...medicineFields]; copy[idx].name = val; setMedicineFields(copy); }} className="border border-border rounded-xl px-3 py-2 text-xs text-foreground mb-3" />
 
 <View className="flex-row gap-3">
 <View className="flex-1">
 <Text className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Dosage</Text>
 <TextInput value={field.dosage} onChangeText={(val) => { const copy = [...medicineFields]; copy[idx].dosage = val; setMedicineFields(copy); }} className="border border-border rounded-xl px-3 py-2 text-xs text-foreground" />
 </View>
 <View className="flex-1">
 <Text className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Frequency</Text>
 <TextInput value={field.instructions} onChangeText={(val) => { const copy = [...medicineFields]; copy[idx].instructions = val; setMedicineFields(copy); }} className="border border-border rounded-xl px-3 py-2 text-xs text-foreground" />
 </View>
 </View>
 </View>
 ))}

 <TouchableOpacity onPress={handleVerifySubmit} disabled={verifying} className="bg-primary rounded-xl py-3 items-center flex-row justify-center gap-2 mt-4 ">
 {verifying ? <ActivityIndicator color="#fff" size="small" /> : <Sparkles size={16} color="#fff" />}
 <Text className="text-white font-bold">{verifying ? 'Analyzing...' : 'Analyze with Pulse AI'}</Text>
 </TouchableOpacity>
 </ScrollView>
 </SafeAreaView>
 );
 }

 if (view === 'detail' && activePrescription) {
 return (
 <SafeAreaView className="flex-1 bg-background">
 <View className="px-5 py-4 border-b border-border bg-white dark:bg-slate-900 flex-row items-center justify-between ">
 <TouchableOpacity onPress={() => setView('list')}>
 <Text className="text-primary font-bold text-xs">← Back to List</Text>
 </TouchableOpacity>
 <Text className="text-sm font-extrabold text-foreground">Analysis Results</Text>
 <TouchableOpacity onPress={() => setView('verify')}>
 <Text className="text-primary font-bold text-xs">Edit</Text>
 </TouchableOpacity>
 </View>
 <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1">
 {activePrescription.prescriptionAnalysis.length === 0 ? (
 <View className="p-8 text-center bg-white dark:bg-slate-900 border border-border rounded-2xl items-center">
 <Text className="text-sm font-bold mt-2">No Medicines Extracted</Text>
 <Text className="text-xs text-muted-foreground text-center mt-2">Tap Edit to manually add them.</Text>
 </View>
 ) : (
 <View className="space-y-4">
 {activePrescription.prescriptionAnalysis.map((med, index) => (
 <View key={index} className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-5 ">
 <View className="flex-row justify-between items-start mb-2">
 <Text className="font-extrabold text-sm text-foreground flex-1">{med.medicineName}</Text>
 <View className="bg-primary/10 px-2 py-1 rounded">
 <Text className="text-[10px] text-primary font-bold">{med.dosage}</Text>
 </View>
 </View>
 
 <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-2">Instructions</Text>
 <Text className="text-xs text-foreground mt-0.5">{med.instructions}</Text>
 
 <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-3">Simplified AI Definition</Text>
 <Text className="text-[11px] text-foreground font-light mt-0.5">{med.simplifiedExplanation}</Text>

 <View className="mt-4 space-y-2">
 <View className="bg-warning/10 border border-warning/20 p-2 rounded-lg">
 <Text className="text-[10px] text-warning font-bold mb-0.5">⚠️ Side Effects</Text>
 <Text className="text-[10px] text-warning/90">{med.sideEffects}</Text>
 </View>
 <View className="bg-danger/10 border border-danger/20 p-2 rounded-lg">
 <Text className="text-[10px] text-danger font-bold mb-0.5">🚫 Interactions</Text>
 <Text className="text-[10px] text-danger/90">{med.drugInteractions}</Text>
 </View>
 </View>
 </View>
 ))}
 </View>
 )}
 </ScrollView>
 </SafeAreaView>
 );
 }

 // DEFAULT LIST VIEW
 return (
 <SafeAreaView className="flex-1 bg-background">
 <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1">
 
 <View className="mb-6">
 <View className="flex-row items-center gap-2 mb-1">
 <ClipboardList size={24} color="#2563EB" />
 <Text className="text-2xl font-extrabold text-foreground">Prescriptions</Text>
 </View>
 <Text className="text-xs text-muted-foreground">Scan, decode, and check drug interactions.</Text>
 </View>

 {/* Upload Button */}
 <TouchableOpacity 
 onPress={handleImagePick}
 disabled={uploading}
 className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl p-6 items-center justify-center mb-6"
 >
 {uploading ? (
 <ActivityIndicator size="large" color="#2563EB" />
 ) : (
 <>
 <UploadCloud size={32} color="#2563EB" className="mb-2" />
 <Text className="text-xs font-bold text-primary">Scan New Prescription</Text>
 <Text className="text-[10px] text-muted-foreground mt-1">Images accepted</Text>
 </>
 )}
 </TouchableOpacity>

 {/* Interaction Checker */}
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-5 mb-6 ">
 <View className="flex-row items-center gap-2 mb-2">
 <Activity size={16} color="#2563EB" />
 <Text className="text-sm font-bold text-foreground">Global Interaction Check</Text>
 </View>
 <Text className="text-[10px] text-muted-foreground mb-4">Cross-reference all active meds across all scans.</Text>
 
 {interactionResult ? (
 <View className={`p-4 rounded-xl border ${interactionResult.severity === 'HIGH' ? 'bg-danger/10 border-danger/20' : interactionResult.severity === 'MODERATE' ? 'bg-warning/10 border-warning/20' : 'bg-success/10 border-success/20'}`}>
 <Text className="text-xs font-bold mb-1">Severity: {interactionResult.severity}</Text>
 <Text className="text-[10px] leading-relaxed mb-2">{interactionResult.interactions}</Text>
 <TouchableOpacity onPress={() => setInteractionResult(null)}>
 <Text className="text-[10px] underline">Reset</Text>
 </TouchableOpacity>
 </View>
 ) : (
 <TouchableOpacity onPress={handleCheckInteractions} disabled={checkingInteractions || prescriptions.length === 0} className="bg-slate-900 dark:bg-white rounded-xl py-3 items-center flex-row justify-center gap-2">
 {checkingInteractions ? <ActivityIndicator size="small" color="#fff" /> : <ShieldCheck size={14} color="#fff" />}
 <Text className="text-white dark:text-slate-900 text-xs font-bold">{checkingInteractions ? 'Checking...' : 'Run Safety Scan'}</Text>
 </TouchableOpacity>
 )}
 </View>

 <Text className="text-sm font-bold text-foreground mb-3">Scanned History</Text>
 {loading ? (
 <ActivityIndicator size="large" color="#2563EB" />
 ) : prescriptions.length === 0 ? (
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 items-center">
 <Text className="text-xs text-muted-foreground">No prescriptions scanned yet.</Text>
 </View>
 ) : (
 <View className="space-y-3">
 {prescriptions.map(pres => (
 <TouchableOpacity key={pres.id} onPress={() => handleSelectPrescription(pres)} className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-4 flex-row justify-between items-center ">
 <View className="flex-row items-center gap-3 flex-1">
 <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center">
 <FileText size={16} color="#2563EB" />
 </View>
 <View className="flex-1 pr-2">
 <Text className="font-bold text-xs text-foreground" numberOfLines={1}>
 {pres.prescriptionAnalysis && pres.prescriptionAnalysis.length > 0 
 ? pres.prescriptionAnalysis.map(m => m.medicineName).join(', ')
 : `Scan #${pres.id.slice(0, 8)}`}
 </Text>
 <Text className="text-[10px] text-muted-foreground mt-0.5">{new Date(pres.createdAt).toLocaleDateString()}</Text>
 </View>
 </View>
 <TouchableOpacity onPress={() => handleDelete(pres.id)} className="p-2">
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

export default PrescriptionCenterScreen;
