import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { useRoute, useNavigation } from '@react-navigation/native';
import { hospitalAPI, Hospital } from '../services/api';
import { ArrowLeft, MapPin, Phone, Globe, Clock, Star, Activity, AlertCircle, Heart, User } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useUserLocation } from '../context/LocationContext';
import { formatIndianPhoneNumber, getDialerHref } from '../utils/phoneFormatter';

export const HospitalDetailScreen = () => {
 const route = useRoute<any>();
 const navigation = useNavigation<any>();
 const { id } = route.params || {};
 const { user } = useAuth();
 const { latitude: lat, longitude: lng } = useUserLocation();
 
 const [hospital, setHospital] = useState<Hospital | null>(null);
 const [loading, setLoading] = useState(true);
 const [reviewRating, setReviewRating] = useState(5);
 const [reviewText, setReviewText] = useState('');
 const [reviews, setReviews] = useState<any[]>([]);
 const [submittingReview, setSubmittingReview] = useState(false);
 const [totalReviews, setTotalReviews] = useState(0);

 const fetchDetails = async () => {
 if (!id) return;
 setLoading(true);
 try {
 const [hospitalData, reviewsData] = await Promise.all([
 hospitalAPI.getById(id, lat, lng),
 hospitalAPI.getReviews(id)
 ]);
 setHospital(hospitalData);
 setReviews(reviewsData?.reviews || []);
 setTotalReviews(reviewsData?.pagination?.total || 0);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchDetails();
 }, [id, lat, lng]);

  const handleAddReview = async () => {
    if (!id) return;
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to submit a review.');
      return;
    }
    if (!reviewText.trim()) {
      Alert.alert('Invalid Review', 'Review text cannot be empty.');
      return;
    }
    if (reviewText.trim().length < 10) {
      Alert.alert('Invalid Review', 'Your review must be at least 10 characters long.');
      return;
    }
    
    setSubmittingReview(true);
    try {
      const newRev = await hospitalAPI.postReview(id, reviewRating, reviewText);
      setReviews(prev => [newRev, ...prev]);
      setTotalReviews(prev => prev + 1);
      setReviewText('');
      setReviewRating(5);
      fetchDetails();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Could not submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

 if (loading) {
 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background justify-center items-center">
 <ActivityIndicator size="large" color="#1E60D5" />
 </SafeAreaView>
 );
 }

 if (!hospital) {
 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background justify-center items-center px-6">
 <AlertCircle size={48} color="#ef4444" className="mb-4" />
 <Text className="text-lg font-bold text-foreground text-center">Hospital Not Found</Text>
 <Text className="text-xs text-muted-foreground text-center mt-2">The hospital record does not exist or has been removed.</Text>
 <TouchableOpacity onPress={() => navigation.goBack()} className="mt-6 px-6 py-3 bg-primary rounded-xl">
 <Text className="text-white text-xs font-semibold">Back to Maps</Text>
 </TouchableOpacity>
 </SafeAreaView>
 );
 }

 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
 <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1">
 
 <View className="px-5 pt-4 pb-2">
 <TouchableOpacity 
    onPress={() => navigation.goBack()} 
    className="flex-row items-center gap-1 mb-4"
    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
  >
 <ArrowLeft size={16} color="#64748b" />
 <Text className="text-muted-foreground text-xs font-semibold">Back</Text>
 </TouchableOpacity>

 <Text className="text-2xl font-extrabold text-foreground">{hospital.name}</Text>
 <View className="flex-row items-center gap-1 mt-2">
 <MapPin size={14} color="#64748b" />
 <Text className="text-xs text-muted-foreground flex-1">{hospital.address}</Text>
 </View>

 <View className="flex-row flex-wrap items-center gap-2 mt-4">
 <View className="flex-row items-center bg-warning/10 px-2 py-1 rounded-lg border border-warning/20">
 <Star size={12} color="#f59e0b" fill="#f59e0b" />
 <Text className="text-[10px] text-warning font-bold ml-1">{hospital.rating.toFixed(1)}</Text>
 </View>
 {hospital.emergencyAvailable && (
 <View className="bg-danger/10 border border-danger/20 px-2 py-1 rounded-lg">
 <Text className="text-[9px] text-danger font-bold uppercase tracking-wider">24/7 ER Ready</Text>
 </View>
 )}
 <View className="bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg">
 <Text className="text-[9px] text-primary font-bold uppercase">Match: {hospital.recommendationScore}%</Text>
 </View>
 </View>
 </View>

 {/* Contact info */}
 <View className="px-5 mt-4">
 <View className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-5 space-y-4 ">
 <Text className="text-xs font-bold text-foreground uppercase tracking-wider">Facility Contact</Text>
 
 <View className="flex-row items-start gap-3">
 <Clock size={16} color="#1E60D5" className="mt-0.5" />
 <View className="flex-1">
 <Text className="text-[10px] text-muted-foreground font-bold uppercase">Opening Hours</Text>
 <Text className="text-xs text-foreground font-medium mt-0.5">{hospital.workingHours}</Text>
 </View>
 </View>

  <View className="flex-row items-start gap-3">
  <Phone size={16} color="#1E60D5" className="mt-0.5" />
  <View className="flex-1">
  <Text className="text-[10px] text-muted-foreground font-bold uppercase">Helpline</Text>
  {hospital.phone ? (
  <TouchableOpacity onPress={() => Linking.openURL(getDialerHref(hospital.phone, hospital.address))}>
  <Text className="text-xs text-primary font-bold mt-0.5">
  {formatIndianPhoneNumber(hospital.phone, hospital.address)}
  </Text>
  </TouchableOpacity>
  ) : (
  <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/search?q=phone+number+for+${encodeURIComponent(hospital.name || '')}+${encodeURIComponent(hospital.address || '')}`)}>
  <Text className="text-xs text-primary font-semibold mt-0.5">
  Search Helpline on Google
  </Text>
  </TouchableOpacity>
  )}
  </View>
  </View>
 </View>
 </View>

 {/* Departments */}
 <View className="px-5 mt-6">
 <Text className="text-sm font-bold text-foreground mb-3">Clinical Specialties</Text>
 <View className="space-y-3">
 {hospital.specialties?.map((spec: any, index: number) => (
 <View key={index} className="bg-slate-50 dark:bg-slate-800 border border-border rounded-2xl p-4">
 <Text className="text-xs font-bold text-primary">{spec.specialty.name}</Text>
 <Text className="text-[10px] text-muted-foreground mt-1">{spec.specialty.description}</Text>
  <View className="mt-3 pt-3 border-t border-border flex-row justify-between items-center">
  <Text className="text-[10px] text-muted-foreground font-semibold">Consulting Hours</Text>
  {(!spec.opdTimings || spec.opdTimings.includes('09:00 AM - 05:00 PM') || spec.opdTimings.includes('09:00 AM - 09:00 PM')) ? (
    <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(`${hospital.name || ''} opd timings`)}`)}>
      <Text className="text-[10px] text-primary font-extrabold underline">Contact Facility</Text>
    </TouchableOpacity>
  ) : (
    <Text className="text-[10px] text-foreground font-bold">{spec.opdTimings}</Text>
  )}
  </View>
  <View className="mt-1.5 flex-row justify-between items-center">
  <Text className="text-[10px] text-muted-foreground font-semibold">Avg. Fee</Text>
  {spec.averageCost > 0 ? (
    <Text className="text-[10px] text-foreground font-bold">₹{spec.averageCost}</Text>
  ) : (
    <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(`${hospital.name || ''} consultation fees`)}`)}>
      <Text className="text-[10px] text-primary font-extrabold underline">Contact Hospital</Text>
    </TouchableOpacity>
  )}
  </View>
 </View>
 ))}
 </View>
 </View>

 {/* Reviews */}
 <View className="px-5 mt-6">
 <Text className="text-sm font-bold text-foreground mb-3">Patient Reviews ({totalReviews})</Text>
 
 <View className="bg-slate-50 dark:bg-slate-800 border border-border rounded-2xl p-4 mb-4">
 <Text className="text-xs font-semibold text-foreground mb-2">Write a Review</Text>
  <View className="flex-row gap-2 mb-3">
  {[1, 2, 3, 4, 5].map(num => (
  <TouchableOpacity 
    key={num} 
    onPress={() => setReviewRating(num)}
    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    className="p-1"
  >
  <Star size={24} color={num <= reviewRating ? "#f59e0b" : "#94a3b8"} fill={num <= reviewRating ? "#f59e0b" : "transparent"} />
  </TouchableOpacity>
  ))}
  </View>
 <TextInput
 value={reviewText}
 onChangeText={setReviewText}
 placeholder="Share your experience (min 10 chars)..."
 placeholderTextColor="#94a3b8"
 multiline
 numberOfLines={3}
 className="w-full bg-white dark:bg-slate-900 border border-border rounded-xl p-3 text-xs text-foreground text-left align-top min-h-[80px]"
 />
 <TouchableOpacity onPress={handleAddReview} disabled={submittingReview} className="mt-3 bg-primary py-2.5 rounded-xl items-center">
 <Text className="text-white text-xs font-bold">{submittingReview ? 'Submitting...' : 'Submit Review'}</Text>
 </TouchableOpacity>
 </View>

 <View className="space-y-3">
 {reviews.map(rev => (
 <View key={rev.id} className="p-4 border border-border rounded-2xl bg-white dark:bg-slate-900 ">
 <View className="flex-row justify-between items-center mb-2">
 <View className="flex-row items-center gap-2">
 <View className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center border border-border">
 <User size={12} color="#64748b" />
 </View>
 <Text className="text-xs font-semibold text-foreground">{rev.user.name}</Text>
 </View>
 <Text className="text-[9px] text-muted-foreground">{new Date(rev.createdAt).toLocaleDateString()}</Text>
 </View>
 <View className="flex-row gap-0.5 mb-2">
 {[1, 2, 3, 4, 5].map(n => (
 <Star key={n} size={10} color={n <= rev.rating ? "#f59e0b" : "#cbd5e1"} fill={n <= rev.rating ? "#f59e0b" : "transparent"} />
 ))}
 </View>
 <Text className="text-[11px] text-muted-foreground">{rev.reviewText}</Text>
 </View>
 ))}
 </View>
 </View>

 </ScrollView>
 </SafeAreaView>
 );
};

export default HospitalDetailScreen;



