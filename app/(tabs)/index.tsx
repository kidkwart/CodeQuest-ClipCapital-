import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, SafeAreaView, Platform, StyleSheet, Vibration } from "react-native";
import { useProfile, useClipScore, useRecentActivity, useAddIncome, useMyRoles, useWeeklyPerformance, useUserHealth, useUpdateProfile } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Plus, TrendingUp, ShoppingBag, ArrowUpRight, ArrowDownLeft, MessageCircle, Bell, ShieldCheck, ArrowDownToLine, Check, Eye, EyeOff, LayoutGrid, Zap, MapPin, FileText, BookOpen, Scan, ShieldAlert, HelpCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { ClipScoreBreakdown } from "@/components/native/clipscore-breakdown";
import { CreditCapacityGauge } from "@/components/native/credit-capacity-gauge";
import { useTheme } from "@/context/theme-context";

export default function Dashboard() {
  const router = useRouter();
  const { colors } = useTheme();
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

  const isAdmin = roles.data?.includes("admin");
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
        contentContainerStyle={{ paddingBottom: 140, paddingTop: Platform.OS === 'ios' ? 60 : 40 }}
        refreshControl={<RefreshControl refreshing={isProfileLoading || performance.isLoading} tintColor={colors.primary} />}
      >
        <View style={{ paddingHorizontal: 24 }}>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.supHeaderRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.supHeaderText, { color: colors.primary }]}>PREMIUM ACCOUNT</Text>
              </View>
              <Text numberOfLines={1} style={[styles.greetingText, { color: colors.text }]}>
                Akwaaba, {profile?.display_name?.split(' ')[0] || "Artisan"}
              </Text>
              {profile?.location && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                   <MapPin size={12} color={colors.textDim} />
                   <Text style={{ color: colors.textDim, fontSize: 11, fontWeight: '600' }}>{profile.location}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push("/scan")} style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Scan size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/notifications")} style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Bell size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Stats */}
          <View style={{ marginBottom: 32 }}>
            <CreditCapacityGauge
              score={score}
              limit={score * 5}
              loading={isProfileLoading}
              onAudit={() => setShowScoreAudit(!showScoreAudit)}
            />
          </View>

          {showScoreAudit && (
            <View style={{ marginBottom: 32 }}>
              <ClipScoreBreakdown
                score={score}
                health={health.data}
                loading={health.isLoading}
              />
            </View>
          )}

          {/* Revenue Quick Log */}
          <View style={[styles.revenueCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={{ padding: 20 }}>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>LOG TODAY'S SALES</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: colors.surfaceElevated, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.textDim, fontSize: 18, fontWeight: 'bold', marginRight: 8 }}>GH₵</Text>
                  <TextInput
                    value={incomeAmt}
                    onChangeText={setIncomeAmt}
                    placeholder="0.00"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                    style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: 'bold' }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleLogIncome}
                  disabled={addIncome.isPending || !incomeAmt}
                  style={[styles.plusBtn, { backgroundColor: colors.primary }]}
                >
                  {addIncome.isPending ? <ActivityIndicator color="#000" /> : <Plus size={24} color="#000" strokeWidth={3} />}
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                 <Text style={{ color: colors.textDim, fontSize: 12 }}>Today's Total</Text>
                 <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>
                   {isPrivate ? "••••" : `GH₵ ${todayTotal.toLocaleString()}`}
                 </Text>
              </View>
            </View>
          </View>

          {/* Tools Grid */}
          <View style={{ marginVertical: 32 }}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Business Solutions</Text>
            <View style={styles.grid}>
              <ToolItem
                icon={ShoppingBag}
                label="Market"
                onPress={() => router.push("/market")}
                color="#e11d48"
              />
              <ToolItem
                icon={ArrowDownToLine}
                label="Payout"
                onPress={() => router.push("/withdraw")}
                color="#3b82f6"
              />
              <ToolItem
                icon={ShieldCheck}
                label="Vault"
                onPress={() => router.push("/vault")}
                color={colors.gold}
              />
              <ToolItem
                icon={FileText}
                label="Invoices"
                onPress={() => router.push("/invoices")}
                color="#8b5cf6"
              />
              <ToolItem
                icon={BookOpen}
                label="Academy"
                onPress={() => router.push("/academy")}
                color="#ec4899"
              />
              <ToolItem
                icon={Zap}
                label="My QR"
                onPress={() => router.push("/my-qr")}
                color="#f59e0b"
              />
              <ToolItem
                icon={isPrivate ? EyeOff : Eye}
                label="Privacy"
                onPress={togglePrivacy}
                color={isPrivate ? colors.primary : "#64748b"}
              />
              <ToolItem
                icon={HelpCircle}
                label="Support"
                onPress={() => router.push("/support")}
                color="#64748b"
              />
              {isAdmin && (
                <ToolItem
                  icon={ShieldAlert}
                  label="Admin"
                  onPress={() => router.push("/admin")}
                  color={colors.destructive}
                />
              )}
            </View>
          </View>

          {/* Activity */}
          <View style={styles.activityHeader}>
            <Text style={[styles.activityTitle, { color: colors.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push("/history")}>
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 12 }}>
            {activity.data?.slice(0, 4).map((item) => (
              <View key={item.id} style={[styles.activityItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                 <View style={[styles.activityIcon, { backgroundColor: colors.surfaceElevated }]}>
                    {item.amount > 0 ? <ArrowUpRight size={18} color={colors.primary} /> : <ArrowDownLeft size={18} color={colors.destructive} />}
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600' }} numberOfLines={1}>{item.note || "Transaction"}</Text>
                    <Text style={{ color: colors.textDim, fontSize: 10 }}>{formatActivityDate(item.date)}</Text>
                 </View>
                 <Text style={{ color: item.amount > 0 ? colors.primary : colors.text, fontWeight: 'bold' }}>
                    {item.amount > 0 ? '+' : ''}{isPrivate ? "•••" : item.amount.toLocaleString()}
                 </Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

function ToolItem({ icon: Icon, label, onPress, color }: any) {
    const { colors } = useTheme();
    return (
        <TouchableOpacity onPress={onPress} style={styles.gridItem}>
            <View style={[styles.toolIconBox, { backgroundColor: color + '15', borderColor: color + '30' }]}>
                <Icon size={24} color={color} />
            </View>
            <Text numberOfLines={1} style={[styles.toolLabel, { color: colors.text }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  supHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  supHeaderText: { fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  greetingText: { fontFamily: 'Display-Bold', fontSize: 28 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  revenueCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  cardLabel: { fontWeight: '900', fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  plusBtn: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontWeight: '900', fontSize: 11, letterSpacing: 2, marginBottom: 20, textTransform: 'uppercase' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12
  },
  gridItem: {
    width: '22%',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12
  },
  toolIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  toolLabel: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center'
  },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  activityTitle: { fontFamily: 'Display-Bold', fontSize: 20 },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, gap: 16 },
  activityIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});
