import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function SupportHeader() {
  return (
    <View className="mb-8 rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
      <LinearGradient
        colors={['#1a241f', '#0d1310']}
        className="p-6"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="h-12 w-12 rounded-2xl bg-primary/10 items-center justify-center border border-primary/20">
            <ShieldCheck size={24} color="#10B981" />
          </View>
          <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <Text className="text-primary text-[8px] font-black uppercase tracking-widest">Secure Support</Text>
          </View>
        </View>
        <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-xl mb-1">How can we help today?</Text>
        <Text className="text-muted-foreground text-xs leading-relaxed">Our verified agents are standing by to assist with your capital needs.</Text>
      </LinearGradient>
    </View>
  );
}
