import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from 'expo-blur';
import { cn } from "@/lib/utils";

export function Card({ children, style, className, glass = false }: { children: React.ReactNode; style?: any; className?: string; glass?: boolean }) {
  if (glass) {
    return (
      <View className={cn("rounded-[35px] overflow-hidden border border-primary/10", className)} style={style}>
        <BlurView intensity={30} tint="dark" style={{ padding: 24, backgroundColor: 'rgba(15,23,20,0.6)' }}>
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View
      className={cn("rounded-[35px] border border-white/5 bg-surface p-7 shadow-2xl", className)}
      style={[{ shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 10 }, style]}
    >
      {children}
    </View>
  );
}

export function StatCard({ label, value, hint, variant = "default", style, hideValue = false }: { label: string; value: string; hint?: string, variant?: "default" | "gold" | "emerald", style?: any, hideValue?: boolean }) {
  const color = variant === 'gold' ? '#f59e0b' : '#10b981';

  return (
    <View style={[styles.cardContainer, styles.statCard, { borderColor: `${color}40`, borderWidth: 1 }, style]}>
      {/* Halo Glow */}
      <View
        style={{
          backgroundColor: color,
          position: 'absolute',
          top: -60,
          right: -60,
          width: 120,
          height: 120,
          borderRadius: 60,
          opacity: 0.1,
        }}
      />

      <Text style={{ color: `${color}cc`, fontWeight: '900', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </Text>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          fontFamily: 'Display-Bold',
          color: '#fcfcfc',
          fontSize: 24,
          letterSpacing: hideValue ? 4 : -0.5
        }}
      >
        {hideValue ? "••••••" : value}
      </Text>

      {hint && (
        <View style={{ marginTop: 12, flexDirection: 'row' }}>
          <View style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 100 }}>
            <Text style={{ color: color, fontWeight: '900', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase' }}>{hint}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  statCard: {
    backgroundColor: '#0f1714',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 110,
    justifyContent: 'center'
  }
});
