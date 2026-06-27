import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '../../utils/utils';

// Note: A full interactive Slider requires a pan gesture handler or @react-native-community/slider. 
// This acts as a visual representation.
export interface SliderProps extends ViewProps {
 value?: number;
 min?: number;
 max?: number;
}

const Slider = React.forwardRef<View, SliderProps>(({ className, value = 50, min = 0, max = 100, ...props }, ref) => {
 const percentage = ((value - min) / (max - min)) * 100;
 
 return (
 <View ref={ref} className={cn("relative flex w-full h-4 justify-center", className)} {...props}>
 <View className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
 <View 
 className="absolute h-full bg-primary" 
 style={{ width: `${percentage}%` }} 
 />
 </View>
 <View 
 className="absolute h-4 w-4 rounded-full border border-primary bg-background shadow"
 style={{ left: `${percentage}%`, marginLeft: -8 }}
 />
 </View>
 );
});
Slider.displayName = "Slider";
export { Slider };
