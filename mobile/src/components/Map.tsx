import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, Callout, UrlTile } from 'react-native-maps';

interface HospitalPin {
 id: string;
 name: string;
 latitude: number;
 longitude: number;
 rating: number;
 recommendationScore: number;
}

interface MapProps {
 hospitals: HospitalPin[];
 selectedHospitalId?: string;
 onSelectHospital: (id: string) => void;
 onViewDetails?: (id: string) => void;
 userLat?: number;
 userLng?: number;
}

export const Map: React.FC<MapProps> = ({ 
 hospitals, 
 selectedHospitalId, 
 onSelectHospital,
 onViewDetails,
 userLat = 28.6139,
 userLng = 77.2090
}) => {
 const mapRef = useRef<MapView>(null);

 useEffect(() => {
 if (selectedHospitalId) {
 const selected = hospitals.find(h => h.id === selectedHospitalId);
 if (selected && mapRef.current) {
 mapRef.current.animateToRegion({
 latitude: selected.latitude,
 longitude: selected.longitude,
 latitudeDelta: 0.05,
 longitudeDelta: 0.05,
 });
 }
 }
 }, [selectedHospitalId, hospitals]);

 return (
 <View className="w-full h-full relative rounded-2xl overflow-hidden min-h-[350px]">
 <MapView
 ref={mapRef}
 style={StyleSheet.absoluteFillObject}
 provider={Platform.OS === 'ios' ? undefined : undefined} // undefined uses default provider
 initialRegion={{
 latitude: userLat,
 longitude: userLng,
 latitudeDelta: 0.1,
 longitudeDelta: 0.1,
 }}
 showsUserLocation={true}
 mapType={Platform.OS === 'android' ? "none" : "standard"} // 'none' hides Google's base map on Android so we just see OSM
 >
 {/* Use OpenStreetMap Tiles to bypass Google Maps billing */}
 <UrlTile
 urlTemplate="https://a.tile.openstreetmap.de/{z}/{x}/{y}.png"
 maximumZ={19}
 flipY={false}
 />

 <Marker 
 coordinate={{ latitude: userLat, longitude: userLng }}
 title="Your Location"
 pinColor="green"
 tracksViewChanges={false}
 />

 {hospitals.map(hosp => (
 <Marker
 key={hosp.id}
 coordinate={{ latitude: hosp.latitude, longitude: hosp.longitude }}
 pinColor={hosp.id === selectedHospitalId ? "blue" : "red"}
 onPress={() => onSelectHospital(hosp.id)}
 tracksViewChanges={false}
 >
 <Callout onPress={() => {
 if (onViewDetails) {
 onViewDetails(hosp.id);
 } else {
 onSelectHospital(hosp.id);
 }
 }}>
 <View className="p-2 min-w-[150px]">
 <Text className="font-bold text-foreground mb-1">{hosp.name}</Text>
 <Text className="text-xs text-muted-foreground mb-2">Match Score: <Text className="text-primary font-bold">{hosp.recommendationScore}%</Text></Text>
 <TouchableOpacity className="bg-primary py-1.5 px-3 rounded-md items-center">
 <Text className="text-white text-xs font-bold">View Clinic Details</Text>
 </TouchableOpacity>
 </View>
 </Callout>
 </Marker>
 ))}
 </MapView>

 <View className="absolute bottom-3 left-3 z-10 bg-black/80 px-2.5 py-1 rounded-lg">
 <Text className="text-[9px] text-white font-semibold uppercase tracking-wider">
 📍 Center: {userLat.toFixed(4)}, {userLng.toFixed(4)}
 </Text>
 </View>
 </View>
 );
};

export default Map;
