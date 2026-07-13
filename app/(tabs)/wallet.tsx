import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Platform, Dimensions, ActivityIndicator, Vibration } from "react-native";
import { useProfile, useTransactionHistory, useUpdateProfile } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowUpRight, ArrowDownLeft, Plus, Landmark, History, Wallet as WalletIcon, Eye, EyeOff, ShieldCheck, ChevronRight, FileText, TrendingUp, Zap } from "lucide-react-native";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "@/context/language-context";
import { BlurView } from 'expo-blur';
import { KenteBackground } from "@/components/native/effects/kente-pattern";
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  Extrapolate
} from "react-native-reanimated";
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { AnimatedNumber } from "@/components/native/animated-number";

const { width, height } = Dimensions.get("window");

// --- Floating Money Particle Component for Wallet ---
function FloatingCurrency({ delay = 0 }: { delay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const [scale] = useState(() => 0.4 + Math.random() * 0.6);

  // Random start and end positions
  const startX = useState(() => (Math.random() * 320) - 160)[0];
  const startY = useState(() => (Math.random() * 200) - 100)[0];
  const driftX = useState(() => (Math.random() * 100) - 50)[0];
  const driftY = useState(() => (Math.random() * -150) - 50)[0];

  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1500 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    ));

    translateY.value = withDelay(delay, withRepeat(
      withTiming(driftY, { duration: 5000, easing: Easing.out(Easing.quad) }),
      -1,
      false
    ));

    translateX.value = withDelay(delay, withRepeat(
        withTiming(driftX, { duration: 5000, easing: Easing.out(Easing.quad) }),
        -1,
        false
    ));

    rotate.value = withDelay(delay, withRepeat(
      withTiming(Math.random() > 0.5 ? 360 : -360, { duration: 6000, easing: Easing.linear }),
      -1,
      false
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale }
    ],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: startY,
    marginLeft: startX,
  }));

  return (
    <Animated.View style={animatedStyle}>
        <Text style={{ color: '#10b981', fontSize: 14, fontFamily: 'Display-Bold', opacity: 0.6 }}>GH₵</Text>
    </Animated.View>
  );
}

