import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Line, Rect } from 'react-native-svg';
import { Card } from './card';
import { Zap, ShieldCheck, TrendingUp, ChevronRight, Activity, Shield } from 'lucide-react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { BouncyTap } from './bouncy-tap';
import { useTheme } from "@/context/theme-context";
import { AnimatedNumber } from './animated-number';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get("window");
const GAUGE_SIZE = 180;
const STROKE_WIDTH = 12;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH - 30) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// --- Floating Particle Component ---
function FloatingGain({ delay = 0 }: { delay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const [val] = useState(() => Math.floor(Math.random() * 50) + 5);
  const [posX] = useState(() => (Math.random() * 260) - 130);

  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200 }),
        withTiming(0, { duration: 1800 })
      ),
      -1,
      false
    ));
    translateY.value = withDelay(delay, withRepeat(
      withTiming(-150, { duration: 3000, easing: Easing.out(Easing.quad) }),
      -1,
      false
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { translateX: posX }],
    position: 'absolute',
    bottom: 20,
    left: '50%',
  }));

  return (
    <Animated.Text style={[animatedStyle, { color: '#10b981', fontSize: 10, fontWeight: 'bold', fontFamily: 'Display-Bold' }]}>
      +{val}
    </Animated.Text>
  );
}

// --- Data Stream Component ---
function DataStream({ delay = 0 }: { delay: number }) {
  const translateY = useSharedValue(-100);
  const posX = useState(() => Math.random() * (width - 48))[0];

  useEffect(() => {
    translateY.value = withDelay(delay, withRepeat(
      withTiming(400, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(translateY.value, [-50, 150, 350], [0, 0.1, 0]),
  }));

  return (
    <Animated.View style={[style, { position: 'absolute', left: posX, width: 1, height: 40, backgroundColor: '#10b981' }]} />
  );
}

// --- Floating Background Orb ---
function BackgroundOrb({ delay = 0, size = 100, color = "#10b981" }: { delay?: number, size?: number, color?: string }) {
    const translationY = useSharedValue(0);
    const translationX = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        translationY.value = withDelay(delay, withRepeat(
            withSequence(withTiming(-20, { duration: 4000 }), withTiming(20, { duration: 4000 })),
            -1, true
        ));
        translationX.value = withDelay(delay, withRepeat(
            withSequence(withTiming(20, { duration: 5000 }), withTiming(-20, { duration: 5000 })),
            -1, true
        ));
        scale.value = withDelay(delay, withRepeat(
            withSequence(withTiming(1.2, { duration: 3000 }), withTiming(0.8, { duration: 3000 })),
            -1, true
        ));
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: translationY.value }, { translateX: translationX.value }, { scale: scale.value }],
        opacity: 0.05,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        position: 'absolute',
    }));

    return <Animated.View style={[style, { top: 50, left: 100 }]} />;
}

interface TickProps {
    index: number;
    angle: number;
    activeProgress: Animated.SharedValue<number>;
}

function Tick({ index, angle, activeProgress }: TickProps) {
    const x1 = GAUGE_SIZE / 2 + (RADIUS + 10) * Math.cos(angle);
    const y1 = GAUGE_SIZE / 2 + (RADIUS + 10) * Math.sin(angle);
    const x2 = GAUGE_SIZE / 2 + (RADIUS + 15) * Math.cos(angle);
    const y2 = GAUGE_SIZE / 2 + (RADIUS + 15) * Math.sin(angle);

    const animatedStyle = useAnimatedStyle(() => {
        const tickProgress = (index / 24);
        const isActive = activeProgress.value >= tickProgress;
        return {
            opacity: withTiming(isActive ? 0.8 : 0.08, { duration: 300 }),
            strokeWidth: withTiming(isActive ? 1.5 : 1, { duration: 300 }),
        };
    });

    return <AnimatedLine x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10b981" style={animatedStyle} />;
}

interface Props {
  score: number;
  limit: number;
  loading?: boolean;
  onAudit?: () => void;
}

