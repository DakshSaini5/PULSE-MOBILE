import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Info, Shield, Mail, FileText, Heart } from 'lucide-react-native';

const BaseInfoScreen = ({ title, icon: Icon, children }: any) => {
 const navigation = useNavigation();
 return (
 <SafeAreaView className="flex-1 bg-background">
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
 <BaseInfoScreen title="Privacy & Security" icon={Shield}>
 <View className="bg-blue-50 border border-blue-200 p-4 rounded-2xl mb-6">
   <Text className="text-blue-800 font-bold mb-1">HIPAA Compliant App</Text>
   <Text className="text-blue-700 text-xs leading-relaxed">
     Pulse strictly adheres to the Health Insurance Portability and Accountability Act (HIPAA) standards to ensure your protected health information (PHI) remains secure and confidential at all times.
   </Text>
 </View>

 <Text className="text-sm font-bold text-slate-900 mb-1">1. End-to-End Encryption</Text>
 <Text className="text-xs text-slate-600 leading-relaxed mb-4">
 All data in transit between your device and our secure servers is protected using military-grade TLS 1.3 encryption. At rest, your medical records, OCR prescriptions, and lab reports are encrypted using AES-256 standards.
 </Text>
 
 <Text className="text-sm font-bold text-slate-900 mb-1">2. Sandboxed AI Processing</Text>
 <Text className="text-xs text-slate-600 leading-relaxed mb-4">
 When you upload a document for OCR extraction, it is processed in a secure, isolated sandbox. Once the data points (e.g., biomarkers, medication names) are extracted, the original image file is immediately purged from our servers unless you explicitly choose to back it up in your vault.
 </Text>

 <Text className="text-sm font-bold text-slate-900 mb-1">3. Your Data Rights</Text>
 <Text className="text-xs text-slate-600 leading-relaxed mb-4">
 Under HIPAA guidelines, you have total control over your PHI. You maintain the right to:
 • Export your entire health history at any time.
 • Request immediate permanent deletion of all stored records.
 • Audit access logs regarding your data.
 </Text>

 <Text className="text-sm font-bold text-slate-900 mb-1">4. Third-Party Sharing</Text>
 <Text className="text-xs text-slate-600 leading-relaxed mb-4">
 We absolutely do not sell your personal or medical data to advertisers, insurance companies, or any other third parties. Data is only shared with verified healthcare providers when you explicitly generate an access key.
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
