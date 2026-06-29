import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  PanResponder, 
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Activity, Send, X, Bot } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import io from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SUGGESTIONS = [
  "I have a headache",
  "Normal blood pressure?",
  "Can you read my report?"
];

export default function DraggableChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 150, y: SCREEN_HEIGHT - 150 })).current;
  const insets = useSafeAreaInsets();
  
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

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        
        let newX = (pan.x as any)._value;
        let newY = (pan.y as any)._value;
        
        const WIDGET_WIDTH = 130;
        const WIDGET_HEIGHT = 50;

        if (newX < 10) newX = 10;
        if (newX > SCREEN_WIDTH - WIDGET_WIDTH - 10) newX = SCREEN_WIDTH - WIDGET_WIDTH - 10;
        if (newY < insets.top + 10) newY = insets.top + 10;
        if (newY > SCREEN_HEIGHT - insets.bottom - WIDGET_HEIGHT - 10) newY = SCREEN_HEIGHT - insets.bottom - WIDGET_HEIGHT - 10;

        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
        }).start();
      }
    })
  ).current;

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

  if (isOpen) {
    return (
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 9999, elevation: 9999 }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          className="bg-black/40"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
          pointerEvents="box-none"
        >
          <View 
            className="bg-white rounded-t-3xl overflow-hidden shadow-2xl"
            style={{ height: SCREEN_HEIGHT * 0.7, paddingBottom: insets.bottom }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3 border border-blue-200">
                  <Activity color="#2563EB" size={20} />
                </View>
                <View>
                  <Text className="text-lg font-black text-slate-900 leading-tight">Pulse AI</Text>
                  <Text className="text-xs text-green-600 font-bold leading-tight">Online</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setIsOpen(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <ScrollView 
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              className="flex-1 px-4 pt-4 bg-slate-50"
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg) => (
                <View 
                  key={msg.id} 
                  className={`mb-4 max-w-[85%] ${msg.isUser ? 'self-end' : 'self-start'}`}
                >
                  <View 
                    className={`p-4 rounded-2xl shadow-sm ${
                      msg.isUser 
                        ? 'bg-blue-600 rounded-br-sm' 
                        : 'bg-white rounded-bl-sm border border-slate-100'
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
            <View className="bg-white border-t border-slate-100 pb-2 pt-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                className="px-4 mb-2"
              >
                {SUGGESTIONS.map((suggestion, idx) => (
                  <TouchableOpacity 
                    key={idx}
                    onPress={() => setInputText(suggestion)}
                    className="bg-slate-50 border border-blue-100 rounded-full px-4 py-2 mr-2"
                  >
                    <Text className="text-blue-600 text-xs font-bold">{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View className="flex-row items-center px-4 py-2">
                <View className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl flex-row items-center px-4 h-12 shadow-sm">
                  <TextInput
                    placeholder="Ask Pulse AI..."
                    placeholderTextColor="#94A3B8"
                    className="flex-1 text-base text-slate-900 h-full font-medium"
                    value={inputText}
                    onChangeText={setInputText}
                    editable={!isTyping}
                  />
                </View>
                <TouchableOpacity 
                  onPress={handleSend}
                  className={`w-12 h-12 rounded-full items-center justify-center ml-3 shadow-md ${
                    inputText.trim() && !isTyping ? 'bg-blue-600' : 'bg-slate-200 shadow-none'
                  }`}
                  disabled={!inputText.trim() || isTyping}
                >
                  <Send color={inputText.trim() && !isTyping ? "#fff" : "#94A3B8"} size={20} className="ml-1" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        pan.getLayout(),
        {
          position: 'absolute',
          zIndex: 9999,
          elevation: 9999,
        }
      ]}
    >
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => setIsOpen(true)}
        className="bg-blue-600 rounded-full flex-row items-center justify-center pl-3 pr-4 py-3 shadow-xl border-2 border-blue-500"
        style={{
          shadowColor: '#2563EB',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
        }}
      >
        <View className="bg-white rounded-full p-1.5 mr-2 shadow-sm">
          <Activity color="#2563EB" size={16} />
        </View>
        <Text className="text-white font-black text-sm tracking-wide">Pulse AI</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
