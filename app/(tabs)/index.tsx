import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, SafeAreaView, Platform, StyleSheet, Vibration } from "react-native";
import { useProfile, useClipScore, useRecentActivity, useAddIncome, useMyRoles, useWeeklyPerformance, useUserHealth, useUpdateProfile } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Plus, TrendingUp, ShoppingBag, ArrowUpRight, ArrowDownLeft, MessageCircle, Bell, ShieldCheck, ArrowDownToLine, Check, Eye, EyeOff, LayoutGrid, Zap } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { ClipScoreBreakdown } from "@/components/native/clipscore-breakdown";
import { CreditCapacityGauge } from "@/components/native/credit-capacity-gauge";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/theme-context";

export default function Dashboard() {
  const router = useRouter();
  const { colors, theme } = useTheme();
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

  const isAdmin = roles.data?.includes("admin") || user?.email === "bernardyawkwarteng8@gmail.com";
  const [localPrivate, setLocalPrivate] = useState<boolean | null>(null);
  const isPrivate = localPrivate ?? (profile?.privacy_mode_enabled ?? false);

  const togglePrivacy = async () => {
    const newVal = !isPrivate;
    setLocalPrivate(newVal);
    Vibration.vibrate(Platform.OS === 'ios' ? 0 : 10);
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
      const localDate = new Date().toLocaleDateString('en-CA');
      await addIncome.mutateAsync({
        amount: Number(incomeAmt),
        note: "Daily Revenue Log",
        entry_date: localDate
      });
      setIncomeAmt("");
      setIsLogged(true);
      setTimeout(() => setIsLogged(false), 3000);
    } catch (e: any) {
      alert(e.message || "Failed to log income");
    }
  };

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
      <SafeAreaView style={{ flex: 0, backgroundColor: colors.background }} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180, paddingTop: Platform.OS === 'ios' ? 60 : 60 }}
        refreshControl={<RefreshControl refreshing={isProfileLoading || performance.isLoading} tintColor={colors.primary} />}
      >
        <View style={{ paddingHorizontal: 24 }}>

          {/* Institutional Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <View style={styles.supHeaderRow}>
                <View style={[styles.institutionalDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.supHeaderText, { color: colors.primary }]}>CLIPCAPITAL PREMIUM</Text>
              </View>
              <Text
                numberOfLines={2}
                style={[styles.greetingText, { color: colors.text }]}
              >
                Akwaaba,{"\n"}@{profile?.username || profile?.display_name?.toLowerCase().replace(/\s/g, '_') || "artisan"}
              </Text>
              {profile?.location && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                   <Lucide.MapPin size={10} color={colors.textDim} />
                   <Text style={{ color: colors.textDim, fontSize: 10, fontWeight: 'bold' }}>{profile.location}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={togglePrivacy} style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                {isPrivate ? <EyeOff size={18} color={colors.primary} /> : <Eye size={18} color={colors.textMuted} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/notifications")} style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Bell size={18} color={colors.primary} />
                <View style={[styles.notifBadge, { borderColor: colors.cardBg }]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/support")} style={[styles.headerBtnInstitutional, { backgroundColor: colors.cardBg, borderColor: colors.primary + '20' }]}>
                <MessageCircle size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Premium Financial Power Gauge */}
          <CreditCapacityGauge
            score={score}
            limit={score * 5}
            loading={isProfileLoading}
            onAudit={() => setShowScoreAudit(!showScoreAudit)}
          />


          {showScoreAudit && (
            <View style={{ marginBottom: 40 }}>
              <ClipScoreBreakdown
                score={score}
                health={health.data}
                loading={health.isLoading}
              />
            </View>
          )}

          {/* Premium Quick Actions */}
          <View style={styles.quickActionsRow}>
            <ServiceNode title="Market" icon={ShoppingBag} color={theme === 'dark' ? colors.gold : "#e11d48"} onPress={() => router.push("/market")} theme={theme} />
            <ServiceNode title="Credit" icon={TrendingUp} color={colors.primary} onPress={() => router.push("/loans")} theme={theme} />
            <ServiceNode title="Payout" icon={ArrowDownToLine} color={theme === 'dark' ? "#3b82f6" : "#2563eb"} onPress={() => router.push("/withdraw")} theme={theme} />
            {isAdmin ? (
              <ServiceNode title="Command" icon={ShieldCheck} color={colors.destructive} onPress={() => router.push("/admin")} theme={theme} />
            ) : (
              <ServiceNode title="Audit" icon={LayoutGrid} color={colors.primary} onPress={() => router.push("/history")} theme={theme} />
            )}
          </View>

          {/* Revenue Card */}
          <View style={{ marginBottom: 48 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textDim }]}>Business Tracking</Text>
              <Text style={[styles.sectionStat, { color: colors.primary }]}>
                Today: {isPrivate ? "••••" : `GH₵ ${todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </Text>
            </View>

            <View style={[styles.revenueCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={{ padding: 24, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardLabel, { color: isLogged ? colors.primary : colors.textMuted }]}>
                    {isLogged ? "REVENUE RECORDED" : "LOG DAILY SALES"}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}>
                    <Text style={[styles.currencyPrefix, { color: colors.textDim }]}>GH₵</Text>
                    <TextInput
                      value={incomeAmt}
                      onChangeText={setIncomeAmt}
                      placeholder="0.00"
                      placeholderTextColor={colors.textDim}
                      keyboardType="numeric"
                      style={[styles.revenueInput, { color: colors.text }]}
                      editable={!addIncome.isPending}
                    />
                  </View>
                </View>
                <BouncyTap
                  onPress={handleLogIncome}
                  disabled={addIncome.isPending || !incomeAmt}
                  style={[styles.logBtn, { backgroundColor: colors.primary }]}
                >
                  {addIncome.isPending ? (
                    <ActivityIndicator color="#080c0a" />
                  ) : (
                    <Plus size={24} color="#080c0a" strokeWidth={3} />
                  )}
                </BouncyTap>
              </View>
              <View style={[styles.cardFooter, { backgroundColor: colors.primary + '08' }]}>
                  <Text style={[styles.footerText, { color: colors.primary }]}>
                    * Improves your credit worthiness and shop visibility.
                  </Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activityHeader}>
            <Text style={[styles.activityTitle, { color: colors.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push("/history")}>
              <Text style={[styles.viewHistoryLink, { color: colors.primary }]}>LEDGER →</Text>
            </TouchableOpacity>
          </View>

          <Card style={[styles.activityCard, { backgroundColor: colors.cardBg }]}>
            {(activity.data ?? []).length === 0 ? (
               <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: colors.textDim, fontStyle: 'italic', fontSize: 13 }}>No activity logged.</Text>
               </View>
            ) : (
              activity.data?.slice(0, 5).map((item, idx) => (
                <View key={item.id} style={[styles.activityItem, { borderBottomColor: colors.border }, idx === 4 && { borderBottomWidth: 0 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                    <View style={[styles.activityIconBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      {item.amount > 0 ? <ArrowUpRight size={20} color={colors.primary} /> : <ArrowDownLeft size={20} color={colors.destructive} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={[styles.activityNote, { color: colors.text }]}>{item.note || item.title}</Text>
                      <Text style={[styles.activityDateText, { color: colors.textDim }]}>{formatActivityDate(item.date)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.activityAmount, { color: item.amount > 0 ? colors.primary : colors.text }]}>
                    {item.amount > 0 ? '+' : ''}{isPrivate ? "•••" : item.amount.toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

function ServiceNode({ title, icon: Icon, color, onPress, theme }: any) {
  const { colors } = useTheme();
  return (
    <BouncyTap onPress={onPress} style={{ alignItems: 'center' }}>
      <LinearGradient
        colors={theme === 'dark' ? ['#0f1714', '#080c0a'] : ['#ffffff', '#f1f5f9']}
        style={[styles.serviceIconContainer, { borderColor: `${color}20` }]}
      >
        <Icon size={24} color={color} strokeWidth={2.5} />
        <View style={[styles.serviceGlow, { backgroundColor: color }]} />
      </LinearGradient>
      <Text style={[styles.serviceTitle, { color: colors.textDim }]}>{title}</Text>
    </BouncyTap>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 10 },
  supHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  institutionalDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  supHeaderText: { fontWeight: '900', fontSize: 9, letterSpacing: 4, textTransform: 'uppercase' },
  greetingText: { fontFamily: 'Display-Bold', fontSize: 24, lineHeight: 28, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerBtnInstitutional: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', borderWidth: 1.5 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 50, marginTop: 10 },
  serviceIconContainer: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  serviceGlow: { position: 'absolute', width: 40, height: 40, borderRadius: 20, opacity: 0.03 },
  serviceTitle: { fontWeight: '900', fontSize: 8, textTransform: 'uppercase', letterSpacing: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 8 },
  sectionTitle: { fontWeight: '900', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' },
  sectionStat: { fontWeight: 'bold', fontSize: 11 },
  revenueCard: { borderRadius: 28, overflow: 'hidden', borderWidth: 1 },
  cardLabel: { fontWeight: '900', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
  currencyPrefix: { fontFamily: 'Display-Bold', fontSize: 18, marginRight: 8 },
  revenueInput: { fontFamily: 'Display-Bold', fontSize: 32, flex: 1, height: 44, includeFontPadding: false },
  logBtn: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  cardFooter: { paddingVertical: 10, paddingHorizontal: 20 },
  footerText: { fontSize: 8, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, paddingHorizontal: 8 },
  activityTitle: { fontFamily: 'Display-Bold', fontSize: 22 },
  viewHistoryLink: { fontWeight: '900', fontSize: 9, letterSpacing: 1 },
  activityCard: { padding: 4, borderRadius: 24 },
  activityItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  activityIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  activityNote: { fontWeight: 'bold', fontSize: 14 },
  activityDateText: { fontWeight: '900', fontSize: 9, textTransform: 'uppercase', marginTop: 3, letterSpacing: 1 },
  activityAmount: { fontFamily: 'Display-Bold', fontSize: 16, marginLeft: 12 }
});
