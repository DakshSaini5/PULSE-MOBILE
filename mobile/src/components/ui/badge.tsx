import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/utils';

const badgeVariants = cva(
 "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5",
 {
 variants: {
 variant: {
 default: "border-transparent bg-primary",
 secondary: "border-transparent bg-secondary",
 destructive: "border-transparent bg-destructive",
 outline: "border-border",
 },
 },
 defaultVariants: {
 variant: "default",
 },
 }
)

const badgeTextVariants = cva(
 "text-xs font-semibold",
 {
 variants: {
 variant: {
 default: "text-primary-foreground",
 secondary: "text-secondary-foreground",
 destructive: "text-destructive-foreground",
 outline: "text-foreground",
 },
 },
 defaultVariants: {
 variant: "default",
 },
 }
)

export interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {
 textStyle?: string;
 children: React.ReactNode;
}

function Badge({ className, variant, textStyle, children, ...props }: BadgeProps) {
 return (
 <View className={cn(badgeVariants({ variant }), className)} {...props}>
 <Text className={cn(badgeTextVariants({ variant }), textStyle)}>
 {children}
 </Text>
 </View>
 )
}

export { Badge, badgeVariants }
