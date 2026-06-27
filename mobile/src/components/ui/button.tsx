import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/utils';

const buttonVariants = cva(
 "inline-flex flex-row items-center justify-center rounded-md",
 {
 variants: {
 variant: {
 default: 'bg-primary',
 destructive: 'bg-destructive',
 outline: 'border border-input bg-background',
 secondary: 'bg-secondary',
 ghost: 'bg-transparent',
 link: 'bg-transparent',
 },
 size: {
 default: 'h-10 px-4 py-2',
 sm: 'h-9 rounded-md px-3',
 lg: 'h-11 rounded-md px-8',
 icon: 'h-10 w-10',
 },
 },
 defaultVariants: {
 variant: 'default',
 size: 'default',
 },
 }
);

const buttonTextVariants = cva(
 "text-sm font-medium",
 {
 variants: {
 variant: {
 default: 'text-primary-foreground',
 destructive: 'text-destructive-foreground',
 outline: 'text-foreground',
 secondary: 'text-secondary-foreground',
 ghost: 'text-foreground',
 link: 'text-primary underline',
 },
 },
 defaultVariants: {
 variant: 'default',
 },
 }
);

export interface ButtonProps extends TouchableOpacityProps, VariantProps<typeof buttonVariants> {
 textStyle?: string;
 children?: React.ReactNode;
}

const Button = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
 ({ className, variant, size, textStyle, children, ...props }, ref) => {
 return (
 <TouchableOpacity
 ref={ref}
 className={cn(buttonVariants({ variant, size, className }))}
 {...props}
 >
 {typeof children === 'string' ? (
 <Text className={cn(buttonTextVariants({ variant }), textStyle)}>{children}</Text>
 ) : (
 children
 )}
 </TouchableOpacity>
 );
 }
);
Button.displayName = 'Button';

export { Button, buttonVariants, buttonTextVariants };
