import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing,
  withDelay
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const Blob = ({ color, size, initialX, initialY, duration, delay }: any) => {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(initialX + 50, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialX - 50, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialX, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // infinite
      true
    ));

    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(initialY + 50, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialY - 50, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        withTiming(initialY, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));

    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.2, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

export const AnimatedBackground = () => {
  return (
    <View style={styles.container}>
      {/* Primary brand color blob */}
      <Blob 
        color="rgba(37, 99, 235, 0.15)" // primary blue
        size={width * 0.8}
        initialX={-width * 0.2}
        initialY={-height * 0.1}
        duration={8000}
        delay={0}
      />
      {/* Secondary accent blob */}
      <Blob 
        color="rgba(56, 189, 248, 0.15)" // sky blue
        size={width * 0.6}
        initialX={width * 0.5}
        initialY={height * 0.2}
        duration={10000}
        delay={1000}
      />
      {/* Bottom subtle blob */}
      <Blob 
        color="rgba(147, 197, 253, 0.15)" // light blue
        size={width * 0.9}
        initialX={width * 0.1}
        initialY={height * 0.6}
        duration={12000}
        delay={2000}
      />
      
      {/* Glassmorphism overlay */}
      <View style={styles.glassOverlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC', // slate-50
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    opacity: 0.8,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  }
});
