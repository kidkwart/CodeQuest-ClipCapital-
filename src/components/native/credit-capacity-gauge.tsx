import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { Card } from './card';
import { Zap, ShieldCheck, TrendingUp, ChevronRight, Activity, Shield } from 'lucide-react-native';
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated';
import { BouncyTap } from './bouncy-tap';
import { useTheme } from "@/context/theme-context";

const { width } = Dimensions.get('window');
const GAUGE_SIZE = 180;
const STROKE_WIDTH = 12;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH - 30) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  score: number;
  limit: number;
  loading?: boolean;
  onAudit?: () => void;
}

export function CreditCapacityGauge({ score, limit, loading, onAudit }: Props) {
  const { colors, theme } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    const percentage = Math.min(100, Math.max(0, ((score - 100) / 750) * 100));
    progress.value = withSpring(percentage / 100, { damping: 15 });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const getTier = (s: number) => {
    if (s >= 800) return { name: "ELITE ARTISAN", color: "#f59e0b", icon: Zap, label: 'PRESTIGE' };
    if (s >= 650) return { name: "MASTER CRAFT", color: "#10b981", icon: ShieldCheck, label: 'MASTER' };
    return { name: "PRO-LEVEL", color: "#3b82f6", icon: TrendingUp, label: 'ESTABLISHED' };
  };

  const tier = getTier(score);
  const TierIcon = tier.icon;

  const ticks = Array.from({ length: 24 }).map((_, i) => {
    const angle = (i * 15 * Math.PI) / 180;
    const x1 = GAUGE_SIZE / 2 + (RADIUS + 10) * Math.cos(angle);
    const y1 = GAUGE_SIZE / 2 + (RADIUS + 10) * Math.sin(angle);
    const x2 = GAUGE_SIZE / 2 + (RADIUS + 15) * Math.cos(angle);
    const y2 = GAUGE_SIZE / 2 + (RADIUS + 15) * Math.sin(angle);
    return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
  });

  if (loading) {
    return (
      <Card glass style={styles.container}>
        <ActivityIndicator color="#10b981" />
      </Card>
    );
  }

  return (
    <Card glass style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      {/* 1. Header Protocol */}
      <View style={styles.header}>
        <View style={[styles.headerBadge, { backgroundColor: colors.primary + '05', borderColor: colors.primary + '10' }]}>
           <Shield size={10} color={colors.primary} fill={colors.primary + '20'} />
           <Text style={[styles.supTitle, { color: colors.primary }]}>VAULT PROTOCOL v4.2</Text>
        </View>
        <Text style={[styles.mainTitle, { color: colors.text }]}>Financial Capacity</Text>
      </View>

      {/* 2. Central Gauge (Symmetrical) */}
      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeWrapper}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={styles.svg}>
            <Defs>
              <LinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={tier.color} stopOpacity="1" />
                <Stop offset="1" stopColor={theme === 'dark' ? "#064e3b" : colors.primary} stopOpacity="1" />
              </LinearGradient>
            </Defs>

            {ticks}

            {/* Background Track */}
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke={colors.border}
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
              animatedProps={animatedProps}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
            />
          </Svg>

          <View style={styles.centerInfo}>
             <Text style={[styles.scoreLabel, { color: colors.textDim }]}>CLIPSCORE</Text>
             <Text style={[styles.scoreValue, { color: colors.text }]}>{score}</Text>
             <View style={[styles.tierLabel, { backgroundColor: `${tier.color}15` }]}>
                <Text style={[styles.tierLabelText, { color: tier.color }]}>{tier.label} STATUS</Text>
             </View>
          </View>
        </View>
      </View>

      {/* 3. Balanced Stats Row */}
      <View style={[styles.statsRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={styles.statBox}>
           <Text style={[styles.statLabel, { color: colors.textDim }]}>LIQUIDITY LIMIT</Text>
           <Text style={[styles.statValue, { color: colors.text }]}>GH₵ {limit.toLocaleString()}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statBox}>
           <Text style={[styles.statLabel, { color: colors.textDim }]}>IDENTITY TIER</Text>
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <TierIcon size={12} color={tier.color} fill={tier.color} />
              <Text style={[styles.statValue, { color: tier.color }]}>{tier.name.split(' ')[0]}</Text>
           </View>
        </View>
      </View>

      {/* 4. Footer Audit */}
      <View style={styles.footer}>
         <View style={styles.footerLeft}>
            <Activity size={12} color={colors.textDim} />
            <Text style={[styles.footerText, { color: colors.textDim }]}>Real-time Credit Assessment</Text>
         </View>
         <BouncyTap onPress={onAudit} style={[styles.auditBtn, { borderColor: colors.primary + '30' }]}>
            <Text style={[styles.auditText, { color: colors.primary }]}>AUDIT</Text>
            <ChevronRight size={10} color={colors.primary} />
         </BouncyTap>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    marginBottom: 40,
    borderRadius: 36,
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  supTitle: {
    fontWeight: '900',
    fontSize: 8,
    letterSpacing: 3,
  },
  mainTitle: {
    fontFamily: 'Display-Bold',
    fontSize: 22,
    marginTop: 10,
    letterSpacing: -0.5
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
  centerInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
  },
  scoreValue: {
    fontFamily: 'Display-Bold',
    fontSize: 44,
    marginVertical: 2,
    letterSpacing: -1
  },
  tierLabel: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  tierLabelText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Display-Bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 4,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  auditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  auditText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  }
});
