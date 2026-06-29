import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { navigationRef } from '../navigation/navigationRef';

export default function FAB() {
  return (
    <TouchableOpacity
      className="absolute bottom-24 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      style={styles.shadow}
      onPress={() => navigationRef.current?.navigate('Chat')}
    >
      <MessageCircle color="#fff" size={28} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
