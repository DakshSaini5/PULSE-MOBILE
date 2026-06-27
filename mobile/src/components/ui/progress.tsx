import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '../../utils/utils';

export interface ProgressProps extends ViewProps {
 value?: number; // 0-100
 label?: string;
}

const Progress = React.forwardRef<View, ProgressProps>(({ className, value = 0, label, ...props }, ref) => {
 return (
 <View ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
 {label && <Text className="text-sm font-medium text-foreground">{label}</Text>}
 <View className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
 <View 
 className="h-full bg-primary" 
 style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} 
 />
 </View>
 </View>
 );
});
Progress.displayName = "Progress";
export { Progress };
