import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, PanResponder, FlatList } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { useNavigation, useRoute } from '@react-navigation/native';
import { hospitalAPI, Hospital } from '../services/api';
import { Map } from '../components/Map';
import { Search as SearchIcon, MapPin, Star, Heart, Bookmark, ExternalLink, Activity, Target, ChevronDown, CheckSquare, Stethoscope, Navigation } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useUserLocation } from '../context/LocationContext';
import LocationModal from '../components/LocationModal';

const specialtiesList = [
  'General', 'Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'Gynecology', 'Dermatology', 'Endocrinology',
  'Gastroenterology', 'Oncology', 'Ophthalmology', 'Urology', 'Psychiatry', 'ENT', 'Pulmonology', 'General Surgery',
  'Dental', 'Emergency Medicine'
];

export const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  
  const [query, setQuery] = useState(route.params?.searchQuery || route.params?.query || '');
  const [specialty, setSpecialty] = useState(route.params?.specialty || 'General');
  const [radius, setRadius] = useState(15);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [sortBy, setSortBy] = useState('Match Score');
  
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const { latitude: lat, longitude: lng, label: cityName, locationStatus } = useUserLocation();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  // Live Autocomplete states
  const [autocompleteHospitals, setAutocompleteHospitals] = useState<Array<{ id: string; name: string }>>([]);
  const [autocompleteSpecialties, setAutocompleteSpecialties] = useState<Array<{ name: string }>>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchingAutocomplete, setSearchingAutocomplete] = useState(false);

  // Compare states
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const stableLat = lat ? parseFloat(lat.toFixed(4)) : undefined;
  const stableLng = lng ? parseFloat(lng.toFixed(4)) : undefined;

  // Live Autocomplete Effect with Debounce Protection
  useEffect(() => {
    if (query.trim().length < 2) {
      setAutocompleteHospitals([]);
      setAutocompleteSpecialties([]);
      setShowAutocomplete(false);
      return;
    }

    setSearchingAutocomplete(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await hospitalAPI.autocomplete(query, stableLat, stableLng, cityName || undefined);
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
  }, [query, stableLat, stableLng, cityName]);

  useEffect(() => {
    fetchHospitals();
  }, [radius, specialty, stableLat, stableLng]);

  useEffect(() => {
    fetchSavedHospitals();
  }, [stableLat, stableLng]);

  const fetchSavedHospitals = async () => {
    try {
      const saved = await hospitalAPI.getSaved(stableLat, stableLng);
      setSavedIds(saved.map(s => s.id));
    } catch (err) {
      console.error('Error fetching saved hospitals:', err);
    }
  };

  const handleToggleSave = useCallback(async (hospitalId: string) => {
    try {
      const isCurrentlySaved = savedIds.includes(hospitalId);
      // Optimistic update
      setSavedIds(prev => isCurrentlySaved ? prev.filter(id => id !== hospitalId) : [...prev, hospitalId]);
      
      if (isCurrentlySaved) {
        await hospitalAPI.unsave(hospitalId);
      } else {
        await hospitalAPI.save(hospitalId);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      fetchSavedHospitals(); // revert on error
    }
  }, [savedIds, stableLat, stableLng]);

  useEffect(() => {
    const passedQuery = route.params?.searchQuery || route.params?.query;
    const passedSpecialty = route.params?.specialty;
    
    let shouldUpdate = false;
    let nextQuery = query;
    let nextSpecialty = specialty;

    if (passedQuery !== undefined && passedQuery !== query) {
      setQuery(passedQuery);
      nextQuery = passedQuery;
      shouldUpdate = true;
    }
    
    if (passedSpecialty !== undefined && passedSpecialty !== specialty) {
      setSpecialty(passedSpecialty || 'General');
      nextSpecialty = passedSpecialty || 'General';
      shouldUpdate = true;
    }
    
    if (shouldUpdate || passedQuery !== undefined) {
      // Clear out navigation parameters cleanly
      navigation.setParams({ searchQuery: undefined, query: undefined, specialty: undefined });
      
      // Trigger fetch immediately with new parameters
      fetchHospitals(nextQuery, nextSpecialty);
    }
  }, [route.params?.searchQuery, route.params?.query, route.params?.specialty]);

  const fetchHospitals = async (overrideQuery?: string, overrideSpecialty?: string) => {
    setLoading(true);
    setError(null);
    try {
      const q = overrideQuery !== undefined ? overrideQuery : query;
      const s = overrideSpecialty !== undefined ? overrideSpecialty : specialty;
      const data = await hospitalAPI.search(q, s === 'General' ? '' : s, radius, stableLat || 28.6139, stableLng || 77.2090, cityName);
      const filtered = data.filter(h => !h.distance || h.distance <= radius);
      setHospitals(filtered.sort((a, b) => b.recommendationScore - a.recommendationScore));
    } catch (err) {
      console.error(err);
      setError('Could not load hospitals. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHospitalSuggestion = (hospitalId: string) => {
    setShowAutocomplete(false);
    navigation.navigate('HospitalDetail', { id: hospitalId });
  };

  const handleSelectSpecialtySuggestion = (specialtyName: string) => {
    setShowAutocomplete(false);
    setSpecialty(specialtyName);
    setQuery('');
  };

  const toggleCompare = useCallback((hospitalId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(hospitalId)) {
        return prev.filter((id) => id !== hospitalId);
      } else {
        if (prev.length >= 3) {
          return prev;
        }
        return [...prev, hospitalId];
      }
    });
  }, []);

  const renderedHospitals = useMemo(() => {
    return hospitals.map((hospital) => (
      <HospitalCard 
        key={hospital.id} 
        hospital={hospital}
        isCompared={compareIds.includes(hospital.id)}
        onToggleCompare={toggleCompare}
        isSaved={savedIds.includes(hospital.id)}
        onToggleSave={handleToggleSave}
        onNavigate={(id) => navigation.navigate('HospitalDetail', { id })}
      />
    ));
  }, [hospitals, compareIds, toggleCompare, navigation]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        
        {/* Sticky Header */}
        <View className="px-5 pt-4 pb-3 bg-white dark:bg-slate-900 border-b border-border z-20">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="h-8 w-8 rounded-full bg-primary/10 items-center justify-center">
              <Navigation size={16} color="#2563EB" />
            </View>
            <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Healthcare Navigation</Text>
          </View>
          <Text className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3">
            Discover facilities precisely matching your medical profile.
          </Text>

          {/* Location Chip */}
          <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full self-start mb-4">
            <MapPin size={12} color="#2563EB" />
            <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-350 ml-1.5 mr-2">
              {cityName || 'Detecting location...'}
            </Text>
            <TouchableOpacity onPress={() => setIsLocationModalOpen(true)}>
              <Text className="text-[11px] font-black text-primary uppercase">Change</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input Container */}
          <View className="relative z-30">
            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-12 px-3">
              <SearchIcon size={18} color="#64748b" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Dispensary Pusa, Apollo..."
                placeholderTextColor="#94a3b8"
                className="flex-1 ml-2 text-sm text-slate-800 dark:text-slate-100 h-full"
                returnKeyType="search"
                onSubmitEditing={() => { setShowAutocomplete(false); fetchHospitals(); }}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); setAutocompleteHospitals([]); setAutocompleteSpecialties([]); setShowAutocomplete(false); fetchHospitals(); }} className="p-1 mr-1">
                  <Text className="text-slate-400 text-xs font-bold">Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => { setShowAutocomplete(false); fetchHospitals(); }} className="bg-primary px-4 py-2 rounded-lg">
                <Text className="text-white text-xs font-black">SEARCH</Text>
              </TouchableOpacity>
            </View>

            {/* Autocomplete Dropdown */}
            {showAutocomplete && (autocompleteHospitals.length > 0 || autocompleteSpecialties.length > 0) && (
              <View className="absolute top-13 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-60">
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
        </View>

        <FlatList
          ListHeaderComponentStyle={{ zIndex: 1000, elevation: 1000 }}
          data={loading || error || hospitals.length === 0 ? [] : hospitals}
          keyExtractor={(item) => item.id}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          scrollEnabled={!isSliding}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          ListHeaderComponent={
            <View style={{ zIndex: 1000, elevation: 1000 }}>
              {/* Filters Section */}
              <View className="bg-white dark:bg-slate-900 border-b border-border p-5 pt-4" style={{ zIndex: 1000, elevation: 1000 }}>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Refine Parameters</Text>
                
                <View className="flex-row gap-3 mb-4" style={{ zIndex: 1000, elevation: 1000 }}>
                  {/* Specialty Dropdown Mock */}
                  <View className="flex-1" style={{ zIndex: showSpecialtyDropdown ? 1000 : 1, elevation: showSpecialtyDropdown ? 1000 : 1 }}>
                    <Text className="text-[10px] font-bold text-slate-600 mb-1.5">Clinical Specialty</Text>
                    <TouchableOpacity 
                      onPress={() => setShowSpecialtyDropdown(!showSpecialtyDropdown)}
                      className="h-10 border border-border rounded-xl px-3 flex-row items-center justify-between bg-slate-50 dark:bg-slate-800"
                    >
                      <View className="flex-row items-center gap-1.5">
                        <Stethoscope size={14} color="#2563EB" />
                        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">{specialty}</Text>
                      </View>
                      <ChevronDown size={14} color="#64748b" />
                    </TouchableOpacity>
                    {/* Dropdown Menu */}
                    {showSpecialtyDropdown && (
                      <View className="absolute top-16 left-0 right-0 bg-white dark:bg-slate-800 border border-border rounded-xl shadow-xl py-1" style={{ zIndex: 1000, elevation: 1000 }}>
                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                        {specialtiesList.map(s => (
                          <TouchableOpacity 
                            key={s} 
                            className="px-4 py-2.5 border-b border-border/50"
                            onPress={() => { setSpecialty(s); setShowSpecialtyDropdown(false); }}
                          >
                            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">{s}</Text>
                          </TouchableOpacity>
                        ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Sort By Dropdown Mock */}
                  <View className="flex-1" style={{ zIndex: showSortDropdown ? 1000 : 1, elevation: showSortDropdown ? 1000 : 1 }}>
                    <Text className="text-[10px] font-bold text-slate-600 mb-1.5">Sort By</Text>
                    <TouchableOpacity 
                      onPress={() => setShowSortDropdown(!showSortDropdown)}
                      className="h-10 border border-border rounded-xl px-3 flex-row items-center justify-between bg-slate-50 dark:bg-slate-800"
                    >
                      <View className="flex-row items-center gap-1.5">
                        <Target size={14} color="#2563EB" />
                        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">{sortBy}</Text>
                      </View>
                      <ChevronDown size={14} color="#64748b" />
                    </TouchableOpacity>
                    {showSortDropdown && (
                      <View className="absolute top-16 left-0 right-0 bg-white dark:bg-slate-800 border border-border rounded-xl shadow-xl py-1" style={{ zIndex: 1000, elevation: 1000 }}>
                        <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
                        {['Match Score', 'Distance', 'Rating'].map(s => (
                          <TouchableOpacity 
                            key={s} 
                            className="px-4 py-2.5 border-b border-border/50"
                            onPress={() => { setSortBy(s); setShowSortDropdown(false); }}
                          >
                            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">{s}</Text>
                          </TouchableOpacity>
                        ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* Radius Interactive Slider */}
                <RadiusSlider 
                  initialRadius={radius} 
                  onSlidingComplete={setRadius} 
                  onSlidingStart={() => setIsSliding(true)}
                  onSlidingEnd={() => setIsSliding(false)}
                />

                {/* Filter Chips */}
                <View className="flex-row gap-2">
                  <TouchableOpacity 
                    onPress={() => setEmergencyOnly(!emergencyOnly)}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${emergencyOnly ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-border'}`}
                  >
                    <Activity size={12} color={emergencyOnly ? '#e11d48' : '#64748b'} />
                    <Text className={`text-[10px] font-bold ${emergencyOnly ? 'text-rose-600' : 'text-slate-500'}`}>24/7 Emergency</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Map Toggle Banner */}
              <TouchableOpacity 
                onPress={() => setShowMap(!showMap)}
                className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 py-2.5 px-5 flex-row justify-between items-center"
              >
                <View className="flex-row items-center gap-2">
                  <MapPin size={14} color="#2563EB" />
                  <Text className="text-xs font-bold text-blue-700 dark:text-blue-400">
                    {showMap ? "Hide Interactive Map" : "View Results on Map"}
                  </Text>
                </View>
                <Text className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{hospitals.length} Found</Text>
              </TouchableOpacity>

              {/* Map Section */}
              {showMap && (
                <View className="w-full h-48 bg-slate-200 border-b border-border">
                  <Map 
                    hospitals={hospitals as any} 
                    selectedHospitalId={hospitals[0]?.id} 
                    userLat={lat || 28} 
                    userLng={lng || 77} 
                    onSelectHospital={(id) => {
                      navigation.navigate('HospitalDetail', { id });
                    }}
                  />
                </View>
              )}

              {/* Results Section Title Banner */}
              {!loading && !error && hospitals.length > 0 && (
                <View className="p-5 pb-2">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospitals Nearby</Text>
                </View>
              )}

              {/* Loading / Error / Empty States block */}
              {(loading || error || hospitals.length === 0) && (
                <View className="p-5 pt-4">
                  {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" className="my-10" />
                  ) : error ? (
                    <View className="bg-rose-50 border border-rose-100 rounded-2xl p-6 items-center">
                      <Text className="text-sm font-bold text-rose-700 text-center mb-2">Search Failed</Text>
                      <Text className="text-xs text-rose-600 text-center mb-4">{error}</Text>
                      <TouchableOpacity onPress={() => fetchHospitals()} className="bg-rose-600 px-6 py-2.5 rounded-full">
                        <Text className="text-white text-xs font-bold">Try Again</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-8 items-center">
                      <Text className="text-2xl mb-2">🏥</Text>
                      <Text className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center mb-1">No hospitals found</Text>
                      <Text className="text-xs text-slate-500 text-center">Try adjusting your specialty or search query.</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View className="px-5 pb-4">
              <HospitalCard 
                hospital={item}
                isCompared={compareIds.includes(item.id)}
                onToggleCompare={toggleCompare}
                isSaved={savedIds.includes(item.id)}
                onToggleSave={handleToggleSave}
                onNavigate={(id) => navigation.navigate('HospitalDetail', { id })}
              />
            </View>
          )}
        />
        {isLocationModalOpen && <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />}
        
        {/* Floating Compare Panel */}
        {compareIds.length >= 2 && (
          <View className="absolute bottom-5 left-5 right-5 bg-primary rounded-2xl shadow-xl p-4 flex-row justify-between items-center z-50">
            <View className="flex-1 pr-3">
              <Text className="text-white text-sm font-black">{compareIds.length} Selected</Text>
              <Text className="text-blue-100 text-[10px] font-medium" numberOfLines={1}>Compare facilities side-by-side</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                navigation.navigate('CompareTab', { ids: compareIds });
              }}
              className="bg-white px-5 py-2.5 rounded-xl shadow-sm"
            >
              <Text className="text-primary text-xs font-black uppercase tracking-wider">Compare Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const HospitalCard = React.memo(({ 
  hospital, 
  isCompared, 
  onToggleCompare, 
  isSaved,
  onToggleSave,
  onNavigate 
}: { 
  hospital: any; 
  isCompared: boolean; 
  onToggleCompare: (id: string) => void; 
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onNavigate: (id: string) => void; 
}) => {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Top Row: Score & Name */}
      <View className="p-4 border-b border-border">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 pr-3">
            <Text className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight mb-1">
              {hospital.name}
            </Text>
            <View className="flex-row items-center gap-1 mb-1">
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              <Text className="text-[11px] font-bold text-slate-600">{hospital.rating.toFixed(1)} / 5.0</Text>
              <Text className="text-[10px] text-slate-400 mx-1">•</Text>
              <Text className="text-[11px] font-bold text-slate-500">{hospital.distance?.toFixed(1) || '2.4'} km away</Text>
            </View>
          </View>
          {/* Score Match Badge */}
          <View className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded-lg items-center">
            <Text className="text-[9px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-0.5">Score</Text>
            <Text className="text-base font-black text-emerald-700 dark:text-emerald-300 leading-none">{hospital.recommendationScore}%</Text>
          </View>
        </View>
        
        <Text className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {hospital.address}
        </Text>
      </View>

      {/* Bottom Actions */}
      <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-2 pl-4">
        <Text className="text-[10px] font-bold text-slate-500 flex-1">
          {hospital.emergencyAvailable ? '🟢 24/7 ER Available' : '🟡 Standard Hours'}
        </Text>
        <View className="flex-row gap-2 items-center">
          <TouchableOpacity 
            onPress={() => onToggleCompare(hospital.id)}
            className={`flex-row items-center h-8 px-2.5 rounded-full border ${isCompared ? 'bg-primary/10 border-primary' : 'bg-white dark:bg-slate-700 border-border'}`}
          >
            <CheckSquare size={12} color={isCompared ? '#2563EB' : '#64748b'} />
            <Text className={`text-[10px] font-bold ml-1 ${isCompared ? 'text-primary' : 'text-slate-500 dark:text-slate-350'}`}>Compare</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onToggleSave(hospital.id)}
            className={`h-8 w-8 rounded-full items-center justify-center border ${isSaved ? 'bg-primary/10 border-primary' : 'bg-white dark:bg-slate-700 border-border'}`}
          >
            <Bookmark size={14} color={isSaved ? "#2563EB" : "#64748b"} fill={isSaved ? "#2563EB" : "none"} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onNavigate(hospital.id)}
            className="bg-primary px-4 py-1.5 rounded-full justify-center"
          >
            <Text className="text-[10px] font-black text-white tracking-wide">VIEW</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

export default SearchScreen;

const RadiusSlider = React.memo(({ 
  initialRadius, 
  onSlidingComplete,
  onSlidingStart,
  onSlidingEnd
}: { 
  initialRadius: number; 
  onSlidingComplete: (value: number) => void;
  onSlidingStart?: () => void;
  onSlidingEnd?: () => void;
}) => {
  const [visualRadius, setVisualRadius] = useState(initialRadius);
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderWidthRef = useRef(0);
  const startRadiusRef = useRef(initialRadius);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        onSlidingStart?.();
        const width = sliderWidthRef.current;
        if (width > 0) {
          const touchX = evt.nativeEvent.locationX;
          const initial = Math.max(1, Math.min(50, Math.round((touchX / width) * 50)));
          startRadiusRef.current = initial;
          setVisualRadius(initial);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const width = sliderWidthRef.current;
        if (width > 0) {
          const deltaRadius = (gestureState.dx / width) * 50;
          const newRadius = Math.max(1, Math.min(50, Math.round(startRadiusRef.current + deltaRadius)));
          setVisualRadius(newRadius);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        onSlidingEnd?.();
        const width = sliderWidthRef.current;
        if (width > 0) {
          const deltaRadius = (gestureState.dx / width) * 50;
          const newRadius = Math.max(1, Math.min(50, Math.round(startRadiusRef.current + deltaRadius)));
          setVisualRadius(newRadius);
          onSlidingComplete(newRadius);
        }
      },
      onPanResponderTerminate: () => {
        onSlidingEnd?.();
      }
    })
  ).current;

  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-2">
        <Text className="text-[10px] font-bold text-slate-600">Max Radius (km)</Text>
        <Text className="text-[10px] font-black text-primary">{visualRadius} km</Text>
      </View>
      <View 
        className="h-8 justify-center relative" 
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          setSliderWidth(width);
          sliderWidthRef.current = width;
        }}
        {...panResponder.panHandlers}
      >
        <View className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full w-full absolute" pointerEvents="none" />
        <View className="h-1.5 bg-primary rounded-full absolute" pointerEvents="none" style={{ width: `${(visualRadius/50)*100}%` }} />
        <View className="h-4 w-4 bg-white border-2 border-primary rounded-full absolute shadow-sm" pointerEvents="none" style={{ left: `${(visualRadius/50)*100}%`, marginLeft: -8 }} />
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="text-[8px] font-bold text-slate-400">1km</Text>
        <Text className="text-[8px] font-bold text-slate-400">50km</Text>
      </View>
    </View>
  );
});
