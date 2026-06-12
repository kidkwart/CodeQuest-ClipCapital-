import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator, SafeAreaView, Platform } from "react-native";
import { useProfile, useClipScore, useRecentActivity, useAddIncome, useMyRoles, useWeeklyPerformance, useUserHealth, useUpdateProfile } from "@/lib/app-queries";
import { StatCard, Card } from "@/components/native/card";
import { AnalyticsChart } from "@/components/native/analytics-chart";
import { Plus, TrendingUp, ShoppingBag, ArrowUpRight, ArrowDownLeft, MessageCircle, Bell, ShieldCheck, ArrowDownToLine, Check, Eye, EyeOff } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { ClipScoreBreakdown } from "@/components/native/clipscore-breakdown";

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

  // Calculate Today's Total Revenue from performance data
  const todayTotal = performance.data?.data?.[performance.data?.todayIndex] || 0;

  const handleLogIncome = async () => {
    if (addIncome.isPending) return;
    if (!incomeAmt || isNaN(Number(incomeAmt))) return;

    try {
      // Use local date for consistent logging
      const localDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

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
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <SafeAreaView style={{ flex: 0, backgroundColor: '#080c0a' }} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 180, paddingTop: Platform.OS === 'ios' ? 20 : 60 }}
        refreshControl={<RefreshControl refreshing={isProfileLoading} tintColor="#10B981" />}
      >
        <View style={{ paddingHorizontal: 24 }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8 }} />
                <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase' }}>ClipCapital Premium</Text>
              </View>
              <Text
                numberOfLines={2}
                adjustsFontSizeToFit
                style={{ fontFamily: 'Display-Bold', color: '#fcfcfc', fontSize: 42, lineHeight: 46, letterSpacing: -2 }}
              >
                Akwaaba,{"\n"}{profile?.display_name || "Artisan"}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={togglePrivacy}
                style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isPrivate ? '#10b981' : 'rgba(255,255,255,0.05)' }}
              >
                {isPrivate ? <EyeOff size={20} color="#10b981" /> : <Eye size={20} color="#7d8a84" />}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <Bell size={20} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/support")}
                style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#10b98130' }}
              >
                <MessageCircle size={20} color="#10b981" />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Analytics Chart Section */}
          <AnalyticsChart
            data={performance.data?.data}
            labels={performance.data?.labels}
            todayIndex={performance.data?.todayIndex}
            growth={performance.data?.growth}
            isPositive={performance.data?.isPositive}
            loading={performance.isLoading}
          />

          {/* Stats Grid */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
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

          {/* Quick Actions */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 60, marginTop: showScoreAudit ? 0 : 20 }}>
            <ServiceNode title="Market" icon={ShoppingBag} color="#f59e0b" onPress={() => router.push("/market")} />
            <ServiceNode title="Loans" icon={TrendingUp} color="#10b981" onPress={() => router.push("/loans")} />
            <ServiceNode title="Payout" icon={ArrowDownToLine} color="#3b82f6" onPress={() => router.push("/withdraw")} />
            {isAdmin ? (
              <ServiceNode title="Admin" icon={ShieldCheck} color="#ef4444" onPress={() => router.push("/admin")} />
            ) : (
              <ServiceNode title="History" icon={TrendingUp} color="#10b981" onPress={() => router.push("/history")} />
            )}
          </View>

          {/* Revenue Card - NOW LABELED AS AUDIT/LOG */}
          <View style={{ marginBottom: 48 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 8 }}>
              <Text style={{ color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase' }}>Revenue Tracking</Text>
              <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 12 }}>
                Today: {isPrivate ? "••••" : `GH₵ ${todayTotal.toLocaleString()}`}
              </Text>
            </View>

            <View style={{ borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: isLogged ? '#10b981' : 'rgba(255,255,255,0.05)', backgroundColor: '#0f1714' }}>
              <View style={{ padding: 24, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: isLogged ? '#10b981' : '#7d8a84', fontWeight: '900', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
                    {isLogged ? "Revenue Recorded" : "Log New Sale"}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', height: 44 }}>
                    <Text style={{ fontFamily: 'Display-Bold', color: '#405045', fontSize: 20, marginRight: 8, textAlignVertical: 'center' }}>GH₵</Text>
                    <TextInput
                      value={incomeAmt}
                      onChangeText={setIncomeAmt}
                      placeholder="0.00"
                      placeholderTextColor="#5a6b69"
                      keyboardType="numeric"
                      style={{
                        fontFamily: 'Display-Bold',
                        color: 'white',
                        fontSize: 32,
                        flex: 1,
                        padding: 0,
                        margin: 0,
                        height: 44,
                        includeFontPadding: false,
                        textAlignVertical: 'center',
                      }}
                      editable={!addIncome.isPending}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleLogIncome}
                  disabled={addIncome.isPending || !incomeAmt}
                  activeOpacity={0.8}
                  style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' }}
                >
                  {addIncome.isPending ? (
                    <ActivityIndicator color="#080c0a" />
                  ) : isLogged ? (
                    <Check size={28} color="#080c0a" />
                  ) : (
                    <Plus size={28} color="#080c0a" />
                  )}
                </TouchableOpacity>
              </View>
              <View style={{ backgroundColor: '#10b98110', paddingVertical: 10, paddingHorizontal: 20 }}>
                  <Text style={{ color: '#10b981', fontSize: 9, fontWeight: 'bold', textAlign: 'center' }}>
                    * This logs your business growth and improves your ClipScore. It does not add to your spendable wallet.
                  </Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingHorizontal: 8 }}>
            <Text style={{ fontFamily: 'Display-Bold', color: '#fcfcfc', fontSize: 24 }}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push("/history")}>
              <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>View History →</Text>
            </TouchableOpacity>
          </View>

          <Card glass style={{ padding: 8 }}>
            {activity.data?.map((item, idx) => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: idx !== (activity.data?.length || 0) - 1 ? 1 : 0, borderBottomColor: 'rgba(16,185,129,0.1)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: item.type === 'income' ? '#10b98130' : '#ef444430' }}>
                    {item.type === 'income' ? <ArrowUpRight size={24} color="#10B981" /> : <ArrowDownLeft size={24} color="#EF4444" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: '#fcfcfc', fontWeight: 'bold', fontSize: 15 }}>{item.note}</Text>
                    <Text style={{ color: '#7d8a84', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 }}>{formatActivityDate(item.date)}</Text>
                  </View>
                </View>
                <Text style={{ fontFamily: 'Display-Bold', fontSize: 18, color: item.type === 'income' ? '#10b981' : '#ef4444', marginLeft: 12 }}>
                  {item.type === 'income' ? '+' : '-'} {isPrivate ? "••••" : item.amount.toLocaleString()}
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
      <View style={{ width: 72, height: 72, borderRadius: 28, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: `${color}30`, shadowColor: color, shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 12 }}>
        <Icon size={28} color={color} />
        <View style={{ position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: color, opacity: 0.05 }} />
      </View>
      <Text style={{ color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2 }}>{title}</Text>
    </BouncyTap>
  );
}
