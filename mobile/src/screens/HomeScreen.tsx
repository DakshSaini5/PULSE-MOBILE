import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Search, MapPin, Stethoscope } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useUserLocation } from '../context/LocationContext';
import { ServicesGrid } from '../components/ServicesGrid';
import { EmergencyContacts } from '../components/EmergencyContacts';
import { NotificationCenter } from '../components/NotificationCenter';
import { dashboardAPI, hospitalAPI } from '../services/api';
import EmergencyContactModal from '../components/EmergencyContactModal';

let hasPromptedEmergencyContacts = false;
let hasShownServiceNotice = false;

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { label: cityName, latitude: lat, longitude: lng } = useUserLocation();
  const stableLat = lat ? parseFloat(lat.toFixed(4)) : undefined;
  const stableLng = lng ? parseFloat(lng.toFixed(4)) : undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const [autocompleteHospitals, setAutocompleteHospitals] = useState<Array<{ id: string; name: string }>>([]);
  const [autocompleteSpecialties, setAutocompleteSpecialties] = useState<Array<{ name: string }>>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchingAutocomplete, setSearchingAutocomplete] = useState(false);
  const [stats, setStats] = useState({ scans: 0, hospitals: 0, trends: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Geographic service boundary check
  useEffect(() => {
    if (cityName && !hasShownServiceNotice) {
      const lowerCity = cityName.toLowerCase();
      const isSupported = ['delhi', 'new delhi', 'mumbai', 'bombay', 'bangalore', 'bengaluru'].some(c => lowerCity.includes(c));
      if (!isSupported) {
        hasShownServiceNotice = true;
        Alert.alert(
          "Service Notice",
          "Our complete service is only in Delhi, Mumbai, and Bangalore for now."
        );
      }
    }
  }, [cityName]);

  // Session guarded automatic emergency contact prompt
  useEffect(() => {
    if (!statsLoading && contacts.length === 0 && !hasPromptedEmergencyContacts) {
      hasPromptedEmergencyContacts = true;
      setIsEmergencyModalOpen(true);
    }
  }, [statsLoading, contacts]);

  // Live Autocomplete Effect with Debounce Protection
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setAutocompleteHospitals([]);
      setAutocompleteSpecialties([]);
      setShowAutocomplete(false);
      return;
    }

    setSearchingAutocomplete(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await hospitalAPI.autocomplete(searchQuery, stableLat, stableLng, cityName || undefined);
        setAutocompleteHospitals(data.hospitals || []);
        setAutocompleteSpecialties(data.specialties || []);
        setShowAutocomplete(true);
      } catch (err) {
        console.error('[API] Autocomplete error:', err);
      } finally {
        setSearchingAutocomplete(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, stableLat, stableLng, cityName]);

  const handleSelectHospitalSuggestion = (hospitalId: string) => {
    setShowAutocomplete(false);
    navigation.navigate('HospitalDetail', { id: hospitalId });
  };

  const handleSelectSpecialtySuggestion = (specialtyName: string) => {
    setShowAutocomplete(false);
    navigation.navigate('SearchTab', { specialty: specialtyName });
    setSearchQuery('');
  };
  const fetchDashboard = useCallback(async () => {
    if (!user) return;
    try {
      const data = await dashboardAPI.getSummary();
      setStats(data.summary);
      setContacts(data.emergencyContacts);
    } catch (err) {
      console.error("Failed to fetch dashboard summary", err);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Greeting Section */}
        <View className="px-5 pt-6 pb-4">
          <View className="flex-row justify-between items-start">
            <Text className="text-[32px] font-black text-slate-800 dark:text-slate-100 tracking-tighter leading-10 flex-1">
              Hi, {user?.name || 'Daksh Saini'}
            </Text>
            <View className="mt-1">
              <NotificationCenter />
            </View>
          </View>
          <View className="flex-row items-center mt-2">
            <MapPin size={14} color="#64748b" />
            <Text className="text-xs text-slate-500 dark:text-slate-400 font-semibold ml-1.5">
              {cityName || 'Delhi, India'} <Text className="text-primary font-bold">[Change]</Text>
            </Text>
          </View>

          {/* Search Bar */}
          <View className="mt-6 relative z-50">
            <View className="flex-row items-center bg-white dark:bg-slate-900 border border-border rounded-2xl h-14 pl-4 pr-1.5 shadow-sm">
              <Search size={20} color="#94a3b8" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => {
                  setShowAutocomplete(false);
                  if (searchQuery.trim()) {
                    navigation.navigate('SearchTab', { searchQuery: searchQuery });
                  } else {
                    navigation.navigate('SearchTab');
                  }
                }}
                placeholder="Search hospitals, services..."
                placeholderTextColor="#94a3b8"
                className="flex-1 ml-3 text-sm text-foreground font-semibold h-full"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setAutocompleteHospitals([]); setAutocompleteSpecialties([]); setShowAutocomplete(false); }} className="p-1 mr-1">
                  <Text className="text-slate-400 text-xs font-bold">Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                className="bg-primary px-5 py-2.5 rounded-xl h-[44px] justify-center"
                onPress={() => {
                  setShowAutocomplete(false);
                  if (searchQuery.trim()) {
                    navigation.navigate('SearchTab', { searchQuery: searchQuery });
                  } else {
                    navigation.navigate('SearchTab');
                  }
                }}
              >
                <Text className="text-white font-bold text-xs tracking-wide">Search</Text>
              </TouchableOpacity>
            </View>

            {/* Autocomplete Dropdown */}
            {showAutocomplete && (autocompleteHospitals.length > 0 || autocompleteSpecialties.length > 0) && (
              <View className="absolute top-16 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-60">
                <ScrollView keyboardShouldPersistTaps="handled">
                  {autocompleteSpecialties.length > 0 && (
                    <View className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-2 py-1 uppercase tracking-wider">Specialties</Text>
                      {autocompleteSpecialties.map((spec) => (
                        <TouchableOpacity
                          key={spec.name}
                          onPress={() => handleSelectSpecialtySuggestion(spec.name)}
                          className="flex-row items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 mb-1"
                        >
                          <Stethoscope size={14} color="#2563EB" />
                          <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">{spec.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {autocompleteHospitals.length > 0 && (
                    <View className="p-2">
                      <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-2 py-1 uppercase tracking-wider">Hospitals</Text>
                      {autocompleteHospitals.map((hosp) => (
                        <TouchableOpacity
                          key={hosp.id}
                          onPress={() => handleSelectHospitalSuggestion(hosp.id)}
                          className="flex-row items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 mb-1"
                        >
                          <MapPin size={14} color="#64748b" />
                          <Text className="text-xs text-slate-700 dark:text-slate-300 font-semibold" numberOfLines={1}>
                            {hosp.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity 
              className="flex-1 bg-slate-200 dark:bg-slate-800 h-11 rounded-full items-center justify-center flex-row"
              onPress={() => navigation.navigate('SearchTab')}
            >
              <Text className="font-bold text-slate-700 dark:text-slate-300 text-xs">? Need Help?</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 bg-slate-800 dark:bg-slate-100 h-11 rounded-full items-center justify-center flex-row"
              onPress={() => navigation.navigate('SearchTab')}
            >
              <Text className="font-bold text-white dark:text-slate-900 text-xs">• Find Hospitals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Persistent Warning Banner */}
        {contacts.length === 0 && (
          <TouchableOpacity 
            onPress={() => setIsEmergencyModalOpen(true)}
            className="mx-5 mt-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 rounded-2xl flex-row items-center gap-3"
          >
            <View className="w-2 h-2 rounded-full bg-rose-500" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-rose-700 dark:text-rose-400">No Emergency Contacts Added</Text>
              <Text className="text-[10px] text-rose-600 dark:text-rose-500 mt-0.5">Please add at least one contact to enable the Panic Button SMS alert system.</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Services Grid */}
        <ServicesGrid />

        {/* Emergency Contacts */}
        <EmergencyContacts contacts={contacts} onAddSuccess={fetchDashboard} />

        {/* Controlled Emergency Contact Modal */}
        <EmergencyContactModal 
          isOpen={isEmergencyModalOpen}
          onClose={() => setIsEmergencyModalOpen(false)}
          onSuccess={() => {
            setIsEmergencyModalOpen(false);
            fetchDashboard();
          }}
        />

        {/* Metric Footer */}
        <View className="px-5 py-6">
          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-border p-4 shadow-sm">
            <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              Dashboard Summary
            </Text>
            <View className="flex-row justify-between gap-3">
              {[
                { label: "Scans", value: stats.scans.toString(), sub: "Analyzed", route: 'ReportsTab' },
                { label: "Hospitals", value: stats.hospitals.toString(), sub: "Saved", route: 'SavedHospitals' },
                { label: "Trends", value: stats.trends.toString(), sub: "Tracked", route: 'HealthTrendsTab' },
              ].map((stat, i) => (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => navigation.navigate(stat.route)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 items-center border border-slate-100 dark:border-slate-800 active:bg-slate-100 dark:active:bg-slate-700"
                >
                  {statsLoading ? (
                    <View className="w-8 h-6 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
                  ) : (
                    <Text className="text-2xl font-black text-primary mb-0.5">{stat.value}</Text>
                  )}
                  <Text className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{stat.label}</Text>
                  <Text className="text-[9px] text-slate-400 font-semibold">{stat.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
