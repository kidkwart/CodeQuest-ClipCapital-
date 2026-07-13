import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, SafeAreaView, Platform, StyleSheet, Vibration, Dimensions } from "react-native";
import { useProfile, useClipScore, useRecentActivity, useAddIncome, useMyRoles, useWeeklyPerformance, useUserHealth, useUpdateProfile } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Plus, TrendingUp, ShoppingBag, ArrowUpRight, ArrowDownLeft, MessageCircle, Bell, ShieldCheck, ArrowDownToLine, Check, Eye, EyeOff, LayoutGrid, Zap, MapPin, FileText, BookOpen, Scan, ShieldAlert, HelpCircle, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { ClipScoreBreakdown } from "@/components/native/clipscore-breakdown";
import { CreditCapacityGauge } from "@/components/native/credit-capacity-gauge";
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "@/context/language-context";
import { BlurView } from 'expo-blur';
import { KenteBackground } from "@/components/native/effects/kente-pattern";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInRight, Layout, FadeIn, useSharedValue, useAnimatedStyle, withSequence, withTiming, interpolateColor } from "react-native-reanimated";

import { AnimatedNumber } from "@/components/native/animated-number";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const roles = useMyRoles();
  const { user } = useCurrentUser();
  const { score } = useClipScore();
  const activity = useRecentActivity(10);
  const performance = useWeeklyPerformance();
  const health = useUserHealth(user?.id || "");
  const addIncome = useAddIncome();
  const updateProfile = useUpdateProfile();
  const [incomeAmt, setIncomeAmt] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [showScoreAudit, setShowScoreAudit] = useState(false);

<<<<<<< HEAD
  const isAdmin = roles.data?.includes("admin");
=======
  // Animation for success feedback
  const successPulse = useSharedValue(0);

  const isAdmin = roles.data?.includes("admin") || user?.email === "bernardyawkwarteng8@gmail.com";
