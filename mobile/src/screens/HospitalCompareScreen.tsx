import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { GitCompareArrows, Star, MapPin, CheckCircle2, Plus, Sparkles, Clock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';

const hospitals = [
 {
 id: "dispensary-pusa",
 name: "Dispensary Pusa",
 area: "Delhi Area",
 rating: 4.3,
 score: 91,
 distance: "1.6 km",
 isOpen: true,
 waitTime: "~20 min",
 beds: 45,
 specialists: 8,
 features: {
 "General Medicine": true,
 "Cardiology": false,
 "Neurology": false,
 "Pediatrics": true,
 "24/7 Emergency": false,
 "Blood Lab": true,
 "Pharmacy": true,
 "CGHS": true,
 },
 },
 {
 id: "cghs-inderpuri",
 name: "CGHS Inderpuri",
 area: "Delhi Area",
 rating: 4.7,
 score: 93,
 distance: "2.1 km",
 isOpen: true,
 waitTime: "~10 min",
 beds: 110,
 specialists: 22,
 features: {
 "General Medicine": true,
 "Cardiology": true,
 "Neurology": false,
 "Pediatrics": true,
 "24/7 Emergency": true,
 "Blood Lab": true,
 "Pharmacy": true,
 "CGHS": true,
 },
 },
 {
 id: "grover-nursing",
 name: "Dr Grover's Home",
 area: "Rajouri Garden",
 rating: 4.5,
 score: 95,
 distance: "3.2 km",
 isOpen: true,
 waitTime: "~5 min",
 beds: 78,
 specialists: 15,
 features: {
 "General Medicine": true,
 "Cardiology": true,
 "Neurology": true,
 "Pediatrics": false,
 "24/7 Emergency": true,
 "Blood Lab": true,
 "Pharmacy": false,
 "CGHS": false,
 },
 },
];

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
 const { user } = useAuth();
 const [selected, setSelected] = useState<string[]>(["dispensary-pusa", "cghs-inderpuri"]);

 const toggleHospital = (id: string) => {
 setSelected((prev) =>
 prev.includes(id)
 ? prev.filter((h) => h !== id)
 : prev.length < 3
 ? [...prev, id]
 : prev
 );
 };

 const compareHospitals = hospitals.filter((h) => selected.includes(h.id));
 const screenWidth = Dimensions.get('window').width;
 const colWidth = (screenWidth - 40 - 100) / compareHospitals.length; // 40 for padding, 100 for label col

 return (
 <SafeAreaView className="flex-1 bg-background">
 <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="flex-1">
 
 {/* Header */}
 <View className="px-5 pt-5 pb-4">
 <View className="flex-row items-center gap-2 mb-1">
 <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
 <GitCompareArrows size={18} color="#2563EB" />
 </View>
 <Text className="text-xl font-extrabold text-foreground">Hospital Compare</Text>
 </View>
 <Text className="text-sm text-muted-foreground leading-relaxed mt-2">
 Select up to 3 hospitals to compare features, ratings, and availability side-by-side.
 </Text>
 </View>

 {/* Hospital Selector */}
 <View className="px-5 mb-6">
 <Text className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">
 Select Hospitals ({selected.length}/3)
 </Text>
 <View className="flex flex-col gap-3">
 {hospitals.map((h) => {
 const isSelected = selected.includes(h.id);
 return (
 <TouchableOpacity
 key={h.id}
 onPress={() => toggleHospital(h.id)}
 activeOpacity={0.8}
 className={`flex-row items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${
 isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
 }`}
 >
 <View className={`w-6 h-6 rounded-md border items-center justify-center ${
 isSelected ? "bg-primary border-primary" : "bg-muted border-border"
 }`}>
 {isSelected ? (
 <CheckCircle2 size={14} color="white" />
 ) : (
 <Plus size={14} color="#94a3b8" />
 )}
 </View>
 <View className="flex-1">
 <Text className="text-sm font-bold text-foreground">{h.name}</Text>
 <View className="flex-row items-center gap-1.5 mt-1">
 <MapPin size={12} color="#64748b" />
 <Text className="text-xs text-muted-foreground">{h.distance}</Text>
 <Text className="text-muted-foreground">·</Text>
 <Star size={12} color="#eab308" fill="#eab308" />
 <Text className="text-xs font-semibold text-foreground">{h.rating}</Text>
 </View>
 </View>
 {isSelected && (
 <Badge variant="outline" className="border-primary bg-primary/10">
 <Text className="font-bold text-primary text-[10px]">Score {h.score}%</Text>
 </Badge>
 )}
 </TouchableOpacity>
 );
 })}
 </View>
 </View>

 {/* Comparison Table */}
 {compareHospitals.length >= 2 ? (
 <View className="px-5 mb-6">
 {/* AI Summary Banner */}
 <View className="bg-primary/5 rounded-2xl border border-primary/20 px-4 py-3 mb-4 flex-row items-start gap-3">
 <Sparkles size={16} color="#2563EB" className="mt-0.5" />
 <Text className="text-xs text-foreground leading-relaxed flex-1">
 <Text className="font-bold text-primary">AI Recommendation: </Text>
 {compareHospitals[0].score > (compareHospitals[1]?.score ?? 0)
 ? compareHospitals[0].name
 : compareHospitals[1].name}{" "}
 scores highest overall. Consider it if emergency access and specialist coverage are priorities.
 </Text>
 </View>

 {/* Table */}
 <View className="bg-card rounded-2xl border border-border overflow-hidden">
 
 {/* Header Row */}
 <View className="flex-row border-b border-border bg-muted/50">
 <View className="w-[100px] p-3 justify-center" />
 {compareHospitals.map((h, i) => (
 <View key={h.id} style={{ width: colWidth }} className={`p-3 justify-center border-l border-border ${i%2===1 ? 'bg-muted/30' : ''}`}>
 <Text className="text-[11px] font-bold text-foreground" numberOfLines={1}>{h.name}</Text>
 <View className="flex-row items-center gap-1 mt-1">
 <View className={`w-1.5 h-1.5 rounded-full ${h.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
 <Text className="text-[9px] text-muted-foreground font-semibold uppercase">{h.isOpen ? 'Open' : 'Closed'}</Text>
 </View>
 </View>
 ))}
 </View>

 {/* Stats Rows */}
 {[
 { label: "Rating", render: (h: any) => <View className="flex-row items-center gap-1"><Star size={12} color="#eab308" fill="#eab308" /><Text className="text-xs font-bold text-foreground">{h.rating}</Text></View> },
 { label: "Match", render: (h: any) => <Badge variant="outline" className="border-amber-500/40 px-1 py-0"><Text className="text-[10px] font-bold text-amber-500">{h.score}%</Text></Badge> },
 { label: "Distance", render: (h: any) => <Text className="text-xs font-semibold text-primary">{h.distance}</Text> },
 { label: "Wait", render: (h: any) => <View className="flex-row items-center gap-1"><Clock size={12} color="#64748b" /><Text className="text-[10px] font-semibold text-foreground">{h.waitTime}</Text></View> },
 { label: "Beds", render: (h: any) => <Text className="text-xs font-semibold text-foreground">{h.beds}</Text> },
 { label: "Docs", render: (h: any) => <Text className="text-xs font-semibold text-foreground">{h.specialists}</Text> },
 ].map((row, i) => (
 <View key={row.label} className="flex-row border-b border-border">
 <View className={`w-[100px] p-3 justify-center ${i%2===1 ? 'bg-muted/50' : 'bg-muted/30'}`}>
 <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{row.label}</Text>
 </View>
 {compareHospitals.map((h, j) => (
 <View key={h.id} style={{ width: colWidth }} className={`p-3 justify-center items-center border-l border-border ${j%2===1 ? 'bg-muted/20' : ''}`}>
 {row.render(h)}
 </View>
 ))}
 </View>
 ))}

 {/* Divider */}
 <View className="px-4 py-2.5 bg-muted/80 border-t border-border">
 <Text className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Services</Text>
 </View>

 {/* Features Rows */}
 {featureKeys.map((feature, i) => (
 <View key={feature} className={`flex-row ${i === featureKeys.length - 1 ? '' : 'border-b border-border'}`}>
 <View className={`w-[100px] p-3 justify-center ${i%2===1 ? 'bg-muted/50' : 'bg-muted/30'}`}>
 <Text className="text-[9px] font-semibold text-muted-foreground leading-tight">{feature}</Text>
 </View>
 {compareHospitals.map((h, j) => {
 const has = h.features[feature as keyof typeof h.features];
 return (
 <View key={h.id} style={{ width: colWidth }} className={`p-3 justify-center items-center border-l border-border ${j%2===1 ? 'bg-muted/20' : ''}`}>
 {has ? (
 <CheckCircle2 size={16} color="#22c55e" />
 ) : (
 <Text className="text-muted-foreground/30 font-bold text-lg">-</Text>
 )}
 </View>
 );
 })}
 </View>
 ))}

 </View>
 </View>
 ) : (
 <View className="mx-5 mb-6 bg-card rounded-2xl border-2 border-dashed border-border p-10 flex items-center justify-center">
 <GitCompareArrows size={40} color="#cbd5e1" />
 <Text className="text-sm font-semibold text-muted-foreground text-center mt-4">
 Select at least 2 hospitals above to start comparing.
 </Text>
 </View>
 )}

 </ScrollView>
 </SafeAreaView>
 );
};

export default HospitalCompareScreen;
