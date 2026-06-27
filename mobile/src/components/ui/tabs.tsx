import React, { createContext, useContext, useState } from 'react';
import { View, TouchableOpacity, Text, ViewProps, TouchableOpacityProps } from 'react-native';
import { cn } from '../../utils/utils';

const TabsContext = createContext<{
 value: string;
 onValueChange: (val: string) => void;
}>({ value: '', onValueChange: () => {} });

export interface TabsProps extends ViewProps {
 defaultValue: string;
 value?: string;
 onValueChange?: (val: string) => void;
}

const Tabs = React.forwardRef<View, TabsProps>(({ className, defaultValue, value, onValueChange, children, ...props }, ref) => {
 const [internalValue, setInternalValue] = useState(defaultValue);
 const activeValue = value !== undefined ? value : internalValue;
 
 const handleValueChange = (val: string) => {
 setInternalValue(val);
 onValueChange?.(val);
 };

 return (
 <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
 <View ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
 {children}
 </View>
 </TabsContext.Provider>
 );
});
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
 <View
 ref={ref}
 className={cn("inline-flex flex-row h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}
 {...props}
 />
));
TabsList.displayName = "TabsList";

export interface TabsTriggerProps extends TouchableOpacityProps {
 value: string;
}

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, TabsTriggerProps>(({ className, value, children, ...props }, ref) => {
 const context = useContext(TabsContext);
 const isActive = context.value === value;
 
 return (
 <TouchableOpacity
 ref={ref}
 onPress={() => context.onValueChange(value)}
 className={cn(
 "inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5",
 isActive ? "bg-background " : "bg-transparent",
 className
 )}
 {...props}
 >
 <Text className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
 {children}
 </Text>
 </TouchableOpacity>
 );
});
TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps extends ViewProps {
 value: string;
}

const TabsContent = React.forwardRef<View, TabsContentProps>(({ className, value, children, ...props }, ref) => {
 const context = useContext(TabsContext);
 if (context.value !== value) return null;
 
 return (
 <View ref={ref} className={cn("mt-2 outline-none", className)} {...props}>
 {children}
 </View>
 );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
