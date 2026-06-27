import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';

// TODO: Migrate @core/utils/geolocation if needed, but we use expo-location reverse geocoding directly now.

export interface LocationState {
 latitude: number;
 longitude: number;
 source: 'gps' | 'manual' | 'default';
 label: string;
 locationStatus: 'checking' | 'granted' | 'denied';
}

interface LocationContextType extends LocationState {
 setManualLocation: (lat: number, lng: number, label: string) => Promise<void>;
 requestGPSLocation: () => Promise<boolean>;
 clearManualLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.2090;
const DEFAULT_LABEL = 'Delhi Area, Delhi';

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [state, setState] = useState<LocationState>({
 latitude: DEFAULT_LAT,
 longitude: DEFAULT_LNG,
 source: 'default',
 label: DEFAULT_LABEL,
 locationStatus: 'checking',
 });

 const getCityFromCoords = async (lat: number, lng: number): Promise<string> => {
 try {
 const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
 if (result.length > 0) {
 const place = result[0];
 return place.city || place.subregion || place.region || 'Unknown Location';
 }
 } catch (err) {
 console.warn('Reverse geocoding failed:', err);
 }
 return 'Unknown Location';
 };

 const triggerGPSQuery = async () => {
 try {
 let { status } = await Location.requestForegroundPermissionsAsync();
 if (status !== 'granted') {
 throw new Error('Permission to access location was denied');
 }

 let location = await Location.getCurrentPositionAsync({
 accuracy: Location.Accuracy.Balanced,
 });

 const lat = location.coords.latitude;
 const lng = location.coords.longitude;

 let resolvedLabel = 'GPS Location';
 const city = await getCityFromCoords(lat, lng);
 if (city && city !== 'Unknown Location') {
 resolvedLabel = city;
 }

 await SecureStore.setItemAsync('pulse_latitude', lat.toString());
 await SecureStore.setItemAsync('pulse_longitude', lng.toString());
 await SecureStore.setItemAsync('pulse_location_source', 'gps');
 await SecureStore.setItemAsync('pulse_location_label', resolvedLabel);

 setState({
 latitude: lat,
 longitude: lng,
 source: 'gps',
 label: resolvedLabel,
 locationStatus: 'granted',
 });
 } catch (error: any) {
 console.warn('GPS query failed or denied:', error.message);

 const existingSource = await SecureStore.getItemAsync('pulse_location_source');
 if (existingSource === 'gps' || existingSource === 'manual') {
 return;
 }

 await SecureStore.setItemAsync('pulse_latitude', DEFAULT_LAT.toString());
 await SecureStore.setItemAsync('pulse_longitude', DEFAULT_LNG.toString());
 await SecureStore.setItemAsync('pulse_location_source', 'default');
 await SecureStore.setItemAsync('pulse_location_label', DEFAULT_LABEL);

 setState({
 latitude: DEFAULT_LAT,
 longitude: DEFAULT_LNG,
 source: 'default',
 label: DEFAULT_LABEL,
 locationStatus: 'denied',
 });
 }
 };

 useEffect(() => {
 const initLocation = async () => {
 try {
 const savedLat = await SecureStore.getItemAsync('pulse_latitude');
 const savedLng = await SecureStore.getItemAsync('pulse_longitude');
 const savedSource = await SecureStore.getItemAsync('pulse_location_source');
 const savedLabel = await SecureStore.getItemAsync('pulse_location_label');

 if (savedLat && savedLng && savedSource && savedLabel) {
 setState({
 latitude: parseFloat(savedLat),
 longitude: parseFloat(savedLng),
 source: savedSource as any,
 label: savedLabel,
 locationStatus: (savedSource === 'gps' || savedSource === 'manual') ? 'granted' : 'denied',
 });

 if (savedLabel === 'GPS Location' || savedLabel === 'Unknown Location') {
 const city = await getCityFromCoords(parseFloat(savedLat), parseFloat(savedLng));
 if (city && city !== 'Unknown Location') {
 await SecureStore.setItemAsync('pulse_location_label', city);
 setState((prev) => ({ ...prev, label: city }));
 }
 }

 if (savedSource === 'gps') {
 triggerGPSQuery();
 }
 } else {
 triggerGPSQuery();
 }
 } catch (e) {
 console.error("Failed to load location from SecureStore", e);
 triggerGPSQuery();
 }
 };
 initLocation();
 }, []);

 const setManualLocation = async (lat: number, lng: number, label: string) => {
 await SecureStore.setItemAsync('pulse_latitude', lat.toString());
 await SecureStore.setItemAsync('pulse_longitude', lng.toString());
 await SecureStore.setItemAsync('pulse_location_source', 'manual');
 await SecureStore.setItemAsync('pulse_location_label', label);

 setState({
 latitude: lat,
 longitude: lng,
 source: 'manual',
 label,
 locationStatus: 'granted',
 });
 };

 const requestGPSLocation = async (): Promise<boolean> => {
 try {
 let { status } = await Location.requestForegroundPermissionsAsync();
 if (status !== 'granted') {
 return false;
 }

 let location = await Location.getCurrentPositionAsync({});
 const lat = location.coords.latitude;
 const lng = location.coords.longitude;

 let resolvedLabel = 'GPS Location';
 const city = await getCityFromCoords(lat, lng);
 if (city && city !== 'Unknown Location') {
 resolvedLabel = city;
 }

 await SecureStore.setItemAsync('pulse_latitude', lat.toString());
 await SecureStore.setItemAsync('pulse_longitude', lng.toString());
 await SecureStore.setItemAsync('pulse_location_source', 'gps');
 await SecureStore.setItemAsync('pulse_location_label', resolvedLabel);

 setState({
 latitude: lat,
 longitude: lng,
 source: 'gps',
 label: resolvedLabel,
 locationStatus: 'granted',
 });

 return true;
 } catch (error: any) {
 console.warn('GPS query failed:', error.message);
 return false;
 }
 };

 const clearManualLocation = async () => {
 await SecureStore.deleteItemAsync('pulse_latitude');
 await SecureStore.deleteItemAsync('pulse_longitude');
 await SecureStore.deleteItemAsync('pulse_location_source');
 await SecureStore.deleteItemAsync('pulse_location_label');

 triggerGPSQuery();
 };

 return (
 <LocationContext.Provider value={{ ...state, setManualLocation, requestGPSLocation, clearManualLocation }}>
 {children}
 </LocationContext.Provider>
 );
};

export const useUserLocation = () => {
 const context = useContext(LocationContext);
 if (context === undefined) {
 throw new Error('useUserLocation must be used within a LocationProvider');
 }
 return context;
};
