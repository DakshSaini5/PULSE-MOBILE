import React, { useState, useRef, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform, SafeAreaView } from "react-native"
import { MessageCircle, X, Send, Sparkles, Bot, Flag } from "lucide-react-native"
import { PulseLogo } from "./PulseLogo"
import io, { Socket } from 'socket.io-client';
import Markdown from 'react-native-markdown-display';
import * as SecureStore from 'expo-secure-store';

interface Message {
 id: string
 role: "user" | "assistant" | "model"
 text: string
 isError?: boolean
}

const QUICK_PROMPTS = [
 "Find hospitals near me",
 "Check drug interactions",
 "What is HbA1c?",
]

export const AIChatbox: React.FC = () => {
 const [isOpen, setIsOpen] = useState(false)
 const [messages, setMessages] = useState<Message[]>([])
 const [input, setInput] = useState("")
 const [isTyping, setIsTyping] = useState(false)
 const scrollViewRef = useRef<ScrollView>(null)
 const socketRef = useRef<Socket | null>(null);

 useEffect(() => {
 if (isOpen) {
 setTimeout(() => {
 scrollViewRef.current?.scrollToEnd({ animated: true })
 }, 100)
 }
 }, [messages, isOpen, isTyping])

 useEffect(() => {
 if (isOpen && !socketRef.current) {
 const initSocket = async () => {
 const url = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000';
 const token = await SecureStore.getItemAsync('pulse_token');
 const socket = io(url as any, {
 auth: { token },
 transports: ['websocket']
 });
 
 socket.on('connect', () => {
 setMessages([{
 id: 'welcome',
 role: 'assistant',
 text: 'Hi! I\'m Pulse AI. Ask me anything about nearby hospitals, your prescriptions, or health conditions.'
 }]);
 });

 socket.on('chatChunk', (text: string) => {
 setIsTyping(false);
 setMessages(prev => {
 const newMessages = [...prev];
 const lastMsgIndex = newMessages.length - 1;
 if (lastMsgIndex >= 0 && newMessages[lastMsgIndex].role === 'assistant') {
 newMessages[lastMsgIndex] = {
 ...newMessages[lastMsgIndex],
 text: newMessages[lastMsgIndex].text + text
 };
 } else {
 // Create the assistant message if it doesn't exist yet
 newMessages.push({
 id: Date.now().toString(),
 role: 'assistant',
 text: text,
 isError: false
 });
 }
 return newMessages;
 });
 });

 socket.on('chatEnd', () => {
 setIsTyping(false);
 });

 socket.on('chatError', (data: { message: string }) => {
 setIsTyping(false);
 setMessages(prev => [...prev, {
 id: Date.now().toString(),
 role: 'assistant',
 text: data.message,
 isError: true
 }]);
 });

 socketRef.current = socket;
 };
 
 initSocket();
 }

 return () => {
 if (socketRef.current) {
 socketRef.current.disconnect();
 socketRef.current = null;
 }
 };
 }, [isOpen]);

 const sendMessage = (text: string) => {
 if (!text.trim() || !socketRef.current) return
 const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim() }
 setMessages((prev) => [...prev, userMsg])
 setInput("")
 setIsTyping(true)
 socketRef.current.emit('chatMessage', text.trim());

 // Fallback timeout to prevent infinite hang if backend fails silently
 setTimeout(() => {
 setIsTyping((prev) => {
 if (prev) {
 setMessages((m) => [...m, { id: Date.now().toString(), role: "assistant", text: "Request timed out. Please try again.", isError: true }]);
 return false;
 }
 return prev;
 });
 }, 15000);
 }

 return (
 <View className="absolute bottom-20 right-4 z-50">
 <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
 <SafeAreaView className="flex-1 bg-background/95">
 <KeyboardAvoidingView 
 behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
 className="flex-1"
 >
 <View className="flex-1 bg-card rounded-t-3xl border-t border-border mt-10 overflow-hidden ">
 <View className="flex-row items-center justify-between px-4 py-4 bg-primary">
 <View className="flex-row items-center gap-3">
 <View className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
 <Sparkles size={20} color="white" />
 </View>
 <View>
 <Text className="font-bold text-white text-base">Pulse AI</Text>
 <View className="flex-row items-center gap-1 mt-0.5">
 <View className="w-1.5 h-1.5 rounded-full bg-green-400" />
 <Text className="text-white/80 text-xs">Online</Text>
 </View>
 </View>
 </View>
 <TouchableOpacity onPress={() => setIsOpen(false)} className="p-2 bg-white/10 rounded-full">
 <X size={20} color="white" />
 </TouchableOpacity>
 </View>

 <ScrollView ref={scrollViewRef} className="flex-1 px-4 py-4">
 {messages.map((msg) => (
 <View key={msg.id} className={`flex-row mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
 {(msg.role === 'assistant' || msg.role === 'model') && (
 <View className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1">
 <Bot size={16} color="#2563EB" />
 </View>
 )}
 <View className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary rounded-tr-sm' : msg.isError ? 'bg-destructive/10 border border-destructive/20 rounded-tl-sm' : 'bg-muted rounded-tl-sm'}`}>
 {msg.role === 'user' ? (
 <Text className="text-white text-sm">{msg.text}</Text>
 ) : (
 <Markdown
 style={{
 body: { color: msg.isError ? '#ef4444' : '#1e293b', fontSize: 14 },
 paragraph: { marginBottom: 0, marginTop: 0 },
 }}
 >
 {msg.text}
 </Markdown>
 )}
 </View>
 </View>
 ))}
 {isTyping && (
 <View className="flex-row justify-start mb-4">
 <View className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
 <Bot size={16} color="#2563EB" />
 </View>
 <View className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
 <Text className="text-muted-foreground text-sm">Thinking...</Text>
 </View>
 </View>
 )}
 <View className="h-4" />
 </ScrollView>

 {messages.length <= 1 && (
 <View className="px-4 pb-2 flex-row flex-wrap gap-2">
 {QUICK_PROMPTS.map((prompt) => (
 <TouchableOpacity key={prompt} onPress={() => sendMessage(prompt)} className="px-3 py-1.5 bg-secondary border border-primary/20 rounded-full">
 <Text className="text-xs font-semibold text-primary">{prompt}</Text>
 </TouchableOpacity>
 ))}
 </View>
 )}

 <View className="px-4 py-3 bg-card border-t border-border">
 <View className="flex-row items-center bg-muted rounded-2xl px-4 py-2 border border-border">
 <TextInput
 value={input}
 onChangeText={setInput}
 placeholder="Ask Pulse AI..."
 placeholderTextColor="#9ca3af"
 className="flex-1 min-h-[40px] text-foreground text-sm"
 multiline
 />
 <TouchableOpacity 
 onPress={() => sendMessage(input)}
 disabled={!input.trim() || isTyping}
 className={`w-10 h-10 rounded-full items-center justify-center ml-2 ${input.trim() && !isTyping ? 'bg-primary' : 'bg-muted-foreground/20'}`}
 >
 <Send size={16} color="white" />
 </TouchableOpacity>
 </View>
 <Text className="text-[10px] text-muted-foreground text-center mt-2">
 AI-generated outputs must be validated with a physician.
 </Text>
 </View>
 </View>
 </KeyboardAvoidingView>
 </SafeAreaView>
 </Modal>

 {!isOpen && (
 <TouchableOpacity 
 onPress={() => setIsOpen(true)}
 className="w-16 h-16 bg-primary rounded-full items-center justify-center border-4 border-background active:scale-95 transition-all"
 >
 <PulseLogo variant="icon" size={32} />
 </TouchableOpacity>
 )}
 </View>
 )
}

export default AIChatbox;
