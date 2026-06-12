import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, G, Line } from 'react-native-svg';
import { Card } from './card';
import { Zap, ShieldCheck, TrendingUp, ChevronRight, Activity } from 'lucide-react-native';
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated';
import { BouncyTap } from './bouncy-tap';

const { width } = Dimensions.get('window');
const GAUGE_SIZE = 180;
const STROKE_WIDTH = 14;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH - 20) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

interface Props {
  score: number;
  limit: number;
  loading?: boolean;
}

export function CreditCapacityGauge({ score, limit, loading }: Props) {
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

  // Generate Ticks
  const ticks = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    const x1 = GAUGE_SIZE / 2 + (RADIUS + 8) * Math.cos(angle);
    const y1 = GAUGE_SIZE / 2 + (RADIUS + 8) * Math.sin(angle);
    const x2 = GAUGE_SIZE / 2 + (RADIUS + 14) * Math.cos(angle);
    const y2 = GAUGE_SIZE / 2 + (RADIUS + 14) * Math.sin(angle);
    return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
  });

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
          <Text style={styles.supTitle}>VAULT PROTOCOL</Text>
          <Text style={styles.mainTitle}>Financial Capacity</Text>
        </View>
        <View style={[styles.tierBadge, { borderColor: `${tier.color}40`, backgroundColor: `${tier.color}08` }]}>
           <Activity size={10} color={tier.color} />
           <Text style={[styles.tierText, { color: tier.color }]}>{tier.label} STATUS</Text>
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
              <LinearGradient id="recessed" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="rgba(0,0,0,0.5)" stopOpacity="1" />
                <Stop offset="1" stopColor="rgba(255,255,255,0.02)" stopOpacity="0.5" />
              </LinearGradient>
            </Defs>

            {ticks}

            {/* Recessed Track */}
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke="url(#recessed)"
              strokeWidth={STROKE_WIDTH + 4}
              fill="none"
            />

            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255,255,255,0.02)"
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

            {/* Center Hub */}
            <Circle
                cx={GAUGE_SIZE / 2}
                cy={GAUGE_SIZE / 2}
                r={RADIUS - 12}
                fill="#0f1714"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="1"
            />
          </Svg>

          <View style={styles.centerText}>
             <Text style={styles.scoreLabel}>CLIPSCORE</Text>
             <Text style={styles.scoreValue}>{score}</Text>
             <View style={styles.verifiedRow}>
                <ShieldCheck size={10} color="#10b981" />
                <Text style={styles.scoreMax}>SECURED</Text>
             </View>
          </View>
        </View>

        <View style={styles.statsColumn}>
           <View style={styles.statItem}>
              <Text style={styles.statLabel}>LIQUIDITY LIMIT</Text>
              <Text style={styles.statValue}>GH₵ {limit.toLocaleString(undefined, { minimumFractionDigits: 0 })}</Text>
           </View>
           <View style={styles.divider} />
           <View style={styles.statItem}>
              <Text style={styles.statLabel}>CURRENT TIER</Text>
              <Text style={[styles.statValue, { color: tier.color }]}>{tier.name}</Text>
           </View>
        </View>
      </View>

      <View style={styles.footer}>
         <Text style={styles.footerText}>Institutional Credit Assessment • Ver: 4.2.0</Text>
         <BouncyTap onPress={() => {}} style={styles.auditBtn}>
            <Text style={styles.auditText}>VIEW AUDIT</Text>
            <ChevronRight size={10} color="#10b981" />
         </BouncyTap>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 36,
    backgroundColor: '#0d1310',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
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
    fontSize: 24,
    marginTop: 6,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
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
    backgroundColor: '#0f1714',
    width: RADIUS * 2 - 10,
    height: RADIUS * 2 - 10,
    borderRadius: RADIUS,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)'
  },
  scoreLabel: {
    color: '#7d8a84',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 3,
  },
  scoreValue: {
    fontFamily: 'Display-Bold',
    color: 'white',
    fontSize: 38,
    marginVertical: 4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreMax: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statsColumn: {
    flex: 1,
    gap: 20,
  },
  statItem: {
    gap: 6,
  },
  statLabel: {
    color: '#405045',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statValue: {
    fontFamily: 'Display-Bold',
    color: 'white',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  footerText: {
    color: '#334140',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  auditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,185,129,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  auditText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
  }
});
