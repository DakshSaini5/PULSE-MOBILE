import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { trendAPI, HealthTrend, HealthInsight } from '../services/api';
import { Activity, Award } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { LineChart } from 'react-native-chart-kit';
import BaseLayout from '../components/BaseLayout';
import CustomHeader from '../components/CustomHeader';

export default function HealthTrendsScreen() {
  const { user } = useAuth();

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
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

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
    labels: filteredData.length > 0 ? filteredData.map(d => new Date(d.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })) : ['No Data'],
    datasets: [
      {
        data: filteredData.length > 0 ? filteredData.map(d => d.value) : [0],
        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // Match blue-600 aesthetic
        strokeWidth: 3
      }
    ]
  };

  return (
    <BaseLayout>
      <CustomHeader title="Health Trends" />
      <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Intro */}
        <View className="mb-6">
          <Text className="text-sm text-slate-500">Track and monitor clinical indexes generated directly from your uploaded reports.</Text>
        </View>

        {/* Marker Selection Horizontal Scroll */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Marker</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
            {markers.length === 0 ? (
              <Text className="text-sm text-slate-500 py-2">No markers found. Upload a report first.</Text>
            ) : (
              markers.map((marker) => {
                const isActive = marker.name === activeMarker;
                return (
                  <TouchableOpacity
                    key={marker.name}
                    onPress={() => setActiveMarker(marker.name)}
                    className={`px-5 py-3 rounded-2xl mr-3 min-w-[120px] ${
                      isActive ? 'bg-blue-600 border border-blue-600 shadow-sm shadow-blue-600/30' : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <Text className={`font-bold ${isActive ? 'text-white' : 'text-slate-700'}`}>{marker.name}</Text>
                    <Text className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>{marker.unit}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Chart View */}
        <View className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mb-6">
          <Text className="text-base font-bold text-slate-900 mb-4">{activeMarker} Progression</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" className="py-10" />
          ) : filteredData.length === 0 ? (
            <View className="py-10 items-center">
              <Activity size={32} color="#94A3B8" className="mb-2" />
              <Text className="text-sm text-slate-500 text-center">No uploads tracking this marker.</Text>
            </View>
          ) : (
            <View className="-ml-4 mt-2 overflow-hidden rounded-2xl">
              <LineChart
                data={chartData}
                width={screenWidth - 40} // from padding
                height={220}
                yAxisSuffix=""
                yAxisLabel=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: '5', strokeWidth: '2', stroke: '#ffffff' }
                }}
                bezier
                style={{ borderRadius: 16 }}
              />
            </View>
          )}

          {activeMarkerInfo && (
            <View className="mt-6 pt-4 border-t border-slate-100">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Standard Healthy Range</Text>
              <Text className="text-sm font-extrabold text-blue-600">{activeMarkerInfo.ref} {activeMarkerInfo.unit}</Text>
              <Text className="text-xs text-slate-500 mt-2 leading-relaxed">{activeMarkerInfo.desc}</Text>
            </View>
          )}
        </View>

        {/* AI Risk Assessment */}
        <View className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 mb-6">
          <Text className="text-base font-bold text-slate-900 mb-2">AI Health Risk Score</Text>
          <Text className="text-sm text-slate-500 mb-4">Calculate an overall risk score from 0-100 based on your latest medical markers.</Text>
          
          {riskResult ? (
            <View className={`p-5 rounded-2xl border ${riskResult.score < 60 ? 'bg-red-50 border-red-200' : riskResult.score < 80 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <View className="flex-row justify-between items-center mb-3">
                <Text className={`text-sm font-bold ${riskResult.score < 60 ? 'text-red-600' : riskResult.score < 80 ? 'text-yellow-600' : 'text-green-600'}`}>Health Score</Text>
                <Text className={`text-2xl font-black ${riskResult.score < 60 ? 'text-red-600' : riskResult.score < 80 ? 'text-yellow-600' : 'text-green-600'}`}>{riskResult.score} / 100</Text>
              </View>
              <Text className="text-xs leading-relaxed text-slate-700">{riskResult.summary}</Text>
              <TouchableOpacity onPress={() => setRiskResult(null)} className="mt-4 self-start">
                <Text className="text-xs font-medium text-slate-500">Reset</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleAssessRisk}
              disabled={assessingRisk || trends.length === 0}
              className={`w-full py-3.5 rounded-2xl flex-row justify-center items-center gap-2 ${assessingRisk || trends.length === 0 ? 'bg-slate-200' : 'bg-blue-600 shadow-sm shadow-blue-600/30'}`}
            >
              {assessingRisk ? <ActivityIndicator size="small" color="#fff" /> : <Award size={16} color="#fff" />}
              <Text className="text-white text-sm font-bold">{assessingRisk ? 'Analyzing...' : 'Calculate Risk Score'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* AI Habits */}
        <View className="mb-24">
          <Text className="text-base font-bold text-slate-900 mb-3">Automated Daily Habits</Text>
          {insights.length === 0 ? (
            <View className="p-6 border border-slate-100 rounded-3xl bg-white shadow-sm items-center">
              <Text className="text-sm text-slate-500 text-center">No habits generated. Upload a report for AI to suggest some.</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {insights.map((insight, i) => (
                <View key={insight.id || i} className="p-4 bg-white shadow-sm border border-slate-100 rounded-2xl flex-row gap-4 mb-3">
                  <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                    <Activity size={18} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">{insight.title}</Text>
                    <Text className="text-xs text-slate-500 mt-1 leading-relaxed">{insight.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </BaseLayout>
  );
}
