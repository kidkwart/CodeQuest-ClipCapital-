import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/theme-context';

export function SupportHeader() {
  const { colors, theme } = useTheme();
  return (
    <View
      style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}
      className="mb-8 rounded-[32px] overflow-hidden border shadow-2xl"
    >
      <LinearGradient
        colors={theme === 'dark' ? ['#1a241f', '#0d1310'] : ['#ffffff', '#f1f5f9']}
        className="p-6"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View style={{ backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }} className="h-12 w-12 rounded-2xl items-center justify-center border">
            <ShieldCheck size={24} color={colors.primary} />
          </View>
          <View style={{ backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }} className="px-3 py-1 rounded-full border">
            <Text style={{ color: colors.primary }} className="text-[8px] font-black uppercase tracking-widest">Secure Support</Text>
          </View>
        </View>
        <Text style={{ fontFamily: 'Display-Bold', color: colors.text }} className="text-xl mb-1">How can we help today?</Text>
        <Text style={{ color: colors.textMuted }} className="text-xs leading-relaxed">Our verified agents are standing by to assist with your capital needs.</Text>
      </LinearGradient>
    </View>
  );
}