>>>>>>> 132121a (Enhancement: Added Java Native Module, Multi-language support (6 languages), and UI overhaul for Susu and Settings pages)
  const [localPrivate, setLocalPrivate] = useState<boolean | null>(null);
  const isPrivate = localPrivate ?? (profile?.privacy_mode_enabled ?? false);
  const isDark = theme === 'dark';

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

  const todayTotal = performance.data?.revenueData?.[performance.data?.todayIndex] || 0;

  const handleLogIncome = async () => {
    if (addIncome.isPending) return;
    if (!incomeAmt || isNaN(Number(incomeAmt))) return;

    try {
      Vibration.vibrate(Platform.OS === 'ios' ? 1 : 50);
      const localDate = new Date().toLocaleDateString('en-CA');
      await addIncome.mutateAsync({
        amount: Number(incomeAmt),
        note: "Daily Revenue Log",
        entry_date: localDate
      });

      // Trigger success animation
      successPulse.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 1000 })
      );

      setIncomeAmt("");
      setIsLogged(true);
      setTimeout(() => setIsLogged(false), 3000);
    } catch (e: any) {
      alert(e.message || "Failed to log income");
    }
  };

  const revenueCardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      successPulse.value,
      [0, 1],
      [colors.border, colors.primary]
    ),
    transform: [{ scale: 1 + successPulse.value * 0.02 }]
  }));

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KenteBackground />

      <SafeAreaView style={{ flex: 0, backgroundColor: 'transparent' }} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isProfileLoading || performance.isLoading} tintColor={colors.primary} />}
      >
        <View style={{ paddingHorizontal: 20 }}>

          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.supHeaderRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.supHeaderText, { color: colors.primary }]}>{t.institutional_grade}</Text>
              </View>
              <Text numberOfLines={1} style={[styles.greetingText, { color: colors.text }]}>
                {t.greeting}, {profile?.display_name?.split(' ')[0] || "Artisan"}
              </Text>
              {profile?.location && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                   <MapPin size={10} color={colors.textDim} />
                   <Text style={{ color: colors.textDim, fontSize: 10, fontFamily: 'Display-Bold', opacity: 0.7 }}>{profile.location.toUpperCase()}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              <BouncyTap onPress={() => router.push("/scan")} hitSlop={12} style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                <Scan size={20} color={colors.primary} />
              </BouncyTap>
              <BouncyTap onPress={() => router.push("/notifications")} hitSlop={12} style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                <Bell size={20} color={colors.primary} />
              </BouncyTap>
            </View>
          </Animated.View>

          {/* Main Gauge */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ marginBottom: 24 }}>
            <CreditCapacityGauge
              score={score}
              limit={score * 10}
              loading={isProfileLoading}
              onAudit={() => setShowScoreAudit(!showScoreAudit)}
            />
          </Animated.View>

          {showScoreAudit && (
            <Animated.View entering={FadeIn.duration(400)} style={{ marginBottom: 24 }}>
              <ClipScoreBreakdown
                score={score}
                health={health.data}
                loading={health.isLoading}
              />
            </Animated.View>
          )}

          {/* Quick Action Cards Row */}
          <View style={styles.cardRow}>
              <BouncyTap onPress={() => router.push("/withdraw")} style={{ flex: 1 }}>
                <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.quickCard, { borderColor: colors.border }]}>
                    <View style={[styles.qIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                        <ArrowDownToLine size={20} color="#3b82f6" />
                    </View>
                    <Text style={[styles.qLabel, { color: colors.text }]}>{t.payout}</Text>
                </BlurView>
              </BouncyTap>
              <BouncyTap onPress={() => router.push("/history")} style={{ flex: 1 }}>
                <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.quickCard, { borderColor: colors.border }]}>
                    <View style={[styles.qIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                        <FileText size={20} color="#8b5cf6" />
                    </View>
                    <Text style={[styles.qLabel, { color: colors.text }]}>{t.history}</Text>
                </BlurView>
              </BouncyTap>
          </View>

          {/* Revenue Quick Log */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={[styles.revenueWrapper, revenueCardStyle]}>
            <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.revenueCard, { borderColor: 'transparent' }]}>
              <View style={{ padding: 20 }}>
                <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardLabel, { color: colors.textDim }]}>{t.log_revenue}</Text>
                    <TrendingUp size={14} color={colors.primary} />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
                    <Text style={{ color: colors.primary, fontSize: 18, fontFamily: 'Display-Bold', marginRight: 8 }}>GH₵</Text>
                    <TextInput
                      value={incomeAmt}
                      onChangeText={setIncomeAmt}
                      placeholder="0.00"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                      style={{ flex: 1, color: colors.text, fontSize: 22, fontFamily: 'Display-Bold' }}
                    />
                  </View>
                  <BouncyTap onPress={handleLogIncome} disabled={addIncome.isPending || !incomeAmt}>
                    <LinearGradient
                        colors={[colors.primary, "#15803d"]}
                        style={styles.plusBtn}
                    >
                        {addIncome.isPending ? <ActivityIndicator color="#000" size="small" /> : <Plus size={26} color="#000" strokeWidth={3} />}
                    </LinearGradient>
                  </BouncyTap>
                </View>

                <View style={styles.revenueFooter}>
                   <Text style={{ color: colors.textDim, fontSize: 11, fontFamily: 'Display-Bold' }}>{t.daily_accumulation}</Text>
                   <AnimatedNumber
                      value={isPrivate ? 0 : todayTotal}
                      prefix={isPrivate ? "••••" : "GH₵ "}
                      style={{ color: colors.text, fontFamily: 'Display-Bold', fontSize: 16 }}
                   />
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Business Tools Grid */}
          <View style={{ marginBottom: 32 }}>
            <View style={styles.sectionHeader}>
                <Animated.Text entering={FadeInRight.delay(400)} style={[styles.sectionTitle, { color: colors.textDim }]}>{t.business_tools}</Animated.Text>
                <LayoutGrid size={14} color={colors.textDim} />
            </View>

            <View style={styles.grid}>
              <ToolItem index={0} icon={ShoppingBag} label={t.market} onPress={() => router.push("/market")} color="#e11d48" />
              <ToolItem index={1} icon={ShieldCheck} label={t.vault} onPress={() => router.push("/vault")} color={colors.gold} />
              <ToolItem index={2} icon={BookOpen} label={t.academy} onPress={() => router.push("/academy")} color="#ec4899" />
              <ToolItem index={3} icon={FileText} label={t.invoices} onPress={() => router.push("/invoices")} color="#8b5cf6" />
              <ToolItem index={4} icon={Zap} label={t.my_qr} onPress={() => router.push("/my-qr")} color="#f59e0b" />
              <ToolItem index={5} icon={isPrivate ? EyeOff : Eye} label={t.privacy} onPress={togglePrivacy} color={isPrivate ? colors.primary : colors.textDim} />
              <ToolItem index={6} icon={HelpCircle} label={t.support} onPress={() => router.push("/support")} color="#3b82f6" />
              {isAdmin && <ToolItem index={7} icon={ShieldAlert} label={t.admin} onPress={() => router.push("/admin")} color={colors.destructive} />}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activityHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Animated.Text entering={FadeInRight.delay(500)} style={[styles.activityTitle, { color: colors.text }]}>{t.ledger}</Animated.Text>
                <View style={[styles.activityCount, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={{ color: colors.primary, fontSize: 10, fontFamily: 'Display-Bold' }}>{activity.data?.length || 0}</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => router.push("/history")} style={styles.viewAllBtn}>
              <Text style={{ color: colors.primary, fontFamily: 'Display-Bold', fontSize: 11 }}>{t.view_all}</Text>
              <ChevronRight size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 12 }}>
            {activity.data?.slice(0, 4).map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(600 + (index * 100)).duration(500)}
                layout={Layout.springify()}
              >
                <BlurView intensity={isDark ? 15 : 30} tint={isDark ? "dark" : "light"} style={[styles.activityItem, { borderColor: colors.border }]}>
                    <View style={[styles.activityIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        {item.amount > 0 ? <ArrowUpRight size={16} color={colors.primary} /> : <ArrowDownLeft size={16} color={colors.destructive} />}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontFamily: 'Display-Bold', fontSize: 13 }} numberOfLines={1}>{item.note || "Transaction"}</Text>
                        <Text style={{ color: colors.textDim, fontSize: 10, fontFamily: 'Display-Bold', opacity: 0.6 }}>{formatActivityDate(item.date).toUpperCase()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: item.amount > 0 ? colors.primary : colors.text, fontFamily: 'Display-Bold', fontSize: 14 }}>
                            {item.amount > 0 ? '+' : ''}{isPrivate ? "••••" : item.amount.toLocaleString()}
                        </Text>
                        <Text style={{ color: colors.textDim, fontSize: 8, fontFamily: 'Display-Bold', opacity: 0.5 }}>GHS</Text>
                    </View>
                </BlurView>
              </Animated.View>
            ))}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

