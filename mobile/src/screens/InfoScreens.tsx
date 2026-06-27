import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Info, Shield, Mail, FileText, Heart } from 'lucide-react-native';

const BaseInfoScreen = ({ title, icon: Icon, children }: any) => {
 const navigation = useNavigation();
 return (
 <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
 <View className="px-5 py-4 border-b border-border bg-white dark:bg-slate-900 flex-row items-center ">
 <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
 <ArrowLeft size={20} color="#64748b" />
 </TouchableOpacity>
 <Text className="text-lg font-extrabold text-foreground">{title}</Text>
 </View>
 <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
 <View className="items-center mb-6 mt-4">
 <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-3">
 <Icon size={32} color="#1E60D5" />
 </View>
 <Text className="text-xl font-extrabold text-foreground">{title}</Text>
 </View>
 <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border ">
 {children}
 </View>
 </ScrollView>
 </SafeAreaView>
 );
};

export const AboutScreen = () => (
 <BaseInfoScreen title="About Pulse" icon={Info}>
 <Text className="text-sm font-bold text-foreground mb-2 flex-row items-center"><Heart size={14} color="#ef4444" /> The Pulse Mission</Text>
 <Text className="text-xs text-muted-foreground leading-relaxed mb-4">
 Pulse was built with a singular vision: to democratize access to critical health data and emergency services. We leverage cutting-edge AI to instantly decode complex medical jargon and organize your health life.
 </Text>
 <Text className="text-sm font-bold text-foreground mb-2">Core Features</Text>
 <View className="space-y-2">
 <Text className="text-xs text-muted-foreground">• One-Tap Emergency SOS & Direct Dialing</Text>
 <Text className="text-xs text-muted-foreground">• OCR Prescription & Lab Report extraction</Text>
 <Text className="text-xs text-muted-foreground">• Geo-fenced clinical facility discovery</Text>
 <Text className="text-xs text-muted-foreground">• Automated AI drug interaction scanning</Text>
 </View>
 <Text className="text-[10px] text-center text-muted-foreground mt-8">Version 1.0.0 (Native)</Text>
 </BaseInfoScreen>
);

export const ContactScreen = () => (
 <BaseInfoScreen title="Contact Us" icon={Mail}>
 <Text className="text-sm font-bold text-foreground mb-2">We're here to help.</Text>
 <Text className="text-xs text-muted-foreground leading-relaxed mb-6">
 If you are experiencing a medical emergency, please call your local emergency services (e.g. 911 or 112) immediately. For app support, contact our team below.
 </Text>
 
 <View className="space-y-4">
 <View className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
 <Text className="text-[10px] font-bold text-primary uppercase mb-1">Support Email</Text>
 <TouchableOpacity onPress={() => Linking.openURL('mailto:support@pulseapp.com')}>
 <Text className="text-sm font-extrabold text-foreground">support@pulseapp.com</Text>
 </TouchableOpacity>
 </View>
 <View className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
 <Text className="text-[10px] font-bold text-primary uppercase mb-1">Business Inquiries</Text>
 <TouchableOpacity onPress={() => Linking.openURL('mailto:partners@pulseapp.com')}>
 <Text className="text-sm font-extrabold text-foreground">partners@pulseapp.com</Text>
 </TouchableOpacity>
 </View>
 </View>
 </BaseInfoScreen>
);

export const PrivacyScreen = () => (
 <BaseInfoScreen title="Privacy Policy" icon={Shield}>
 <Text className="text-xs font-bold text-foreground mb-1">1. Data Collection</Text>
 <Text className="text-xs text-muted-foreground leading-relaxed mb-4">
 Pulse collects strictly necessary data to provide medical analysis and location-based discovery. We do not sell your personal data.
 </Text>
 
 <Text className="text-xs font-bold text-foreground mb-1">2. Medical Documents</Text>
 <Text className="text-xs text-muted-foreground leading-relaxed mb-4">
 Any prescriptions or lab reports uploaded are processed in a secure sandboxed environment. If "Auto-Purge" is enabled in your settings, raw files are instantly deleted from our servers post-analysis.
 </Text>

 <Text className="text-xs font-bold text-foreground mb-1">3. Location Services</Text>
 <Text className="text-xs text-muted-foreground leading-relaxed mb-4">
 We use your location only while the app is active to locate nearby hospitals and map clinical facilities. Coordinates are not tracked in the background.
 </Text>
 </BaseInfoScreen>
);

export const TermsScreen = () => (
 <BaseInfoScreen title="Terms of Service" icon={FileText}>
 <Text className="text-sm font-bold text-danger mb-3">MEDICAL DISCLAIMER</Text>
 <Text className="text-xs text-muted-foreground leading-relaxed mb-4">
 Pulse AI analysis is for informational purposes only and DOES NOT constitute professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
 </Text>
 
 <Text className="text-xs font-bold text-foreground mb-1">User Conduct</Text>
 <Text className="text-xs text-muted-foreground leading-relaxed mb-4">
 You agree to use Pulse responsibly and not upload any malicious code or exploit the AI backend.
 </Text>

 <Text className="text-xs font-bold text-foreground mb-1">Service Availability</Text>
 <Text className="text-xs text-muted-foreground leading-relaxed mb-4">
 Pulse strives for 99.9% uptime, but we do not guarantee the app will be completely free of errors or disruptions, especially during third-party AI provider outages.
 </Text>
 </BaseInfoScreen>
);



