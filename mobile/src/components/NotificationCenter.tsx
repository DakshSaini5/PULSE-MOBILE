import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Bell, Check, Settings, Info, Activity, AlertCircle } from 'lucide-react-native';
import { notificationAPI, Notification } from '../services/api';
import { useNavigation } from '@react-navigation/native';

export const NotificationCenter: React.FC = () => {
 const [isOpen, setIsOpen] = useState(false);
 const [notifications, setNotifications] = useState<Notification[]>([]);
 const [unreadCount, setUnreadCount] = useState(0);
 const [loading, setLoading] = useState(false);
 const navigation = useNavigation<any>();

 const fetchNotifications = async () => {
 try {
 setLoading(true);
 const [all, count] = await Promise.all([
 notificationAPI.getAll(),
 notificationAPI.getUnreadCount()
 ]);
 setNotifications(all);
 setUnreadCount(count);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchNotifications();
 const interval = setInterval(fetchNotifications, 120000);
 return () => clearInterval(interval);
 }, []);

 const handleToggle = () => {
 setIsOpen(!isOpen);
 if (!isOpen && notifications.length === 0) {
 fetchNotifications();
 }
 };

 const handleMarkAsRead = async (id: string) => {
 try {
 await notificationAPI.markAsRead(id);
 setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
 setUnreadCount(prev => Math.max(0, prev - 1));
 } catch (err) {
 console.error(err);
 }
 };

 const handleMarkAllAsRead = async () => {
 try {
 await notificationAPI.markAllAsRead();
 setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
 setUnreadCount(0);
 } catch (err) {
 console.error(err);
 }
 };

 const handleNotificationClick = async (notification: Notification) => {
 if (!notification.isRead) {
 await handleMarkAsRead(notification.id);
 }
 setIsOpen(false);
 if (notification.link) {
 navigation.navigate(notification.link.replace('/', ''));
 }
 };

 const getIcon = (type: string) => {
 switch (type) {
 case 'SYSTEM': return <Settings size={16} color="#64748b" />;
 case 'ALERT': return <AlertCircle size={16} color="#ef4444" />;
 case 'ANALYSIS': return <Activity size={16} color="#1E60D5" />;
 default: return <Info size={16} color="#3b82f6" />;
 }
 };

 return (
 <View>
 <TouchableOpacity onPress={handleToggle} className="p-2 relative">
 <Bell size={24} color="#64748b" />
 {unreadCount > 0 && (
 <View className="absolute top-1.5 right-1.5 w-3 h-3 bg-destructive rounded-full border-2 border-background" />
 )}
 </TouchableOpacity>

 <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
 <View className="flex-1 justify-end bg-black/40">
 <View className="bg-card w-full rounded-t-3xl h-[70vh] border-t border-border">
 <View className="p-4 border-b border-border flex-row justify-between items-center bg-muted/30">
 <Text className="font-bold text-foreground text-lg">Notifications</Text>
 {unreadCount > 0 && (
 <TouchableOpacity onPress={handleMarkAllAsRead} className="flex-row items-center gap-1">
 <Check size={12} color="#1E60D5" />
 <Text className="text-[10px] font-bold text-primary uppercase tracking-wider">Mark all read</Text>
 </TouchableOpacity>
 )}
 </View>

 <ScrollView className="flex-1">
 {loading && notifications.length === 0 ? (
 <View className="p-8 items-center justify-center">
 <ActivityIndicator size="large" color="#1E60D5" />
 </View>
 ) : notifications.length === 0 ? (
 <View className="p-8 items-center">
 <Bell size={48} color="#cbd5e1" />
 <Text className="text-sm font-medium text-foreground mt-4">You're all caught up!</Text>
 <Text className="text-xs mt-1 text-muted-foreground">No new notifications</Text>
 </View>
 ) : (
 notifications.map(notification => (
 <TouchableOpacity
 key={notification.id}
 onPress={() => handleNotificationClick(notification)}
 className={`p-4 border-b border-border flex-row gap-3 ${!notification.isRead ? 'bg-primary/5' : ''}`}
 >
 <View className="mt-1">
 <View className={`w-10 h-10 rounded-full items-center justify-center ${!notification.isRead ? 'bg-background border border-border' : 'bg-muted'}`}>
 {getIcon(notification.type)}
 </View>
 </View>
 <View className="flex-1">
 <View className="flex-row justify-between items-start mb-1">
 <Text className={`text-sm flex-1 font-bold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
 {notification.title}
 </Text>
 <Text className="text-[10px] text-muted-foreground ml-2">
 {new Date(notification.createdAt).toLocaleDateString()}
 </Text>
 </View>
 <Text className={`text-xs leading-relaxed ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
 {notification.message}
 </Text>
 </View>
 </TouchableOpacity>
 ))
 )}
 </ScrollView>
 
 <TouchableOpacity onPress={() => setIsOpen(false)} className="p-4 bg-background border-t border-border items-center pb-safe">
 <Text className="font-bold text-foreground">Close</Text>
 </TouchableOpacity>
 </View>
 </View>
 </Modal>
 </View>
 );
};

export default NotificationCenter;
