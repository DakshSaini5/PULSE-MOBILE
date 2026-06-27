import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, Linking, Vibration, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check, PhoneCall } from 'lucide-react-native';
import { SafeScreen as SafeAreaView } from '../components/SafeScreen';
import { emergencyAPI, EmergencyContact } from '../services/api';

// ─── Breathing Cycle: 4s IN · 3s HOLD · 6s OUT = 13-second loop ─────────────
const PHASES: { key: 'IN' | 'HOLD' | 'OUT'; duration: number; label: string; sub: string }[] = [
  { key: 'IN',   duration: 4, label: 'Breathe In...',   sub: 'Let your chest expand and take a deep breath.' },
  { key: 'HOLD', duration: 3, label: 'Hold...',         sub: 'Keep the air inside and try to relax your shoulders.' },
  { key: 'OUT',  duration: 6, label: 'Breathe Out...',  sub: 'Slowly and gently let the air out of your lungs.' },
];

const HELPER_SENTENCES = [
  "This feeling will pass. You have survived every panic attack before this one.",
  "You are safe. These sensations cannot harm you.",
  "Focus only on this screen. Nothing else right now.",
  "Slowly relax your shoulders and let your jaw loosen.",
];

export const PanicScreen = () => {
  const navigation = useNavigation<any>();
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PHASES[0].duration);
  const [cycle, setCycle] = useState(1);
  const [isOkay, setIsOkay] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const currentPhase = PHASES[phaseIdx];

  // Fetch emergency contacts
  useEffect(() => {
    emergencyAPI.getContacts()
      .then(res => setContacts(res))
      .catch(err => console.log('[Panic] Failed to fetch emergency contacts:', err));
  }, []);

  // ── 13-second breathing animation loop ──────────────────────────────────────
  const startAnimation = useCallback(() => {
    animRef.current?.stop();
    const anim = Animated.loop(
      Animated.sequence([
        // Inhale 4s → expand
        Animated.timing(scaleAnim, { toValue: 1.8, duration: 4000, useNativeDriver: true }),
        // Hold 3s → stay
        Animated.timing(scaleAnim, { toValue: 1.8, duration: 3000, useNativeDriver: true }),
        // Exhale 6s → contract
        Animated.timing(scaleAnim, { toValue: 1.0, duration: 6000, useNativeDriver: true }),
      ])
    );
    animRef.current = anim;
    anim.start();
  }, [scaleAnim]);

  useEffect(() => {
    if (isOkay) {
      animRef.current?.stop();
      return;
    }
    startAnimation();
    return () => { animRef.current?.stop(); };
  }, [isOkay, startAnimation]);

  // ── Countdown timer with haptic tick at each phase boundary ─────────────────
  useEffect(() => {
    if (isOkay) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev > 1) return prev - 1;

        // Phase boundary — haptic tick
        Vibration.vibrate(50);

        setPhaseIdx(currIdx => {
          const nextIdx = (currIdx + 1) % PHASES.length;
          if (nextIdx === 0) setCycle(c => c + 1); // completed full 13s loop
          setTimeLeft(PHASES[nextIdx].duration);
          return nextIdx;
        });

        return prev; // will be overridden by setTimeLeft above on next render
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOkay]);

  const handleCallEmergency = () => {
    Vibration.vibrate([0, 100, 50, 100]);
    Linking.openURL('tel:108');
  };

  // ── "I'm Okay" resolved screen ───────────────────────────────────────────────
  if (isOkay) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <View className="items-center justify-center w-full max-w-sm px-4">
          <View className="bg-emerald-100 p-6 rounded-full mb-6">
            <Check size={48} color="#10b981" strokeWidth={3} />
          </View>
          <Text className="text-3xl font-black text-slate-800 mb-4 text-center">Glad you are safe!</Text>
          <Text className="text-sm text-slate-600 text-center mb-10 leading-relaxed">
            Take care of yourself, sip some warm water, and rest. If symptoms persist or feel critical, please consult a medical provider.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('HomeTab')}
            className="w-full bg-slate-900 h-14 rounded-full flex-row items-center justify-center px-10"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-white text-base font-bold">Close Guidance</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main breathing screen ───────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 items-center justify-between px-6 pb-8 pt-10">

        {/* Top Header */}
        <View className="items-center">
          <View className="bg-blue-100 px-4 py-1.5 rounded-full mb-4">
            <Text className="text-blue-700 text-xs font-bold tracking-widest uppercase">
              Calming Exercise • Cycle {cycle}
            </Text>
          </View>
          <Text className="text-3xl font-black text-slate-800 tracking-tight">You're Safe</Text>
          <Text className="text-sm text-slate-500 mt-2 text-center">
            Follow the circle — 4s inhale · 3s hold · 6s exhale (13-second loop)
          </Text>
        </View>

        {/* Breathing Animation */}
        <View className="items-center justify-center h-64 w-full my-8">
          <Animated.View style={[styles.breathingCircle, { transform: [{ scale: scaleAnim }] }]} />
          <View className="absolute items-center justify-center z-10">
            <Text className="text-5xl font-black text-white">{timeLeft}s</Text>
          </View>
        </View>

        {/* Dynamic Phase Text */}
        <View className="items-center h-24 w-full">
          <Text className="text-2xl font-black text-slate-800 mb-2">{currentPhase.label}</Text>
          <Text className="text-base text-slate-600 text-center px-4">{currentPhase.sub}</Text>
        </View>

        {/* Helper Sentence */}
        <View className="w-full h-16 justify-center">
          <Text className="text-sm text-slate-500 font-medium italic text-center px-6">
            "{HELPER_SENTENCES[(cycle - 1) % HELPER_SENTENCES.length]}"
          </Text>
        </View>

        {/* Bottom Actions */}
        <View className="w-full gap-3 mt-auto">

          {/* Emergency contacts from profile */}
          {contacts.map(c => (
            <TouchableOpacity
              key={c.id}
              onPress={() => {
                Vibration.vibrate(50);
                Linking.openURL(`tel:${c.phoneNumber}`);
              }}
              className="w-full bg-rose-50 h-12 rounded-full border border-rose-200 flex-row items-center justify-center gap-2"
              hitSlop={{ top: 8, bottom: 8 }}
            >
              <PhoneCall size={16} color="#e11d48" strokeWidth={2.5} />
              <Text className="text-rose-600 text-sm font-bold">Call {c.name}</Text>
            </TouchableOpacity>
          ))}

          {/* National Emergency: 108 via Linking.openURL */}
          <TouchableOpacity
            onPress={handleCallEmergency}
            className="w-full bg-rose-600 h-14 rounded-full flex-row items-center justify-center gap-2 shadow-sm"
            hitSlop={{ top: 8, bottom: 8 }}
          >
            <PhoneCall size={18} color="white" strokeWidth={2.5} />
            <Text className="text-white text-base font-bold">Call Emergency Services (108)</Text>
          </TouchableOpacity>

          {/* I'm Okay */}
          <TouchableOpacity
            onPress={() => setIsOkay(true)}
            className="w-full bg-blue-600 h-14 rounded-full flex-row items-center justify-center gap-2 shadow-sm mt-2"
            hitSlop={{ top: 8, bottom: 8 }}
          >
            <Check size={20} color="white" strokeWidth={3} />
            <Text className="text-white text-base font-bold">Yes, I am okay</Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  breathingCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3b82f6',
    position: 'absolute',
    opacity: 0.85,
  },
});

export default PanicScreen;
