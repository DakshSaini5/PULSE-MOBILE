import React, { useState, useEffect, useRef } from 'react';
import { 
  TouchableOpacity, 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  Animated, 
  Linking,
  Dimensions
} from 'react-native';
import { AlertCircle, Phone, X, Heart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PanicButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [breatheText, setBreatheText] = useState('Breathe In');
  const [timeLeft, setTimeLeft] = useState(4);
  const breatheAnimation = useRef(new Animated.Value(1)).current;

  // Start breathing animation loop when modal opens
  useEffect(() => {
    let animationLoop: Animated.CompositeAnimation;
    let textInterval: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;
    
    if (modalVisible) {
      const breatheIn = Animated.timing(breatheAnimation, {
        toValue: 1.5,
        duration: 4000,
        useNativeDriver: true,
      });
      
      const breatheOut = Animated.timing(breatheAnimation, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      });

      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnimation, { toValue: 1, duration: 0, useNativeDriver: true }), // reset
          breatheIn,
          breatheOut
        ])
      );
      
      animationLoop.start();

      // Text changing logic every 4 seconds
      textInterval = setInterval(() => {
        setBreatheText(prev => prev === 'Breathe In' ? 'Breathe Out' : 'Breathe In');
        setTimeLeft(4); // Reset countdown
      }, 4000);

      // Countdown logic every 1 second
      countdownInterval = setInterval(() => {
        setTimeLeft(prev => (prev > 1 ? prev - 1 : 4));
      }, 1000);

      return () => {
        animationLoop.stop();
        clearInterval(textInterval);
        clearInterval(countdownInterval);
        setBreatheText('Breathe In');
        setTimeLeft(4);
        breatheAnimation.setValue(1);
      };
    }
  }, [modalVisible, breatheAnimation]);

  const handleCallEmergency = () => {
    Linking.openURL('tel:911');
  };

  const handleCallContact = () => {
    // Hardcoded for UI demonstration based on Profile
    Linking.openURL('tel:+15551234567');
  };

  return (
    <>
      <View 
        className="absolute self-center" 
        style={{ bottom: Math.max(24, insets.bottom + 16), zIndex: 50 }}
      >
        <TouchableOpacity
          className="bg-red-600 px-6 py-3 rounded-full flex-row items-center justify-center shadow-xl border-4 border-red-200/50"
          style={styles.shadow}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <AlertCircle color="#fff" size={24} />
          <Text className="text-white font-black text-lg ml-2 tracking-wide uppercase">Panic</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-slate-900/95 justify-end">
          <View className="flex-1 items-center justify-center">
            
            {/* Breathing Animation */}
            <View className="items-center justify-center w-full h-64 relative">
              <Animated.View 
                style={{
                  transform: [{ scale: breatheAnimation }],
                  width: 150,
                  height: 150,
                  borderRadius: 75,
                  backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500 with opacity
                  position: 'absolute',
                  borderWidth: 2,
                  borderColor: 'rgba(59, 130, 246, 0.5)'
                }}
              />
              <Animated.View 
                style={{
                  transform: [{ scale: breatheAnimation }],
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: 'rgba(59, 130, 246, 0.4)',
                  position: 'absolute'
                }}
              />
              <Heart color="#3B82F6" size={40} />
            </View>
            
            <Text className="text-white text-3xl font-black mt-8 text-center px-6">
              {breatheText}... {timeLeft}s
            </Text>
            <Text className="text-blue-200 text-base font-medium mt-3 text-center px-8 opacity-80">
              Focus on the circle. You are safe. Take slow, deep breaths.
            </Text>

          </View>

          {/* Action Buttons */}
          <View className="bg-white rounded-t-[40px] px-6 pt-8 pb-12 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-black text-slate-900">Emergency Actions</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={handleCallEmergency}
              className="bg-red-600 rounded-2xl flex-row items-center p-4 mb-4 shadow-sm"
              activeOpacity={0.8}
            >
              <View className="bg-white/20 p-3 rounded-full mr-4">
                <Phone color="#fff" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-black text-xl mb-0.5">Call Emergency</Text>
                <Text className="text-red-100 text-sm font-medium">Dial local emergency services (911)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleCallContact}
              className="bg-blue-600 rounded-2xl flex-row items-center p-4 shadow-sm"
              activeOpacity={0.8}
            >
              <View className="bg-white/20 p-3 rounded-full mr-4">
                <Phone color="#fff" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-black text-xl mb-0.5">Call Jane Doe</Text>
                <Text className="text-blue-100 text-sm font-medium">Emergency Contact • Wife</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
