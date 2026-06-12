import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, SafeAreaView, Platform, StyleSheet } from "react-native";
import { useProfile, useClipScore, useRecentActivity, useAddIncome, useMyRoles, useWeeklyPerformance, useUserHealth, useUpdateProfile } from "@/lib/app-queries";
import { StatCard, Card } from "@/components/native/card";
import { AnalyticsChart } from "@/components/native/analytics-chart";
import { Plus, TrendingUp, ShoppingBag, ArrowUpRight, ArrowDownLeft, MessageCircle, Bell, ShieldCheck, ArrowDownToLine, Check, Eye, EyeOff, LayoutGrid } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { ClipScoreBreakdown } from "@/components/native/clipscore-breakdown";
import { CreditCapacityGauge } from "@/components/native/credit-capacity-gauge";
import { LinearGradient } from "expo-linear-gradient";

export default function Dashboard() {
  const router = useRouter();
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
  const isPrivate = profile?.privacy_mode_enabled ?? false;

  const togglePrivacy = async () => {
    try {
      await updateProfile.mutateAsync({ privacy_mode_enabled: !isPrivate });
    } catch (e) {
      console.error(e);
    }
  };

  const todayTotal = performance.data?.data?.[performance.data?.todayIndex] || 0;

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
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 0, backgroundColor: '#080c0a' }} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180, paddingTop: Platform.OS === 'ios' ? 20 : 60 }}
        refreshControl={<RefreshControl refreshing={isProfileLoading} tintColor="#10B981" />}
      >
        <View style={{ paddingHorizontal: 24 }}>

          {/* Institutional Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.supHeaderRow}>
                <View style={styles.institutionalDot} />
                <Text style={styles.supHeaderText}>CLIPCAPITAL PREMIUM</Text>
              </View>
              <Text
                numberOfLines={2}
                adjustsFontSizeToFit
                style={styles.greetingText}
              >
                Akwaaba,{"\n"}{profile?.display_name || "Artisan"}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={togglePrivacy} style={styles.headerBtn}>
                {isPrivate ? <EyeOff size={18} color="#10b981" /> : <Eye size={18} color="#7d8a84" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/notifications")} style={styles.headerBtn}>
                <Bell size={18} color="#10b981" />
                <View style={styles.notifBadge} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/support")} style={styles.headerBtnInstitutional}>
                <MessageCircle size={18} color="#10b981" />
              </TouchableOpacity>
            </View>
          </View>

+          {/* Premium Financial Power Gauge */}
          <CreditCapacityGauge
            score={score}
            limit={score * 5}
            loading={isProfileLoading}
          />

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity onPress={() => router.push("/wallet")} style={{ flex: 1 }}>
              <StatCard
                label="My Wallet"
                value={`GH₵ ${profile?.wallet_balance || 0}`}
                variant="emerald"
                hint="Manage"
                hideValue={isPrivate}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowScoreAudit(!showScoreAudit)} style={{ flex: 1 }}>
              <StatCard
                label="ClipScore"
                value={String(score)}
                variant="gold"
                hint="Audit"
                hideValue={isPrivate}
              />
            </TouchableOpacity>
          </View>

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
            <ServiceNode title="Market" icon={ShoppingBag} color="#f59e0b" onPress={() => router.push("/market")} />
            <ServiceNode title="Credit" icon={TrendingUp} color="#10b981" onPress={() => router.push("/loans")} />
            <ServiceNode title="Payout" icon={ArrowDownToLine} color="#3b82f6" onPress={() => router.push("/withdraw")} />
            {isAdmin ? (
              <ServiceNode title="Command" icon={ShieldCheck} color="#ef4444" onPress={() => router.push("/admin")} />
            ) : (
              <ServiceNode title="Audit" icon={LayoutGrid} color="#10b981" onPress={() => router.push("/history")} />
            )}
          </View>

          {/* Revenue Card */}
          <View style={{ marginBottom: 48 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Business Tracking</Text>
              <Text style={styles.sectionStat}>
                Today: {isPrivate ? "••••" : `GH₵ ${todayTotal.toLocaleString()}`}
              </Text>
            </View>

            <View style={styles.revenueCard}>
              <View style={{ padding: 24, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardLabel, isLogged && { color: '#10b981' }]}>
                    {isLogged ? "REVENUE RECORDED" : "LOG DAILY SALES"}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}>
                    <Text style={styles.currencyPrefix}>GH₵</Text>
                    <TextInput
                      value={incomeAmt}
                      onChangeText={setIncomeAmt}
                      placeholder="0.00"
                      placeholderTextColor="#405045"
                      keyboardType="numeric"
                      style={styles.revenueInput}
                      editable={!addIncome.isPending}
                    />
                  </View>
                </View>
                <BouncyTap
                  onPress={handleLogIncome}
                  disabled={addIncome.isPending || !incomeAmt}
                  style={styles.logBtn}
                >
                  {addIncome.isPending ? (
                    <ActivityIndicator color="#080c0a" />
                  ) : (
                    <Plus size={24} color="#080c0a" strokeWidth={3} />
                  )}
                </BouncyTap>
              </View>
              <View style={styles.cardFooter}>
                  <Text style={styles.footerText}>
                    * Improves your credit worthiness and shop visibility.
                  </Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push("/history")}>
              <Text style={styles.viewHistoryLink}>LEDGER →</Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.activityCard}>
            {activity.data?.slice(0, 5).map((item, idx) => (
              <View key={item.id} style={[styles.activityItem, idx === 4 && { borderBottomWidth: 0 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                  <View style={[styles.activityIconBox, { borderColor: item.amount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                    {item.amount > 0 ? <ArrowUpRight size={20} color="#10B981" /> : <ArrowDownLeft size={20} color="#EF4444" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.activityNote}>{item.note || item.title}</Text>
                    <Text style={styles.activityDateText}>{formatActivityDate(item.date)}</Text>
                  </View>
                </View>
                <Text style={[styles.activityAmount, { color: item.amount > 0 ? '#10b981' : '#fcfcfc' }]}>
                  {item.amount > 0 ? '+' : ''}{isPrivate ? "•••" : item.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

function ServiceNode({ title, icon: Icon, color, onPress }: any) {
  return (
    <BouncyTap onPress={onPress} style={{ alignItems: 'center' }}>
      <LinearGradient
        colors={['#0f1714', '#080c0a']}
        style={[styles.serviceIconContainer, { borderColor: `${color}20` }]}
      >
        <Icon size={24} color={color} strokeWidth={2.5} />
        <View style={[styles.serviceGlow, { backgroundColor: color }]} />
      </LinearGradient>
      <Text style={styles.serviceTitle}>{title}</Text>
    </BouncyTap>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, marginTop: 10 },
  supHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  institutionalDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 8 },
  supHeaderText: { color: '#10b981', fontWeight: '900', fontSize: 9, letterSpacing: 4, textTransform: 'uppercase' },
  greetingText: { fontFamily: 'Display-Bold', color: '#fcfcfc', fontSize: 38, lineHeight: 42, letterSpacing: -1.5 },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  headerBtnInstitutional: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#10b98120' },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#0f1714' },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 50, marginTop: 10 },
  serviceIconContainer: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  serviceGlow: { position: 'absolute', width: 40, height: 40, borderRadius: 20, opacity: 0.03 },
  serviceTitle: { color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 8, textTransform: 'uppercase', letterSpacing: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 8 },
  sectionTitle: { color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' },
  sectionStat: { color: '#10b981', fontWeight: 'bold', fontSize: 11 },
  revenueCard: { borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: '#0f1714' },
  cardLabel: { color: '#7d8a84', fontWeight: '900', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
  currencyPrefix: { fontFamily: 'Display-Bold', color: '#405045', fontSize: 18, marginRight: 8 },
  revenueInput: { fontFamily: 'Display-Bold', color: 'white', fontSize: 32, flex: 1, height: 44, includeFontPadding: false },
  logBtn: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  cardFooter: { backgroundColor: 'rgba(16,185,129,0.05)', paddingVertical: 10, paddingHorizontal: 20 },
  footerText: { color: '#10b981', fontSize: 8, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, paddingHorizontal: 8 },
  activityTitle: { fontFamily: 'Display-Bold', color: '#fcfcfc', fontSize: 22 },
  viewHistoryLink: { color: '#10b981', fontWeight: '900', fontSize: 9, letterSpacing: 1 },
  activityCard: { padding: 4, backgroundColor: '#0f1714', borderRadius: 24 },
  activityItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  activityIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  activityNote: { color: '#fcfcfc', fontWeight: 'bold', fontSize: 14 },
  activityDateText: { color: '#405045', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', marginTop: 3, letterSpacing: 1 },
  activityAmount: { fontFamily: 'Display-Bold', fontSize: 16, marginLeft: 12 }
});
