import React from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Card } from './card';
import { Zap, ShieldCheck, TrendingUp, ChevronRight } from 'lucide-react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const GAUGE_SIZE = 160;
const STROKE_WIDTH = 12;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  score: number;
  limit: number;
  loading?: boolean;
}

export function CreditCapacityGauge({ score, limit, loading }: Props) {
  const percentage = Math.min(100, Math.max(0, ((score - 100) / 750) * 100));
  const strokeDashoffset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

  const getTier = (s: number) => {
    if (s >= 800) return { name: "ELITE ARTISAN", color: "#f59e0b", icon: Zap };
    if (s >= 650) return { name: "MASTER CRAFT", color: "#10b981", icon: ShieldCheck };
    return { name: "PRO-LEVEL", color: "#3b82f6", icon: TrendingUp };
  };

  const tier = getTier(score);
  const TierIcon = tier.icon;

  if (loading) {
    return (
      <Card glass style={styles.container}>
        <ActivityIndicator color="#10b981" />
      </Card>
    );
  }

  return (
    <Card glass style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.supTitle}>CREDIT CAPACITY</Text>
          <Text style={styles.mainTitle}>Financial Power</Text>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: `${tier.color}10`, borderColor: `${tier.color}30` }]}>
           <TierIcon size={10} color={tier.color} fill={tier.color} />
           <Text style={[styles.tierText, { color: tier.color }]}>{tier.name}</Text>
        </View>
      </View>

      <View style={styles.gaugeSection}>
        <View style={styles.gaugeWrapper}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={styles.svg}>
            <Defs>
              <LinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={tier.color} stopOpacity="1" />
                <Stop offset="1" stopColor="#064e3b" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            {/* Background Circle */}
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255,255,255,0.03)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Active Progress */}
            <AnimatedCircle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke="url(#gaugeGrad)"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.centerText}>
             <Text style={styles.scoreLabel}>CLIPSCORE</Text>
             <Text style={styles.scoreValue}>{score}</Text>
             <Text style={styles.scoreMax}>Institutional</Text>
          </View>
        </View>

        <View style={styles.statsColumn}>
           <View style={styles.statItem}>
              <Text style={styles.statLabel}>INSTANT LIMIT</Text>
              <Text style={styles.statValue}>GH₵ {limit.toLocaleString()}</Text>
           </View>
           <View style={styles.divider} />
           <View style={styles.statItem}>
              <Text style={styles.statLabel}>LIQUIDITY TIER</Text>
              <Text style={[styles.statValue, { color: tier.color }]}>{tier.name.split(' ')[0]}</Text>
           </View>
        </View>
      </View>

      <View style={styles.footer}>
         <View style={styles.footerInfo}>
            <ShieldCheck size={12} color="#10b981" />
            <Text style={styles.footerText}>Authorized by ClipCapital Governance</Text>
         </View>
         <ChevronRight size={14} color="#405045" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 32,
    backgroundColor: 'rgba(15,23,20,0.4)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  supTitle: {
    color: '#10b981',
    fontWeight: '900',
    fontSize: 9,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontFamily: 'Display-Bold',
    color: 'white',
    fontSize: 22,
    marginTop: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  gaugeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  gaugeWrapper: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerText: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: 'rgba(252,252,252,0.3)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scoreValue: {
    fontFamily: 'Display-Bold',
    color: 'white',
    fontSize: 32,
    marginVertical: 2,
  },
  scoreMax: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statsColumn: {
    flex: 1,
    gap: 16,
  },
  statItem: {
    gap: 4,
  },
  statLabel: {
    color: 'rgba(252,252,252,0.3)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statValue: {
    fontFamily: 'Display-Bold',
    color: 'white',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: '#405045',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