function ToolItem({ icon: Icon, label, onPress, color, index, vibrate }: any) {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <Animated.View entering={FadeInDown.delay(400 + (index * 50)).springify()} style={styles.gridItem}>
            <BouncyTap onPress={onPress} vibrate={vibrate} style={{ width: '100%' }} containerStyle={{ alignItems: 'center' }}>
                <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.toolIconBox, { borderColor: colors.border }]}>
                    <View style={[styles.toolInner, { backgroundColor: color + '15' }]}>
                        <Icon size={22} color={color} />
                    </View>
                </BlurView>
                <Text numberOfLines={1} style={[styles.toolLabel, { color: colors.textDim }]}>{label.toUpperCase()}</Text>
            </BouncyTap>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 140, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 10 },
  supHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  supHeaderText: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1.5, opacity: 0.8 },
  greetingText: { fontFamily: 'Display-Bold', fontSize: 30, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickCard: { flex: 1, height: 80, borderRadius: 20, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  qIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  qLabel: { fontFamily: 'Display-Bold', fontSize: 12, letterSpacing: 1 },
  revenueWrapper: { marginBottom: 32, borderRadius: 24, overflow: 'hidden' },
  revenueCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 1.5 },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 60, borderRadius: 18, paddingHorizontal: 16, borderWidth: 1 },
  plusBtn: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  revenueFooter: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 1.5 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16
  },
  gridItem: {
    width: '23%',
    alignItems: 'center',
  },
  toolIconBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden'
  },
  toolInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 9,
    fontFamily: 'Display-Bold',
    textAlign: 'center',
    width: '100%',
    marginTop: 8,
    opacity: 0.8
  },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  activityTitle: { fontFamily: 'Display-Bold', fontSize: 22 },
  activityCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 22, borderWidth: 1, gap: 12, overflow: 'hidden' },
  activityIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }
});