export default function WalletScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const { data: profile, isLoading, refetch } = useProfile();
  const { data: history } = useTransactionHistory();
  const updateProfile = useUpdateProfile();

  const [localPrivate, setLocalPrivate] = useState<boolean | null>(null);
  const isPrivate = localPrivate ?? (profile?.privacy_mode_enabled ?? false);
  const isDark = theme === 'dark';

  // Parallax Tilt values
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      rotateX.value = interpolate(event.y, [-height / 2, height / 2], [10, -10], Extrapolate.CLAMP);
      rotateY.value = interpolate(event.x, [-width / 2, width / 2], [-10, 10], Extrapolate.CLAMP);
    })
    .onEnd(() => {
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { scale: scale.value }
    ],
  }));

  const togglePrivacy = async () => {
    const newVal = !isPrivate;
    setLocalPrivate(newVal);
    try {
      await updateProfile.mutateAsync({ privacy_mode_enabled: newVal });
    } catch (e) {
      setLocalPrivate(null);
      console.error(e);
    }
  };

  const walletTransactions = history?.slice(0, 8) || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KenteBackground />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor={colors.primary} onRefresh={refetch} progressViewOffset={Platform.OS === 'ios' ? 110 : 0} />}
      >
        <View style={{ paddingHorizontal: 20 }}>

          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <View>
              <View style={styles.supHeaderRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.supHeaderText, { color: colors.primary }]}>VAULT PROTOCOL v4.2</Text>
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{t.wallet}</Text>
            </View>
            <BouncyTap vibrate={true} onPress={togglePrivacy} style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
              {isPrivate ? <EyeOff size={20} color={colors.primary} /> : <Eye size={20} color={colors.textDim} />}
            </BouncyTap>
          </Animated.View>

          {/* Premium Balance Section with 3D Tilt */}
          <GestureDetector gesture={gesture}>
            <Animated.View entering={FadeInDown.delay(200)} style={animatedCardStyle}>
                <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.balanceCardGlass, { borderColor: colors.border }]}>
                    {/* Floating Money Particles */}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        {Array.from({ length: 25 }).map((_, i) => (
                            <FloatingCurrency key={i} delay={i * 250} />
                        ))}
                    </View>

                    <View style={styles.balanceHeader}>
                    <View style={styles.balanceLabelRow}>
                        <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                        <Text style={[styles.balanceLabel, { color: colors.textDim }]}>{t.available_liquidity}</Text>
                    </View>
                    <ShieldCheck size={14} color={colors.primary} />
                    </View>

                    <View style={{ height: 60, justifyContent: 'center', marginBottom: 24 }}>
                        {isPrivate ? (
                            <Text style={[styles.balanceAmount, { color: colors.text, letterSpacing: 8 }]}>••••••••</Text>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                <Text style={{ color: colors.textDim, fontSize: 20, fontFamily: 'Display-Bold', marginRight: 8 }}>GH₵</Text>
                                <AnimatedNumber
                                    value={profile?.wallet_balance || 0}
                                    style={[styles.balanceAmount, { color: colors.text, marginBottom: 0 }]}
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.balanceFooter}>
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + '10' }]}>
                        <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
                        <Text style={[styles.verifiedText, { color: colors.primary }]}>{t.secure_vault}</Text>
                    </View>
                    <Text style={[styles.accountType, { color: colors.textDim }]}>INSTITUTIONAL v4.2</Text>
                    </View>
                </BlurView>
            </Animated.View>
          </GestureDetector>

          {/* High-End Action Buttons */}
          <View style={styles.actionRow}>
            <Animated.View entering={FadeInDown.delay(300)} style={{ flex: 1 }}>
                <BouncyTap onPress={() => router.push("/topup")}>
                <LinearGradient
                    colors={[colors.primary, "#059669"]}
                    style={styles.actionBtnPremium}
                >
                    <Plus size={20} color="#000" strokeWidth={3} />
                    <Text style={styles.actionBtnTextPremium}>{t.add_funds}</Text>
                </LinearGradient>
                </BouncyTap>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400)} style={{ flex: 1 }}>
                <BouncyTap onPress={() => router.push("/withdraw")}>
                <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.actionBtnInstitutional, { borderColor: colors.border }]}>
                    <Landmark size={18} color={colors.primary} />
                    <Text style={[styles.actionBtnTextInstitutional, { color: colors.text }]}>{t.payout}</Text>
                </BlurView>
                </BouncyTap>
            </Animated.View>
          </View>

          {/* Quick Stats / Info */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.statsRow}>
            <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.statCardSmall, { borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <TrendingUp size={10} color={colors.primary} />
                  <Text style={[styles.statLabelSmall, { color: colors.textDim, marginBottom: 0 }]}>{t.monthly_flow}</Text>
              </View>
              <Text style={[styles.statValueSmall, { color: colors.primary }]}>+ GH₵ 1,240</Text>
            </BlurView>
            <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.statCardSmall, { borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Zap size={10} color={colors.gold} fill={colors.gold} />
                  <Text style={[styles.statLabelSmall, { color: colors.textDim, marginBottom: 0 }]}>{t.trust_tier}</Text>
              </View>
              <Text style={[styles.statValueSmall, { color: colors.gold }]}>{t.elite}</Text>
            </BlurView>
          </Animated.View>

          {/* Transaction Section */}
          <View style={styles.sectionHeader}>
            <Animated.Text entering={FadeInRight.delay(600)} style={[styles.sectionTitle, { color: colors.textDim }]}>{t.ledger.toUpperCase()} ACTIVITY</Animated.Text>
            <TouchableOpacity onPress={() => router.push("/history")} style={styles.seeAllBtn}>
              <Text style={{ color: colors.primary, fontFamily: 'Display-Bold', fontSize: 11 }}>{t.view_all}</Text>
              <ChevronRight size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 12, marginBottom: 32 }}>
            {walletTransactions.length === 0 ? (
              <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.emptyCard, { borderColor: colors.border }]}>
                <History size={40} color={colors.textDim} />
                <Text style={[styles.emptyText, { color: colors.textDim }]}>{t.no_transactions}</Text>
              </BlurView>
            ) : (
              walletTransactions.map((item, idx) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(700 + (idx * 50))}>
                    <BlurView intensity={isDark ? 15 : 30} tint={isDark ? "dark" : "light"} style={[styles.activityItem, { borderColor: colors.border }]}>
                        <View style={[styles.activityIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            {item.amount > 0 ? <ArrowUpRight size={16} color={colors.primary} /> : <ArrowDownLeft size={16} color={colors.destructive} />}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontFamily: 'Display-Bold', fontSize: 13 }} numberOfLines={1}>{item.note || item.title}</Text>
                            <Text style={{ color: colors.textDim, fontSize: 10, fontFamily: 'Display-Bold', opacity: 0.6 }}>{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: item.amount > 0 ? colors.primary : colors.text, fontFamily: 'Display-Bold', fontSize: 14 }}>
                                {item.amount > 0 ? '+' : ''}{isPrivate ? "••••" : item.amount.toLocaleString()}
                            </Text>
                            <Text style={{ color: colors.textDim, fontSize: 8, fontFamily: 'Display-Bold', opacity: 0.5 }}>GHS</Text>
                        </View>
                    </BlurView>
                </Animated.View>
              ))
            )}
          </View>

          <View style={styles.securityNote}>
             <ShieldCheck size={12} color={colors.textDim} />
             <Text style={[styles.securityText, { color: colors.textDim }]}>{t.secured_by}</Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 140, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingHorizontal: 4 },
  supHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  supHeaderText: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1.5, opacity: 0.8 },
  headerTitle: { fontFamily: 'Display-Bold', fontSize: 30, letterSpacing: -0.5 },
  headerBtn: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  balanceCardGlass: { padding: 24, borderRadius: 32, borderWidth: 1, marginBottom: 32, overflow: 'hidden' },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceLabel: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 2 },
  balanceAmount: { fontFamily: 'Display-Bold', fontSize: 44, letterSpacing: -1, marginBottom: 24 },
  balanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
  verifiedText: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1 },
  accountType: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1, opacity: 0.8 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  actionBtnPremium: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnTextPremium: { fontFamily: 'Display-Bold', fontSize: 11, color: '#000', letterSpacing: 1 },
  actionBtnInstitutional: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    width: '100%',
    flexGrow: 1
  },
  actionBtnTextInstitutional: { fontFamily: 'Display-Bold', fontSize: 11, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  statCardSmall: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statLabelSmall: { fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 1.5, marginBottom: 4 },
  statValueSmall: { fontFamily: 'Display-Bold', fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 1.5 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emptyCard: { padding: 40, alignItems: 'center', gap: 12, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed' },
  emptyText: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 1 },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 22, borderWidth: 1, gap: 12, overflow: 'hidden' },
  activityIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, opacity: 0.6 },
  securityText: { fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 1 }
});
