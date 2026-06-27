import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, KeyboardAvoidingView, Platform, Easing } from 'react-native';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react-native';
import { PulseLogo } from './PulseLogo';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.3:3000';

const MOCK_SUGGESTIONS = [
  "Find hospitals near me",
  "Check drug interactions",
  "What is a good HbA1c level?",
  "Translate my prescription"
];

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  streaming?: boolean;
}

export const AIChatbox = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const socketRef = useRef<Socket | null>(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Connect Socket.IO when chatbox opens
  useEffect(() => {
    let active = true;

    if (isOpen && !socketRef.current) {
      const connectSocket = async () => {
        const token = await SecureStore.getItemAsync('pulse_token');
        if (!active) return;

        const socket = io(BASE_URL, { 
          transports: ['websocket'], 
          reconnection: true,
          auth: { token }
        });

        socket.on('connect', () => console.log('[Chat] Socket connected:', socket.id));
        socket.on('connect_error', (err) => console.error('[Chat] Socket connection error:', err.message));

        socket.on('chatChunk', (chunk: string) => {
          setChatHistory(prev => {
            const last = prev[prev.length - 1];
            if (last?.streaming) {
              return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
            }
            return [...prev, { role: 'model', content: chunk, streaming: true }];
          });
        });

        socket.on('chatEnd', () => {
          setLoading(false);
          setChatHistory(prev => {
            const last = prev[prev.length - 1];
            if (last?.streaming) {
              return [...prev.slice(0, -1), { role: 'model', content: last.content }];
            }
            return prev;
          });
        });

        socket.on('chatError', (err: { message: string }) => {
          setLoading(false);
          setChatHistory(prev => [...prev, { role: 'model', content: `⚠️ ${err.message}` }]);
        });

        socketRef.current = socket;
      };

      connectSocket();
    }

    return () => {
      active = false;
      if (!isOpen && socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  const handleSend = useCallback((text: string = message) => {
    if (!text.trim() || !socketRef.current) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setChatHistory(prev => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    socketRef.current.emit('chatMessage', { text });
  }, [message]);

  if (!user) return null;

  return (
    <>
      {/* Absolute Card Overlay */}
      {isOpen && (
        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            position: 'absolute',
            bottom: 90,
            right: 20,
            width: 320,
            height: 480,
            zIndex: 100,
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 15,
          }}
        >
          <View className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">

            {/* Chat Header */}
            <View className="bg-primary px-5 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="bg-white/20 p-2 rounded-xl">
                  <PulseLogo variant="icon" size={16} />
                </View>
                <View>
                  <Text className="text-white font-black tracking-wide text-sm">Pulse AI</Text>
                  <Text className="text-blue-100 text-[9px] font-bold tracking-widest uppercase mt-0.5">Powered by Gemini</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} className="bg-white/10 p-1.5 rounded-full">
                <X size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-4 py-4 bg-slate-50 dark:bg-slate-950"
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {chatHistory.length === 0 ? (
                <View className="mt-4">
                  <Text className="text-xs text-slate-500 font-semibold mb-3 text-center">
                    How can Pulse AI assist you today?
                  </Text>
                  <View className="flex-row flex-wrap gap-2 justify-center">
                    {MOCK_SUGGESTIONS.map((suggestion, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => handleSend(suggestion)}
                        className="bg-white dark:bg-slate-800 border border-border px-3 py-2 rounded-xl"
                      >
                        <Text className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View className="gap-3 pb-2">
                  {chatHistory.map((msg, idx) => (
                    <View key={idx} className={`flex-row ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'model' && (
                        <View className="h-6 w-6 rounded-full bg-primary/10 items-center justify-center mr-2 mt-1">
                          <Sparkles size={10} color="#2563EB" />
                        </View>
                      )}
                      <View className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-primary rounded-tr-sm'
                          : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
                      }`}>
                        <Text className={`text-xs leading-relaxed ${
                          msg.role === 'user' ? 'text-white font-semibold' : 'text-slate-700 dark:text-slate-200 font-medium'
                        }`}>
                          {msg.content}
                          {msg.streaming && <Text className="text-primary">▌</Text>}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {loading && chatHistory[chatHistory.length - 1]?.role === 'user' && (
                    <View className="flex-row justify-start items-center gap-2 mt-2 ml-8">
                      <View className="flex-row gap-1">
                        <View className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        <View className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                        <View className="w-1.5 h-1.5 rounded-full bg-primary/80" />
                      </View>
                      <Text className="text-[9px] font-bold text-slate-400">Gemini is thinking...</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View className="px-3 py-3 bg-white dark:bg-slate-900 border-t border-border flex-row items-center gap-2">
              <View className="flex-1 bg-slate-100 dark:bg-slate-800 border border-border rounded-xl h-10 flex-row items-center px-3">
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Ask anything..."
                  placeholderTextColor="#94a3b8"
                  className="flex-1 text-xs text-foreground font-semibold"
                  onSubmitEditing={() => handleSend()}
                />
              </View>
              <TouchableOpacity
                onPress={() => handleSend()}
                disabled={!message.trim() || loading}
                className={`h-10 w-10 rounded-xl items-center justify-center ${message.trim() ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}
              >
                <Send size={14} color={message.trim() ? "white" : "#94a3b8"} style={{ marginLeft: -2 }} />
              </TouchableOpacity>
            </View>

          </View>
        </Animated.View>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          className="absolute bottom-6 right-6 h-14 w-14 bg-primary rounded-full items-center justify-center shadow-lg z-50 border-2 border-white dark:border-slate-900"
        >
          <MessageSquare size={24} color="white" fill="white" />
          <View className="absolute top-0 right-0 h-3.5 w-3.5 bg-rose-500 rounded-full border-2 border-primary" />
        </TouchableOpacity>
      )}
    </>
  );
};

export default AIChatbox;
