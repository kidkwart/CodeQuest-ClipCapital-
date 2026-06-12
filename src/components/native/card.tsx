import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from 'expo-blur';

export function Card({ children, style, glass = false }: { children: React.ReactNode; style?: any; glass?: boolean }) {
  if (glass) {
    return (
      <View style={[styles.cardContainer, { overflow: 'hidden', borderWeight: 1, borderColor: 'rgba(16,185,129,0.1)' }, style]}>
        <BlurView intensity={30} tint="dark" style={{ padding: 24, backgroundColor: 'rgba(15,23,20,0.6)' }}>
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[styles.cardContainer, { padding: 28, backgroundColor: '#0f1714' }, style]}>
      {children}
    </View>
  );
}

export function StatCard({ label, value, hint, variant = "default" }: { label: string; value: string; hint?: string, variant?: "default" | "gold" | "emerald" }) {
  const color = variant === 'gold' ? '#f59e0b' : '#10b981';

  return (
    <View style={[styles.cardContainer, styles.statCard, { borderColor: `${color}40`, borderWidth: 1 }]}>
      {/* Halo Glow */}
      <View
        style={{
          backgroundColor: color,
          position: 'absolute',
          top: -60,
          right: -60,
          width: 140,
          height: 140,
          borderRadius: 70,
          opacity: 0.1,
        }}
      />

      <Text style={{ color: `${color}cc`, fontWeight: '900', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12 }}>
        {label}
      </Text>

      <Text style={{ fontFamily: 'Display-Bold', color: '#fcfcfc', fontSize: 32, letterSpacing: -1 }}>
        {value}
      </Text>

      {hint && (
        <View style={{ marginTop: 16, flexDirection: 'row' }}>
          <View style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, borderWidth: 1, paddingHorizontal: 12, py: 4, borderRadius: 100 }}>
            <Text style={{ color: color, fontWeight: '900', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase' }}>{hint}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  statCard: {
    backgroundColor: '#0f1714',
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
  }
});