export function CreditCapacityGauge({ score, limit, loading, onAudit }: Props) {
  const { colors, theme } = useTheme();
  const progress = useSharedValue(0);
  const breath = useSharedValue(1);
  const rotation = useSharedValue(0);
  const scanlineY = useSharedValue(-50);
  const auditPulse = useSharedValue(1);

  // Parallax Tilt values
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  useEffect(() => {
    const percentage = Math.min(100, Math.max(0, ((score - 100) / 750) * 100));
    progress.value = withSpring(percentage / 100, { damping: 15 });

    breath.value = withRepeat(
        withSequence(withTiming(1.02, { duration: 2500, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 2500 })),
        -1, true
    );

    rotation.value = withRepeat(
        withTiming(360, { duration: 12000, easing: Easing.linear }),
        -1, false
    );

    scanlineY.value = withRepeat(
        withTiming(400, { duration: 6000, easing: Easing.inOut(Easing.quad) }),
        -1, true
    );

    auditPulse.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1, true
    );
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const headHighlightProps = useAnimatedProps(() => {
    const angle = (progress.value * 360 - 90) * (Math.PI / 180);
    return {
        cx: GAUGE_SIZE / 2 + RADIUS * Math.cos(angle),
        cy: GAUGE_SIZE / 2 + RADIUS * Math.sin(angle),
    };
  });

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      rotateX.value = interpolate(event.y, [-height / 2, height / 2], [8, -8], Extrapolate.CLAMP);
      rotateY.value = interpolate(event.x, [-width / 2, width / 2], [-8, 8], Extrapolate.CLAMP);
    })
    .onEnd(() => {
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { scale: breath.value }
    ],
  }));

  const scanlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanlineY.value }],
    opacity: 0.1,
  }));

  const glowRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  const auditAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auditPulse.value }],
    shadowOpacity: interpolate(auditPulse.value, [1, 1.1], [0.1, 0.4]),
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
    return <Tick key={i} index={i} angle={angle} activeProgress={progress} />;
  });

  // Create plenty of floating gain particles
  const floatingGains = Array.from({ length: 15 }).map((_, i) => (
    <FloatingGain key={i} delay={i * 400} />
  ));

  if (loading) {
    return (
      <Card glass style={styles.container}>
        <ActivityIndicator color="#10b981" />
      </Card>
    );
  }

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle} entering={FadeInDown.duration(800)}>
        <Card glass style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border, overflow: 'hidden' }]}>

          {/* Background Elements */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
             <BackgroundOrb delay={0} size={150} color={tier.color} />
             <BackgroundOrb delay={1000} size={100} color={colors.primary} />

             {/* Scanline Effect */}
             <Animated.View style={[styles.scanline, scanlineStyle, { backgroundColor: colors.primary }]} />

             {[0, 1000, 2000, 3000].map(delay => (
               <DataStream key={delay} delay={delay} />
             ))}

             {floatingGains}
          </View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
            <View style={[styles.headerBadge, { backgroundColor: colors.primary + '05', borderColor: colors.primary + '10' }]}>
               <Shield size={10} color={colors.primary} fill={colors.primary + '20'} />
               <Text style={[styles.supTitle, { color: colors.primary }]}>VAULT PROTOCOL v4.2</Text>
            </View>
            <Text style={[styles.mainTitle, { color: colors.text }]}>Financial Capacity</Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(400)} style={styles.gaugeContainer}>
            <View style={styles.gaugeWrapper}>

              {/* Rotating Glow Effect */}
              <Animated.View style={[styles.glowRing, glowRotationStyle, { borderColor: tier.color, opacity: 0.12 }]} />

              <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} style={styles.svg}>
                <Defs>
                  <LinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={tier.color} stopOpacity="1" />
                    <Stop offset="1" stopColor={theme === 'dark' ? "#064e3b" : colors.primary} stopOpacity="1" />
                  </LinearGradient>
                </Defs>

                {ticks}

                <Circle
                  cx={GAUGE_SIZE / 2}
                  cy={GAUGE_SIZE / 2}
                  r={RADIUS}
                  stroke={colors.border}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  opacity={0.3}
                />

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

                <AnimatedCircle
                    r={4}
                    fill="#fff"
                    animatedProps={headHighlightProps}
                />
              </Svg>

              <View style={styles.centerInfo}>
                 <Text style={[styles.scoreLabel, { color: colors.textDim }]}>CLIPSCORE</Text>
                 <AnimatedNumber value={score} style={[styles.scoreValue, { color: colors.text }]} />
                 <Animated.View entering={FadeIn.delay(600)} style={[styles.tierLabel, { backgroundColor: `${tier.color}15` }]}>
                    <Text style={[styles.tierLabelText, { color: tier.color }]}>{tier.label} STATUS</Text>
                 </Animated.View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500)} style={[styles.statsRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.statBox}>
               <Text style={[styles.statLabel, { color: colors.textDim }]}>LIQUIDITY LIMIT</Text>
               <AnimatedNumber value={limit} prefix="GH₵ " style={[styles.statValue, { color: colors.text }]} />
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
               <Text style={[styles.statLabel, { color: colors.textDim }]}>IDENTITY TIER</Text>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <TierIcon size={12} color={tier.color} fill={tier.color} />
                  <Text style={[styles.statValue, { color: tier.color }]}>{tier.name.split(' ')[0]}</Text>
               </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(800)} style={styles.footer}>
             <View style={styles.footerLeft}>
                <Activity size={12} color={colors.textDim} />
                <Text style={[styles.footerText, { color: colors.textDim }]}>Real-time Credit Assessment</Text>
             </View>
             <Animated.View style={auditAnimatedStyle}>
                <BouncyTap onPress={onAudit} style={[styles.auditBtn, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '05' }]}>
                    <Text style={[styles.auditText, { color: colors.primary }]}>AUDIT</Text>
                    <ChevronRight size={10} color={colors.primary} />
                </BouncyTap>
             </Animated.View>
          </Animated.View>
        </Card>
      </Animated.View>
    </GestureDetector>
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
  glowRing: {
    position: 'absolute',
    width: GAUGE_SIZE + 20,
    height: GAUGE_SIZE + 20,
    borderRadius: (GAUGE_SIZE + 20) / 2,
    borderWidth: 10,
    borderStyle: 'dashed',
  },
  scanline: {
    position: 'absolute',
    width: '150%',
    height: 1,
    left: '-25%',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  auditText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  }
});
