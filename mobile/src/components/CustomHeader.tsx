import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Menu } from 'lucide-react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';

interface CustomHeaderProps {
  title?: string;
}

export default function CustomHeader({ title }: CustomHeaderProps) {
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  return (
    <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100">
      <TouchableOpacity 
        onPress={() => navigation.toggleDrawer()} 
        className="p-2 -ml-2 rounded-full active:bg-gray-50"
      >
        <Menu color="#000" size={24} />
      </TouchableOpacity>
      <View className="flex-1 ml-2">
        {title && (
          <Text className="text-lg font-semibold text-slate-900">
            {title}
          </Text>
        )}
      </View>
    </View>
  );
}
