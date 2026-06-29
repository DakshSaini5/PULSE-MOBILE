import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { trendAPI, HealthTrend, HealthInsight } from '../services/api';
import { TrendingUp, Activity, Calendar, Award, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';

export const HealthTrendsScreen = () => {
 const { user } = useAuth();
 const navigation = useNavigation<any>();

 const [trends, setTrends] = useState<HealthTrend[]>([]);
 const [insights, setInsights] = useState<HealthInsight[]>([]);
 const [loading, setLoading] = useState(true);
 const [activeMarker, setActiveMarker] = useState('Hemoglobin');
 const [assessingRisk, setAssessingRisk] = useState(false);
 const [riskResult, setRiskResult] = useState<{ score: number, summary: string, biomarkersAnalyzed: number } | null>(null);

 const fetchTrends = async () => {
 if (!user) return;
 setLoading(true);
 try {
 const [trendData, insightData] = await Promise.all([
 trendAPI.getTrends(),
 trendAPI.getInsights()
 ]);
 setTrends(trendData);
 setInsights(insightData);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchTrends();
 }, []);

 const knownMarkerInfo: Record<string, { desc: string, ref: string }> = {
 'Hemoglobin': { desc: 'Carries oxygen throughout red blood cells.', ref: '12.0 - 15.0' },
 'HbA1c': { desc: 'Averages your blood glucose level over 3 months.', ref: '4.0 - 5.6' },
 'TSH': { desc: 'Indicates active metabolic and thyroid rates.', ref: '0.4 - 4.5' },
 'Cholesterol': { desc: 'Monitors cardiovascular plaque and fat profiles.', ref: '120 - 200' }
 };

 const uniqueMarkersMap = new Map<string, { name: string, unit: string, desc: string, ref: string }>();
 trends.forEach(t => {
 if (!uniqueMarkersMap.has(t.markerName)) {
 const known = knownMarkerInfo[t.markerName] || { desc: 'Biological marker extracted from your medical reports.', ref: 'See reports for reference' };
 uniqueMarkersMap.set(t.markerName, {
 name: t.markerName,
 unit: t.unit || 'units',
 desc: known.desc,
 ref: known.ref
 });
 }
 });

 const markers = Array.from(uniqueMarkersMap.values());

 useEffect(() => {
 if (markers.length > 0 && !markers.some(m => m.name === activeMarker)) {
 setActiveMarker(markers[0].name);
 }
 }, [markers, activeMarker]);

 const filteredData = trends
 .filter(t => t.markerName === activeMarker)
 .reverse();

 const activeMarkerInfo = markers.find(m => m.name === activeMarker);

 const handleAssessRisk = async () => {
 setAssessingRisk(true);
 try {
 const { reportAPI } = await import('../services/api');
 const res = await reportAPI.getRiskAssessment();
 setRiskResult(res);
 } catch (err) {
 Alert.alert('Error', 'Failed to calculate health risk score.');
 } finally {
 setAssessingRisk(false);
 }
 };

 const screenWidth = Dimensions.get('window').width;

 const chartData = {
 labels: filteredData.map(d => new Date(d.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })),
 datasets: [
 {
 data: filteredData.length > 0 ? filteredData.map(d => d.value) : [0],
 color: (opacity = 1) => `rgba(225, 29, 72, ${opacity})`,
 strokeWidth: 3
 }
 ]
 };

 return (
 <SafeAreaView className="flex-1 bg-background">
 <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1">
 
 <View className="mb-6">
 <View className="flex-row items-center gap-2 mb-1">
 <TrendingUp size={24} color="#2563EB" />
 <Text className="text-2xl font-extrabold text-foreground">Health Trends</Text>
 </View>
 <Text className="text-xs text-muted-foreground">Track and monitor important clinical indexes over time.</Text>
 </View>

 {/* Marker Selection Horizontal Scroll */}
 <View className="mb-6">
 <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Select Marker</Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={false}>
 {markers.length === 0 ? (
 <Text className="text-xs text-muted-foreground py-2">No markers found. Scan reports first.</Text>
 ) : (
 markers.map((marker) => {
 const isActive = marker.name === activeMarker;
 return (
 <TouchableOpacity
 key={marker.name}
 onPress={() => setActiveMarker(marker.name)}
 className={`px-4 py-2.5 rounded-xl border mr-3 min-w-[120px] ${
 isActive ? 'bg-primary border-primary' : 'bg-slate-50 dark:bg-slate-900 border-border'
 }`}
 >
 <Text className={`font-bold ${isActive ? 'text-white' : 'text-foreground'}`}>{marker.name}</Text>
 <Text className={`text-[10px] mt-0.5 ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>{marker.unit}</Text>
 </TouchableOpacity>
 );
 })
 )}
 </ScrollView>
 </View>

 {/* Chart View */}
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-5 mb-6 ">
 <Text className="text-sm font-bold text-foreground mb-4">{activeMarker} Progression</Text>
 
 {loading ? (
 <ActivityIndicator size="large" color="#2563EB" className="py-10" />
 ) : filteredData.length === 0 ? (
 <View className="py-10 items-center">
 <Activity size={32} color="#94a3b8" className="mb-2" />
 <Text className="text-xs text-muted-foreground text-center">No uploads tracking this marker.</Text>
 </View>
 ) : (
 <View className="-ml-4 mt-2">
 <LineChart
 data={chartData}
 width={screenWidth - 40} // from padding
 height={220}
 yAxisSuffix=""
 yAxisLabel=""
 chartConfig={{
 backgroundColor: 'transparent',
 backgroundGradientFrom: '#ffffff',
 backgroundGradientTo: '#ffffff',
 decimalPlaces: 1,
 color: (opacity = 1) => `rgba(225, 29, 72, ${opacity})`,
 labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
 style: { borderRadius: 16 },
 propsForDots: { r: '4', strokeWidth: '2', stroke: '#2563EB' }
 }}
 bezier
 style={{ borderRadius: 16 }}
 />
 </View>
 )}

 {activeMarkerInfo && (
 <View className="mt-4 pt-4 border-t border-border">
 <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Standard Healthy Range</Text>
 <Text className="text-sm font-extrabold text-primary">{activeMarkerInfo.ref} {activeMarkerInfo.unit}</Text>
 <Text className="text-[10px] text-muted-foreground mt-2 leading-relaxed">{activeMarkerInfo.desc}</Text>
 </View>
 )}
 </View>

 {/* AI Risk Assessment */}
 <View className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
 <Text className="text-sm font-bold text-foreground flex-row items-center gap-2 mb-2">AI Health Risk Score</Text>
 <Text className="text-[10px] text-muted-foreground mb-4">Calculate an overall risk score from 0-100 based on your latest medical markers.</Text>
 
 {riskResult ? (
 <View className={`p-4 rounded-xl border ${riskResult.score < 60 ? 'bg-danger/10 border-danger/20' : riskResult.score < 80 ? 'bg-warning/10 border-warning/20' : 'bg-success/10 border-success/20'}`}>
 <View className="flex-row justify-between items-center mb-2">
 <Text className={`text-xs font-bold ${riskResult.score < 60 ? 'text-danger' : riskResult.score < 80 ? 'text-warning' : 'text-success'}`}>Health Score</Text>
 <Text className={`text-xl font-black ${riskResult.score < 60 ? 'text-danger' : riskResult.score < 80 ? 'text-warning' : 'text-success'}`}>{riskResult.score} / 100</Text>
 </View>
 <Text className="text-[10px] leading-relaxed text-slate-700 dark:text-slate-300">{riskResult.summary}</Text>
 <TouchableOpacity onPress={() => setRiskResult(null)} className="mt-3">
 <Text className="text-[10px] underline text-muted-foreground">Reset</Text>
 </TouchableOpacity>
 </View>
 ) : (
 <TouchableOpacity
 onPress={handleAssessRisk}
 disabled={assessingRisk || trends.length === 0}
 className={`w-full py-3 rounded-xl flex-row justify-center items-center gap-2 ${assessingRisk || trends.length === 0 ? 'bg-slate-300 dark:bg-slate-700' : 'bg-primary'}`}
 >
 {assessingRisk ? <ActivityIndicator size="small" color="#fff" /> : <Award size={14} color="#fff" />}
 <Text className="text-white text-xs font-bold">{assessingRisk ? 'Analyzing...' : 'Calculate Risk Score'}</Text>
 </TouchableOpacity>
 )}
 </View>

 {/* AI Habits */}
 <View className="mb-6">
 <Text className="text-sm font-bold text-foreground mb-3">Automated Daily Habits</Text>
 {insights.length === 0 ? (
 <View className="p-5 border border-border rounded-2xl bg-white dark:bg-slate-900 items-center">
 <Text className="text-xs text-muted-foreground text-center">No habits generated. Upload a report for AI to suggest some.</Text>
 </View>
 ) : (
 <View className="space-y-3">
 {insights.map((insight, i) => (
 <View key={insight.id || i} className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex-row gap-3">
 <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
 <Activity size={14} color="#2563EB" />
 </View>
 <View className="flex-1">
 <Text className="text-xs font-bold text-foreground">{insight.title}</Text>
 <Text className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{insight.description}</Text>
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

export default HealthTrendsScreen;
