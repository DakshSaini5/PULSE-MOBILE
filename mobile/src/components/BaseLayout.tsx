import { SafeAreaView } from 'react-native-safe-area-context';
import React, { ReactNode } from 'react';
import {  ViewProps } from 'react-native';

interface BaseLayoutProps extends ViewProps {
  children: ReactNode;
}

export default function BaseLayout({ children, className, ...rest }: BaseLayoutProps) {
  return (
    <SafeAreaView className={`flex-1 bg-white ${className || ''}`} {...rest}>
      {children}
    </SafeAreaView>
  );
}
