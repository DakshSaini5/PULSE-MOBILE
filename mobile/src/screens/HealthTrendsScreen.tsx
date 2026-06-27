import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { Activity, TrendingUp, ChevronDown, CheckCircle2, AlertTriangle, Info } from 'lucide-react-native';
import { reportAPI, MedicalReport } from '../services/api';
import { LineChart, BarChart } from 'react-native-chart-kit';

interface TrendDataPoint {
  value: number;
  date: Date;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
}

export const HealthTrendsScreen = () => {
  const [selectedMarker, setSelectedMarker] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groupedData, setGroupedData] = useState<Record<string, TrendDataPoint[]>>({});
  const [biomarkers, setBiomarkers] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fail fast after 3 seconds if the backend is down
        const response = await Promise.race([
          reportAPI.getAll(1, 50),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Backend Timeout')), 3000))
        ]) as any;
        
        const reports: MedicalReport[] = response.data || [];
        
        const groups: Record<string, TrendDataPoint[]> = {};
        
        reports.forEach(report => {
          const rDate = new Date(report.reportDate || report.createdAt);
          if (report.values && Array.isArray(report.values)) {
            report.values.forEach(val => {
              const marker = val.key || val.category || 'Unknown';
              if (!groups[marker]) groups[marker] = [];
              groups[marker].push({
                value: val.value,
                date: rDate,
                unit: val.unit,
                referenceRange: val.referenceRange,
                isAbnormal: val.isAbnormal
              });
            });
          }
        });

        // Sort chronologically for each marker
        Object.keys(groups).forEach(key => {
          groups[key].sort((a, b) => a.date.getTime() - b.date.getTime());
        });

        const availableMarkers = Object.keys(groups).sort();
        setGroupedData(groups);
        setBiomarkers(availableMarkers);
        
        if (availableMarkers.length > 0) {
          setSelectedMarker(availableMarkers[0]);
        }
      } catch (err) {
        console.warn("Backend unavailable or failed. Showing empty state.", err);
        setGroupedData({});
        setBiomarkers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const parseRange = (rangeStr: string): [number, number] | null => {
    if (!rangeStr) return null;
    const parts = rangeStr.split('-');
    if (parts.length === 2) {
      const min = parseFloat(parts[0].replace(/[^0-9.]/g, ''));
      const max = parseFloat(parts[1].replace(/[^0-9.]/g, ''));
      if (!isNaN(min) && !isNaN(max)) return [min, max];
    }
    return null;
  };

  const getChartConfig = () => ({
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#ffffff' },
    propsForBackgroundLines: { stroke: '#f1f5f9' },
  });

  const renderChart = () => {
    if (!selectedMarker || !groupedData[selectedMarker]) {
      return (
        <View className="h-48 items-center justify-center">
          <Text className="text-slate-400 text-xs">No data available for this marker.</Text>
        </View>
      );
    }

    let points = groupedData[selectedMarker];
    
    // Max 6 points to prevent overlapping
    if (points.length > 6) {
      points = points.slice(points.length - 6);
    }

    const labels = points.map(p => {
      const d = p.date;
      return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
    });
    const data = points.map(p => p.value);
    const recentPoint = points[points.length - 1];
    
    const parsedRange = parseRange(recentPoint.referenceRange);

    const screenWidth = Dimensions.get('window').width - 80;

    // RULE 2: Single Data Point Fallback
    if (points.length === 1) {
      return (
        <View className="items-center justify-center my-4">
          <BarChart
            data={{
              labels: labels,
              datasets: [{ data: data }]
            }}
            width={screenWidth}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
               backgroundColor: '#ffffff',
               backgroundGradientFrom: '#ffffff',
               backgroundGradientTo: '#ffffff',
               decimalPlaces: 1,
               color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
               labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
               propsForBackgroundLines: { strokeDasharray: '0' }
            }}
            showValuesOnTopOfBars={true}
            fromZero
            style={{ borderRadius: 16 }}
          />
          <Text className="text-[10px] text-slate-400 mt-2 text-center">
            Only 1 reading available. Upload more reports to see a trend line.
          </Text>
        </View>
      );
    }

    // RULE 3: Reference Ranges visual
    const datasets: any[] = [{
      data: data,
      color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
      strokeWidth: 2
    }];

    if (parsedRange) {
      datasets.push({
        data: points.map(() => parsedRange[0]),
        color: () => 'rgba(16, 185, 129, 0.4)', // Emerald Green dashed line
        withDots: false,
        strokeDashArray: [5, 5]
      });
      datasets.push({
        data: points.map(() => parsedRange[1]),
        color: () => 'rgba(16, 185, 129, 0.4)', // Emerald Green dashed line
        withDots: false,
        strokeDashArray: [5, 5]
      });
    }

    return (
      <View className="items-center my-4 -ml-4">
        <LineChart
          data={{ labels, datasets }}
          width={screenWidth + 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={getChartConfig()}
          bezier
          style={{ borderRadius: 16 }}
        />
        {parsedRange && (
          <View className="flex-row items-center gap-2 mt-2">
            <View className="w-3 h-0.5 bg-emerald-400" style={{ borderStyle: 'dashed' }} />
            <Text className="text-[10px] text-slate-400">Normal Range ({parsedRange[0]} - {parsedRange[1]})</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  const currentPoints = selectedMarker ? groupedData[selectedMarker] : [];
  const latestData = currentPoints && currentPoints.length > 0 ? currentPoints[currentPoints.length - 1] : null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      
      {/* Header */}
      <View className="px-5 pt-4 pb-3 bg-white dark:bg-slate-900 border-b border-border z-20">
        <View className="flex-row items-center gap-2 mb-2">
          <View className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center border border-indigo-200 dark:border-indigo-800">
            <Activity size={16} color="#4f46e5" />
          </View>
          <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Health Trends</Text>
        </View>
        <Text className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">
          AI-generated biomarker tracking from your uploaded lab reports.
        </Text>
      </View>

      {biomarkers.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Info size={48} color="#94a3b8" className="mb-4" />
          <Text className="text-lg font-bold text-slate-700 dark:text-slate-200 text-center">No Trends Yet</Text>
          <Text className="text-xs text-slate-500 text-center mt-2">
            Upload your medical reports to automatically generate trend charts for your biomarkers.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          
          {/* Metric Selector */}
          <View className="px-5 pt-6 pb-4 z-10">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Diagnostic Metric</Text>
            <TouchableOpacity 
              onPress={() => setShowDropdown(!showDropdown)}
              className="bg-white dark:bg-slate-900 border border-border h-12 rounded-xl flex-row items-center justify-between px-4 shadow-sm"
            >
              <View className="flex-row items-center gap-2">
                <TrendingUp size={16} color="#4f46e5" />
                <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedMarker}</Text>
              </View>
              <ChevronDown size={16} color="#94a3b8" />
            </TouchableOpacity>

            {showDropdown && (
              <View className="bg-white dark:bg-slate-800 border border-border rounded-xl mt-1 shadow-lg overflow-hidden absolute w-full top-[80px] z-50">
                {biomarkers.map((marker, index) => (
                  <TouchableOpacity 
                    key={marker} 
                    className={`px-4 py-3 ${index !== biomarkers.length - 1 ? 'border-b border-border' : ''} ${selectedMarker === marker ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                    onPress={() => { setSelectedMarker(marker); setShowDropdown(false); }}
                  >
                    <Text className={`text-xs font-bold ${selectedMarker === marker ? 'text-indigo-600' : 'text-slate-600'}`}>{marker}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Chart Card */}
          <View className="px-5 z-0">
            <View className="bg-white dark:bg-slate-900 rounded-3xl border border-border p-5 shadow-sm">
              
              {latestData && (
                <View className="flex-row justify-between items-start mb-6">
                  <View>
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Latest Reading</Text>
                    <View className="flex-row items-end gap-1.5">
                      <Text className={`text-4xl font-black ${latestData.isAbnormal ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {latestData.value}
                      </Text>
                      <Text className="text-sm font-bold text-slate-400 pb-1">{latestData.unit}</Text>
                    </View>
                  </View>
                  <View className={`px-3 py-1.5 rounded-full border ${latestData.isAbnormal ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <Text className={`text-[10px] font-black uppercase ${latestData.isAbnormal ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {latestData.isAbnormal ? 'Abnormal' : 'Normal'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Render the robust Chart */}
              {renderChart()}

            </View>
          </View>

          {/* AI Insight Card */}
          {latestData && (
            <View className="px-5 mt-8">
              <View className={`rounded-2xl border p-4 shadow-sm ${latestData.isAbnormal ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'}`}>
                <View className="flex-row items-start gap-3">
                  <View className="bg-white p-2 rounded-full shadow-sm">
                    {latestData.isAbnormal ? <AlertTriangle size={16} color="#e11d48" /> : <CheckCircle2 size={16} color="#4f46e5" />}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs font-black mb-1 ${latestData.isAbnormal ? 'text-rose-900' : 'text-indigo-900'}`}>
                      {latestData.isAbnormal ? 'Attention Recommended' : 'Stable Trajectory'}
                    </Text>
                    <Text className={`text-[10px] font-semibold leading-relaxed ${latestData.isAbnormal ? 'text-rose-700/80' : 'text-indigo-700/80'}`}>
                      Your latest {selectedMarker} reading is {latestData.value} {latestData.unit}. 
                      {latestData.isAbnormal 
                        ? ` This is outside the standard reference range of ${latestData.referenceRange}. Please consult your physician.`
                        : ` This is well within the healthy reference range of ${latestData.referenceRange}. Keep it up!`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default HealthTrendsScreen;
