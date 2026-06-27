import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// TODO: Use expo-updates for a true hard reload: import * as Updates from 'expo-updates';

interface Props {
 children: ReactNode;
}

interface State {
 hasError: boolean;
 error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
 public state: State = {
 hasError: false,
 error: null
 };

 public static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error };
 }

 public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
 console.error('Uncaught error:', error, errorInfo);
 }

 private handleReset = async () => {
 // Clear potentially corrupted local storage keys
 await SecureStore.deleteItemAsync('pulse_user');
 await SecureStore.deleteItemAsync('pulse_token');
 await SecureStore.deleteItemAsync('pulse_theme');
 
 // TODO: True app reload logic
 // await Updates.reloadAsync();
 this.setState({ hasError: false, error: null });
 };

 public render() {
 if (this.state.hasError) {
 return (
 <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
 <View className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 items-center">
 <View className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
 <Text className="text-destructive font-bold text-2xl">!</Text>
 </View>
 
 <Text className="text-2xl font-bold text-foreground mb-2 text-center">
 Something went wrong
 </Text>
 
 <Text className="text-muted-foreground text-sm mb-6 text-center leading-relaxed">
 Pulse encountered a rendering issue. This is often caused by cached system assets or corrupted session data. Click below to clear your cache and reload.
 </Text>

 {this.state.error && (
 <View className="w-full bg-muted p-4 rounded-xl mb-6 border border-border max-h-32 overflow-hidden">
 <ScrollView>
 <Text className="text-xs font-mono text-destructive">
 {this.state.error.toString()}
 </Text>
 </ScrollView>
 </View>
 )}

 <TouchableOpacity
 onPress={this.handleReset}
 className="w-full py-3 px-4 bg-destructive rounded-xl shadow flex flex-row items-center justify-center gap-2"
 >
 <Text className="text-destructive-foreground font-medium">
 Clear Cache & Reload App
 </Text>
 </TouchableOpacity>
 </View>
 </SafeAreaView>
 );
 }

 return this.props.children;
 }
}
