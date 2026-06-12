import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";
import { BlurView } from 'expo-blur';

export function Card({ children, className = "", glass = false }: { children: React.ReactNode; className?: string; glass?: boolean }) {
  if (glass) {
    return (
      <View className={cn("rounded-[35px] border border-[#10b981]/20 overflow-hidden shadow-2xl", className)}>
        <BlurView intensity={30} tint="dark" className="p-8 bg-[#0f1714]/60">
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View className={cn("rounded-[35px] border border-white/5 bg-[#0f1714] p-8 shadow-2xl", className)}>
      {children}
    </View>
  );
}

export function StatCard({ label, value, hint, variant = "default" }: { label: string; value: string; hint?: string, variant?: "default" | "gold" | "emerald" }) {
  const color = variant === 'gold' ? '#f59e0b' : '#10b981';

  return (
    <View style={styles.statCard} className={cn("rounded-[35px] border p-7 relative overflow-hidden", variant === 'gold' ? 'border-[#f59e0b]/30' : 'border-[#10b981]/30')}>
      {/* Signature High-Vibrance Halo Glow */}
      <View
        style={{
          backgroundColor: color,
          position: 'absolute',
          top: -60,
          right: -60,
          width: 140,
          height: 140,
          borderRadius: 70,
          opacity: 0.15,
          filter: 'blur(40px)' // Note: Standard web CSS blur works on Expo Web
        } as any}
      />

      <Text className="text-[10px] font-black uppercase tracking-[0.4em] mb-3" style={{ color: `${color}cc` }}>
        {label}
      </Text>

      <Text style={{ fontFamily: 'Display-Bold' }} className="text-3xl text-[#fcfcfc] tracking-tighter leading-none">
        {value}
      </Text>

      {hint && (
        <View className="mt-4 flex-row">
          <View style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }} className="px-3 py-1 rounded-full border">
            <Text style={{ color: color }} className="text-[9px] font-black uppercase tracking-widest">{hint}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    backgroundColor: '#0f1714',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  }
});
