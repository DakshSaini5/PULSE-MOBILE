import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { GitCompareArrows, Star, MapPin, CheckCircle2, Plus, Sparkles, Clock, X } from 'lucide-react-native';
import { useUserLocation } from '../context/LocationContext';
import { hospitalAPI, Hospital } from '../services/api';
import { useRoute, useNavigation } from '@react-navigation/native';

const featureKeys = [
  "General Medicine",
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "24/7 Emergency",
  "Blood Lab",
  "Pharmacy",
  "CGHS",
];

export const HospitalCompareScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const initialIds: string[] = route.params?.ids || [];
  const { latitude: lat, longitude: lng } = useUserLocation();

  const [selected, setSelected] = useState<string[]>(initialIds);
  const [hospitalsCache, setHospitalsCache] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (initialIds.length === 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await hospitalAPI.compare(initialIds, lat || undefined, lng || undefined);
        setHospitalsCache(data || []);
        setSelected(data.map(h => h.id)); // Select all returned ones by default
      } catch (err) {
        console.error('[Compare] Error fetching comparison:', err);
        setError('Could not load comparison data.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [lat, lng]);

  const toggleHospital = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((h) => h !== id)
        : prev.length < 4
        ? [...prev, id]
        : prev
    );
  };

  const compareHospitals = hospitalsCache.filter((h) => selected.includes(h.id));
  const colWidth = 145; // Fixed width for horizontal scrolling

  const getWaitTime = (id: string) => {
    const code = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    return `~${(code % 4 + 1) * 10} min`;
  };

  const getBeds = (id: string) => {
    const code = id.charCodeAt(1) + id.charCodeAt(id.length - 2);
    return (code % 40) + 10;
  };

  const hasFeature = (h: Hospital, feature: string) => {
    if (feature === '24/7 Emergency') {
      return h.emergencyAvailable;
    }
    return h.specialties?.some(
      (s: any) => s.specialty?.name.toLowerCase() === feature.toLowerCase()
    );
  };

  const sortedByScore = [...compareHospitals].sort(
    (a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0)
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-5 pt-5 pb-4 bg-white dark:bg-slate-900 border-b border-border">
          <View className="flex-row items-center gap-2 mb-1">
            <View className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 items-center justify-center border border-blue-200 dark:border-blue-800">
              <GitCompareArrows size={18} color="#2563EB" />
            </View>
            <Text className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Hospital Compare</Text>
          </View>
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
            Select up to 4 hospitals to compare features, ratings, and availability side-by-side.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" className="my-12" />
        ) : error ? (
          <View className="m-5 p-6 bg-rose-50 border border-rose-100 rounded-2xl items-center">
            <Text className="text-sm font-bold text-rose-700 text-center">{error}</Text>
          </View>
        ) : hospitalsCache.length === 0 ? (
          <View className="m-5 p-10 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-border items-center justify-center">
            <GitCompareArrows size={40} color="#cbd5e1" />
            <Text className="text-sm font-bold text-slate-500 text-center mt-4">
              No hospitals selected for comparison. Please go back to the Search Tab.
            </Text>
          </View>
        ) : (
          <>
            {/* Hospital Selector */}
            <View className="px-5 py-5 border-b border-border">
              <Text className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3">
                Available Selection ({selected.length}/{hospitalsCache.length})
              </Text>
              <View className="flex flex-col gap-2">
                {hospitalsCache.map((h) => {
                  const isSelected = selected.includes(h.id);
                  return (
                    <TouchableOpacity
                      key={h.id}
                      onPress={() => toggleHospital(h.id)}
                      activeOpacity={0.8}
                      className={`flex-row items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        isSelected ? "border-primary bg-blue-50 dark:bg-blue-900/20" : "border-transparent bg-white dark:bg-slate-900"
                      }`}
                    >
                      <View className={`w-5 h-5 rounded flex items-center justify-center border ${
                        isSelected ? "bg-primary border-primary" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                      }`}>
                        {isSelected && <CheckCircle2 size={12} color="white" />}
                      </View>
                      <View className="flex-1">
                        <Text className={`text-sm font-bold ${isSelected ? "text-primary" : "text-slate-700 dark:text-slate-300"}`}>{h.name}</Text>
                      </View>
                      {h.recommendationScore !== undefined && (
                        <View className="bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                          <Text className="font-bold text-primary text-[10px]">Score {h.recommendationScore}%</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Comparison Table */}
            {compareHospitals.length >= 2 ? (
              <View className="pt-6">
                <View className="px-5 mb-4">
                  <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 px-4 py-3 flex-row items-start gap-3">
                    <Sparkles size={16} color="#2563EB" className="mt-0.5" />
                    <Text className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex-1 font-medium">
                      <Text className="font-black text-primary">AI Recommendation: </Text>
                      {sortedByScore[0]?.name} scores highest overall ({sortedByScore[0]?.recommendationScore}%). Consider it if emergency access and specialist coverage are priorities.
                    </Text>
                  </View>
                </View>

                {/* Matrix View (Horizontal Scroll) */}
                <View className="bg-white dark:bg-slate-900 border-y border-border">
                  <ScrollView horizontal showsHorizontalScrollIndicator={true} bounces={false} style={{ width: Dimensions.get('window').width }}>
                    <View className="flex-col pb-4">
                      
                      {/* Header Row */}
                      <View className="flex-row border-b border-border bg-slate-50 dark:bg-slate-950">
                        <View className="w-[110px] p-3 justify-center border-r border-border bg-white dark:bg-slate-900 z-10" />
                        {compareHospitals.map((h, i) => (
                          <View key={h.id} style={{ width: colWidth }} className={`p-4 justify-center border-r border-border ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}>
                            <TouchableOpacity onPress={() => navigation.navigate('HospitalDetail', { id: h.id })}>
                              <Text className="text-xs font-black text-primary underline" numberOfLines={2}>{h.name}</Text>
                            </TouchableOpacity>
                            <View className="flex-row items-center gap-1 mt-1.5">
                              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <Text className="text-[9px] font-bold tracking-widest uppercase text-slate-500">Available</Text>
                            </View>
                          </View>
                        ))}
                      </View>

                      {/* Stats Rows */}
                      {[
                        { label: "Rating", render: (h: any) => <View className="flex-row items-center gap-1"><Star size={12} color="#f59e0b" fill="#f59e0b" /><Text className="text-xs font-bold text-slate-700 dark:text-slate-200">{h.rating?.toFixed(1)} / 5.0</Text></View> },
                        { label: "Match Score", render: (h: any) => <View className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded"><Text className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{h.recommendationScore}%</Text></View> },
                        { label: "Distance", render: (h: any) => <Text className="text-xs font-bold text-primary">{h.distance?.toFixed(1)} km</Text> },
                        { label: "Wait Time", render: (h: any) => <View className="flex-row items-center gap-1.5"><Clock size={12} color="#64748b" /><Text className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{getWaitTime(h.id)}</Text></View> },
                        { label: "Beds Available", render: (h: any) => <Text className="text-xs font-bold text-slate-700 dark:text-slate-200">{getBeds(h.id)}</Text> },
                      ].map((row, i) => (
                        <View key={row.label} className="flex-row border-b border-border">
                          <View className="w-[110px] p-3 justify-center border-r border-border bg-white dark:bg-slate-900 z-10">
                            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.label}</Text>
                          </View>
                          {compareHospitals.map((h, j) => (
                            <View key={h.id} style={{ width: colWidth }} className={`p-3 justify-center items-center border-r border-border ${j % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}>
                              {row.render(h)}
                            </View>
                          ))}
                        </View>
                      ))}

                      {/* Divider */}
                      <View className="bg-slate-100 dark:bg-slate-950 border-b border-border px-3 py-2 flex-row">
                        <Text className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Available Services</Text>
                      </View>

                      {/* Features Rows */}
                      {featureKeys.map((feature, i) => (
                        <View key={feature} className={`flex-row ${i === featureKeys.length - 1 ? '' : 'border-b border-border'}`}>
                          <View className="w-[110px] p-3 justify-center border-r border-border bg-white dark:bg-slate-900 z-10">
                            <Text className="text-[9px] font-bold text-slate-600 dark:text-slate-400 leading-tight">{feature}</Text>
                          </View>
                          {compareHospitals.map((h, j) => {
                            const has = hasFeature(h, feature);
                            return (
                              <View key={h.id} style={{ width: colWidth }} className={`p-3 justify-center items-center border-r border-border ${j % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`}>
                                {has ? (
                                  <CheckCircle2 size={16} color="#10b981" />
                                ) : (
                                  <X size={16} color="#cbd5e1" />
                                )}
                              </View>
                            );
                          })}
                        </View>
                      ))}

                    </View>
                  </ScrollView>
                </View>
              </View>
            ) : (
              <View className="mx-5 mt-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-border p-10 flex items-center justify-center">
                <GitCompareArrows size={40} color="#cbd5e1" />
                <Text className="text-sm font-bold text-slate-500 text-center mt-4 px-4">
                  Select at least 2 hospitals above to start comparing in the matrix view.
                </Text>
              </View>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default HospitalCompareScreen;
