import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Database, FileText, ArrowLeft, Trash2, ShieldCheck, Activity } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { adminAPI } from '../services/api';

export const AdminDashboardScreen = () => {
 const { user } = useAuth();
 const navigation = useNavigation<any>();

 const [stats, setStats] = useState<any>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 // Only fetch if admin
 if (user?.role !== 'ADMIN') {
 Alert.alert('Unauthorized', 'You do not have permission to view this page.');
 navigation.goBack();
 return;
 }

 const fetchStats = async () => {
 try {
 const data = await adminAPI.getStats();
 setStats(data);
 } catch (err) {
 Alert.alert('Error', 'Failed to load admin stats');
 } finally {
 setLoading(false);
 }
 };
 fetchStats();
 }, [user]);

 if (loading || !stats) {
 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background justify-center items-center">
 <ActivityIndicator size="large" color="#1E60D5" />
 </SafeAreaView>
 );
 }

 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
 <View className="px-5 py-4 border-b border-border bg-white dark:bg-slate-900 flex-row items-center ">
 <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
 <ArrowLeft size={20} color="#64748b" />
 </TouchableOpacity>
 <Text className="text-lg font-extrabold text-foreground">Admin Dashboard</Text>
 </View>
 
 <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
 
 <View className="mb-6 bg-primary/10 border border-primary/20 rounded-2xl p-5 items-center">
 <ShieldCheck size={32} color="#1E60D5" className="mb-2" />
 <Text className="text-sm font-extrabold text-primary uppercase tracking-wider">System Overview</Text>
 <Text className="text-xs text-primary/80 mt-1">Pulse Healthcare System Telemetry</Text>
 </View>

 <View className="flex-row flex-wrap justify-between">
 <View className="w-[48%] bg-white dark:bg-slate-900 border border-border rounded-2xl p-4 mb-4">
 <Users size={20} color="#3b82f6" className="mb-2" />
 <Text className="text-2xl font-black text-foreground">{stats.totalUsers}</Text>
 <Text className="text-[10px] font-bold text-muted-foreground uppercase">Total Users</Text>
 </View>
 
 <View className="w-[48%] bg-white dark:bg-slate-900 border border-border rounded-2xl p-4 mb-4">
 <FileText size={20} color="#8b5cf6" className="mb-2" />
 <Text className="text-2xl font-black text-foreground">{stats.totalPrescriptions}</Text>
 <Text className="text-[10px] font-bold text-muted-foreground uppercase">Rx Scans</Text>
 </View>
 
 <View className="w-[48%] bg-white dark:bg-slate-900 border border-border rounded-2xl p-4 mb-4">
 <Activity size={20} color="#10b981" className="mb-2" />
 <Text className="text-2xl font-black text-foreground">{stats.totalReports}</Text>
 <Text className="text-[10px] font-bold text-muted-foreground uppercase">Lab Reports</Text>
 </View>

 <View className="w-[48%] bg-white dark:bg-slate-900 border border-border rounded-2xl p-4 mb-4">
 <Database size={20} color="#f59e0b" className="mb-2" />
 <Text className="text-2xl font-black text-foreground">{stats.totalHospitals || 0}</Text>
 <Text className="text-[10px] font-bold text-muted-foreground uppercase">Hospitals</Text>
 </View>
 </View>

 <View className="mt-4 p-5 bg-danger/5 border border-danger/20 rounded-2xl">
 <Text className="text-sm font-extrabold text-danger mb-2 flex-row items-center"><ShieldAlert size={16} color="#ef4444" /> Quick Actions</Text>
 <TouchableOpacity className="bg-white dark:bg-slate-900 py-3 rounded-xl border border-danger/30 items-center">
 <Text className="text-xs font-bold text-danger">Purge Orphaned Documents</Text>
 </TouchableOpacity>
 </View>

 </ScrollView>
 </SafeAreaView>
 );
};

export default AdminDashboardScreen;



