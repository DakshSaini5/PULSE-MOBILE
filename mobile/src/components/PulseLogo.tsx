import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface PulseLogoProps {
 size?: number;
 variant?: 'icon' | 'horizontal' | 'vertical';
 className?: string;
 showTagline?: boolean;
}

export const PulseLogo: React.FC<PulseLogoProps> = ({
 size = 40,
 variant = 'horizontal',
 className = '',
 showTagline = true,
}) => {
 const iconMarkup = (
 <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
 <Path
 d="M50,95 C43,83 20,53 20,38 C20,21.4 33.4,8 50,8 C66.6,8 80,21.4 80,38 C80,53 57,83 50,95 Z"
 fill="#2563EB"
 />
 <Circle cx="50" cy="38" r="18" fill="white" />
 <Path
 d="M37,38 L43,38 L44,34 L46,40 L48.5,25 L51,51 L53,32 L56,40 L57,38 L63,38"
 stroke="#2563EB"
 strokeWidth="3.2"
 strokeLinecap="round"
 strokeLinejoin="round"
 fill="none"
 />
 </Svg>
 );

 if (variant === 'icon') {
 return <View className={className}>{iconMarkup}</View>;
 }

 if (variant === 'vertical') {
 return (
 <View className={`flex flex-col items-center gap-3 ${className}`}>
 {iconMarkup}
 <View className="flex flex-col items-center mt-1">
 <Text className="font-extrabold text-foreground lowercase leading-none" style={{ fontSize: size * 0.65 }}>
 pulse
 </Text>
 {showTagline && (
 <Text className="text-muted-foreground font-medium mt-2" style={{ fontSize: 11 }}>
 Intelligent Healthcare
 </Text>
 )}
 </View>
 </View>
 );
 }

 // Horizontal variant (default)
 return (
 <View className={`flex flex-row items-center gap-3 ${className}`}>
 {iconMarkup}
 <View className="flex flex-col justify-center">
 <Text className="font-extrabold text-foreground lowercase" style={{ fontSize: size * 0.6, lineHeight: size * 0.6 }}>
 pulse
 </Text>
 {showTagline && (
 <Text className="text-muted-foreground font-medium mt-1.5" style={{ fontSize: size * 0.17 }}>
 Intelligent Healthcare
 </Text>
 )}
 </View>
 </View>
 );
};
