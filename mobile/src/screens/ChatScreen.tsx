import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Send, ArrowLeft, Bot } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SUGGESTIONS = [
  "I have a headache",
  "Normal blood pressure?",
  "Nearest pharmacy?",
  "Can you read my report?"
];

export default function ChatScreen() {
  const navigation = useNavigation();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [messages, setMessages] = useState([
    { id: '1', text: "Hello! I'm Pulse AI, your secure medical companion. How can I help you today?", isUser: false },
  ]);

  const socketRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const initSocket = async () => {
      const token = await SecureStore.getItemAsync('pulse_token');
      const EXPO_API_URL = process.env.EXPO_PUBLIC_API_URL;
      
      if (!EXPO_API_URL) return;

      socketRef.current = io(EXPO_API_URL, { auth: { token } });

      socketRef.current.on('chatChunk', (chunk: string) => {
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (!lastMsg.isUser && lastMsg.id === 'typing') {
            lastMsg.id = Date.now().toString();
            lastMsg.text = chunk;
          } else if (!lastMsg.isUser) {
            lastMsg.text += chunk;
          } else {
             newMsgs.push({ id: Date.now().toString(), text: chunk, isUser: false });
          }
          return newMsgs;
        });
        setIsTyping(false);
      });

      socketRef.current.on('chatError', (err: any) => {
        setIsTyping(false);
        setMessages(prev => {
           const newMsgs = [...prev];
           if(newMsgs[newMsgs.length -1]?.id === 'typing') {
              newMsgs.pop();
           }
           newMsgs.push({ id: Date.now().toString(), text: 'Sorry, I encountered an error connecting to the server.', isUser: false });
           return newMsgs;
        });
      });
      
      socketRef.current.on('chatEnd', () => {
        setIsTyping(false);
      });
    };
    initSocket();
    return () => socketRef.current?.disconnect();
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newUserMsg = { id: Date.now().toString(), text: inputText, isUser: true };
    setMessages(prev => [...prev, newUserMsg, { id: 'typing', text: '...', isUser: false }]);
    setInputText('');
    setIsTyping(true);

    if (socketRef.current) {
      socketRef.current.emit('chatMessage', inputText);
    } else {
      setMessages(prev => {
        const arr = [...prev];
        arr.pop();
        arr.push({ id: Date.now().toString(), text: 'Not connected to server.', isUser: false });
        return arr;
      });
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
        <TouchableOpacity 
          className="p-2 -ml-2 rounded-full active:bg-gray-50"
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <View className="flex-row items-center ml-2">
          <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2">
            <Bot color="#2563EB" size={20} />
          </View>
          <View>
            <Text className="text-lg font-bold text-slate-900 leading-tight">Pulse AI</Text>
            <Text className="text-xs text-green-600 font-medium leading-tight">Online</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Chat Area */}
        <ScrollView 
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View 
              key={msg.id} 
              className={`mb-4 max-w-[80%] ${msg.isUser ? 'self-end' : 'self-start'}`}
            >
              <View 
                className={`p-4 rounded-2xl ${
                  msg.isUser 
                    ? 'bg-blue-600 rounded-br-sm' 
                    : 'bg-slate-100 rounded-bl-sm border border-slate-200'
                }`}
              >
                {msg.id === 'typing' ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Text className={`text-base ${msg.isUser ? 'text-white' : 'text-slate-800'}`}>
                    {msg.text}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View className="bg-white border-t border-slate-100 pb-2">
          {/* Suggestions */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            className="py-3 px-4"
          >
            {SUGGESTIONS.map((suggestion, idx) => (
              <TouchableOpacity 
                key={idx}
                onPress={() => setInputText(suggestion)}
                className="bg-white border border-blue-200 rounded-full px-4 py-2 mr-2 mb-1"
              >
                <Text className="text-blue-600 text-sm font-medium">{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="flex-row items-center px-4 py-2 mb-2">
            <View className="flex-1 bg-slate-50 border border-slate-200 rounded-full flex-row items-center px-4 h-12">
              <TextInput
                placeholder="Ask Pulse AI a question..."
                placeholderTextColor="#94A3B8"
                className="flex-1 text-base text-slate-900 h-full"
                value={inputText}
                onChangeText={setInputText}
                editable={!isTyping}
                multiline
              />
            </View>
            <TouchableOpacity 
              onPress={handleSend}
              className={`w-12 h-12 rounded-full items-center justify-center ml-2 ${
                inputText.trim() && !isTyping ? 'bg-blue-600' : 'bg-slate-200'
              }`}
              disabled={!inputText.trim() || isTyping}
            >
              <Send color={inputText.trim() && !isTyping ? "#fff" : "#94A3B8"} size={20} className="ml-1" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
