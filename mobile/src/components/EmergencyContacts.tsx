import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { PhoneCall, Trash2, Plus } from 'lucide-react-native';
import EmergencyContactModal from './EmergencyContactModal';
import { emergencyAPI } from '../services/api';

interface EmergencyContactsProps {
  contacts: any[];
  onAddSuccess?: () => void;
}

export const EmergencyContacts = ({ contacts = [], onAddSuccess }: EmergencyContactsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <View className="px-5 mt-4">
      <View className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Soft-Red Tinted Accent Bar */}
        <View className="bg-rose-50 dark:bg-rose-950/30 px-4 py-3 flex-row justify-between items-center border-b border-rose-100 dark:border-rose-900/50">
          <Text className="text-xs font-black tracking-widest text-rose-600 dark:text-rose-500">
            EMERGENCY CONTACTS
          </Text>
          <TouchableOpacity 
            className="bg-rose-100 dark:bg-rose-900/50 p-1.5 rounded-full"
            onPress={() => setIsModalOpen(true)}
          >
            <Plus size={14} color="#e11d48" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Contacts List */}
        <View className="px-2 py-2">
          {contacts.length === 0 ? (
            <View className="p-4 items-center justify-center">
              <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">No emergency contacts saved.</Text>
            </View>
          ) : contacts.map((contact, index) => (
            <View 
              key={contact.id} 
              className={`flex-row items-center justify-between p-3 ${index !== contacts.length - 1 ? 'border-b border-border' : ''}`}
            >
              {/* Info */}
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {contact.relationship} ({contact.name})
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {contact.phoneNumber}
                </Text>
              </View>

              {/* Actions */}
              <View className="flex-row items-center gap-2">
                <TouchableOpacity 
                  onPress={() => {
                    if (contact.phoneNumber) {
                      Linking.openURL(`tel:${contact.phoneNumber}`);
                    }
                  }}
                  className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <PhoneCall size={16} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    Alert.alert(
                      "Delete Contact",
                      `Are you sure you want to delete ${contact.name}?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        { 
                          text: "Delete", 
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await emergencyAPI.deleteContact(contact.id);
                              if (onAddSuccess) onAddSuccess();
                            } catch (err) {
                              Alert.alert("Error", "Could not delete contact.");
                            }
                          }
                        }
                      ]
                    );
                  }}
                  className="bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      <EmergencyContactModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          if (onAddSuccess) onAddSuccess();
        }}
      />
    </View>
  );
};
