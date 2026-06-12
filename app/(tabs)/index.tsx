import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Dimensions, ActivityIndicator } from "react-native";
import { useProfile, useClipScore, useRecentActivity, useAddIncome, useMyRoles } from "@/lib/app-queries";
import { StatCard, Card } from "@/components/native/card";
import { AnalyticsChart } from "@/components/native/analytics-chart";
import { Plus, TrendingUp, ShoppingBag, ArrowUpRight, ArrowDownLeft, MessageCircle, Bell, ShieldCheck, ArrowDownToLine, Check } from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useCurrentUser } from "@/hooks/use-current-user";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { ClipScoreBreakdown } from "@/components/native/clipscore-breakdown";

export default function Dashboard() {
  const router = useRouter();
  const profile = useProfile();
  const roles = useMyRoles();
  const { user } = useCurrentUser();
  const { score } = useClipScore();
  const activity = useRecentActivity(5);
  const addIncome = useAddIncome();
  const [incomeAmt, setIncomeAmt] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [showScoreAudit, setShowScoreAudit] = useState(false);

  const isAdmin = roles.data?.includes("admin") || user?.email === "bernardyawkwarteng8@gmail.com";

  const handleLogIncome = async () => {
    if (!incomeAmt || isNaN(Number(incomeAmt))) return;
    try {
      await addIncome.mutateAsync({
        amount: Number(incomeAmt),
        note: "Daily Revenue Log",
        entry_date: new Date().toISOString().split('T')[0]
      });
      setIncomeAmt("");
      setIsLogged(true);
      setTimeout(() => setIsLogged(false), 3000);
    } catch (e: any) {
      alert(e.message || "Failed to log income");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 60 }}
        refreshControl={<RefreshControl refreshing={profile.isLoading} tintColor="#10B981" />}
      >
        <View style={{ paddingHorizontal: 24 }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8 }} />
                <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase' }}>ClipCapital Premium</Text>
              </View>
              <Text style={{ fontFamily: 'Display-Bold', color: '#fcfcfc', fontSize: 48, lineHeight: 42, letterSpacing: -2 }}>
                Akwaaba,{"\n"}{profile.data?.display_name?.split(' ')[0] || "Artisan"}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                style={{ width: 56, height: 56, borderRadius: 22, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <Bell size={24} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/support")}
                style={{ width: 56, height: 56, borderRadius: 22, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#10b98130' }}
              >
                <MessageCircle size={24} color="#10b981" />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Analytics Chart Section */}
          <AnalyticsChart />

          {/* Stats Grid */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
            <TouchableOpacity onPress={() => router.push("/wallet")} style={{ flex: 1 }}>
              <StatCard label="My Wallet" value={`GH₵ ${profile.data?.wallet_balance || 0}`} variant="emerald" hint="Manage" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowScoreAudit(!showScoreAudit)} style={{ flex: 1 }}>
              <StatCard label="ClipScore" value={String(score)} variant="gold" hint="Audit" />
            </TouchableOpacity>
          </View>

          {showScoreAudit && (
            <View style={{ marginBottom: 40 }}>
              <ClipScoreBreakdown score={score} />
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

          {/* Revenue Card */}
          <View style={{ marginBottom: 48 }}>
            <Text style={{ color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 20, marginLeft: 8 }}>Merchant Journal</Text>
            <View style={{ borderRadius: 42, overflow: 'hidden', borderWidth: 1, borderColor: isLogged ? '#10b981' : 'rgba(255,255,255,0.05)', backgroundColor: '#0f1714' }}>
              <View style={{ padding: 32, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: isLogged ? '#10b981' : '#7d8a84', fontWeight: '900', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
                    {isLogged ? "Transaction Secured" : "Log Daily Revenue"}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Display-Bold', color: '#405045', fontSize: 32, marginRight: 8 }}>GH₵</Text>
                    <TextInput
                      value={incomeAmt}
                      onChangeText={setIncomeAmt}
                      placeholder="0.00"
                      placeholderTextColor="#334140"
                      keyboardType="numeric"
                      style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 32, flex: 1 }}
                      editable={!addIncome.isPending}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleLogIncome}
                  disabled={addIncome.isPending || !incomeAmt}
                  activeOpacity={0.8}
                  style={{ width: 64, height: 64, borderRadius: 24, backgroundColor: isLogged ? '#10b981' : '#10b981', alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 15, elevation: 5 }}
                >
                  {addIncome.isPending ? (
                    <ActivityIndicator color="#080c0a" />
                  ) : isLogged ? (
                    <Check size={32} color="#080c0a" />
                  ) : (
                    <Plus size={32} color="#080c0a" />
                  )}
                </TouchableOpacity>
              </View>
              {isLogged && (
                <View style={{ backgroundColor: '#10b98110', paddingVertical: 8, alignItems: 'center' }}>
                   <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Balance Synchronized</Text>
                </View>
              )}
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
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: idx !== 4 ? 1 : 0, borderBottomColor: 'rgba(16,185,129,0.1)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: item.type === 'income' ? '#10b98130' : '#ef444430' }}>
                    {item.type === 'income' ? <ArrowUpRight size={24} color="#10B981" /> : <ArrowDownLeft size={24} color="#EF4444" />}
                  </View>
                  <View>
                    <Text style={{ color: '#fcfcfc', fontWeight: 'bold', fontSize: 16 }}>{item.note}</Text>
                    <Text style={{ color: '#7d8a84', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 }}>{item.date}</Text>
                  </View>
                </View>
                <Text style={{ fontFamily: 'Display-Bold', fontSize: 18, color: item.type === 'income' ? '#10b981' : '#ef4444' }}>
                  {item.type === 'income' ? '+' : '-'} {item.amount}
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
