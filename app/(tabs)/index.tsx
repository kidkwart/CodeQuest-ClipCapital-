import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Dimensions } from "react-native";
import { useProfile, useClipScore, useRecentActivity, useAddIncome, useMyRoles } from "@/lib/app-queries";
import { StatCard, Card } from "@/components/native/card";
import { Plus, TrendingUp, ShoppingBag, ArrowUpRight, ArrowDownLeft, MessageCircle, Wallet, Bell, ShieldCheck, ArrowDownToLine } from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const router = useRouter();
  const profile = useProfile();
  const roles = useMyRoles();
  const { user } = useCurrentUser();
  const { score } = useClipScore();
  const activity = useRecentActivity(5);
  const addIncome = useAddIncome();
  const [incomeAmt, setIncomeAmt] = useState("");

  const isAdmin = roles.data?.includes("admin") || user?.email === "bernardyawkwarteng8@gmail.com";

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 60 }}
        refreshControl={<RefreshControl refreshing={profile.isLoading} tintColor="#10B981" />}
      >
        <View style={{ paddingHorizontal: 24 }}>

          {/* Header - Fixed Structure */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8, shadowColor: '#10b981', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 }} />
                <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase' }}>ClipCapital Premium</Text>
              </View>
              <Text style={{ fontFamily: 'Display-Bold', color: '#fcfcfc', fontSize: 48, lineHeight: 42, letterSpacing: -2 }}>
                Akwaaba,{"\n"}{profile.data?.display_name?.split(' ')[0] || "Artisan"}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                style={{ width: 56, height: 56, borderRadius: 22, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWeight: 1, borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <Bell size={24} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/support")}
                style={{ width: 56, height: 56, borderRadius: 22, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWeight: 1, borderColor: '#10b98130' }}
              >
                <MessageCircle size={24} color="#10b981" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Grid - Balanced width */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 40 }}>
            <View style={{ flex: 1 }}>
              <StatCard label="My Wallet" value={`GH₵ ${profile.data?.wallet_balance || 0}`} variant="emerald" hint="Available" />
            </View>
            <View style={{ flex: 1 }}>
              <StatCard label="ClipScore" value={String(score)} variant="gold" hint="Verified" />
            </View>
          </View>

          {/* Revenue Card - Impactful size */}
          <View style={{ marginBottom: 48, borderRadius: 42, overflow: 'hidden', borderWeight: 1, borderColor: '#10b98140' }}>
            <LinearGradient
              colors={['#10B981', '#064e3b', '#080c0a']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ padding: 32, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '900', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>Daily Revenue Log</Text>
                <TextInput
                  value={incomeAmt}
                  onChangeText={setIncomeAmt}
                  placeholder="0.00 GH₵"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="numeric"
                  style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 32 }}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                style={{ width: 64, height: 64, borderRadius: 24, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={32} color="#064e3b" />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Services Grid - Perfectly Aligned */}
          <Text style={{ color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24, marginLeft: 8 }}>Shop Facilities</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 60 }}>
            <ServiceNode title="Market" icon={ShoppingBag} color="#f59e0b" onPress={() => router.push("/market")} />
            <ServiceNode title="Loans" icon={TrendingUp} color="#10b981" onPress={() => router.push("/loans")} />
            <ServiceNode title="Payout" icon={ArrowDownToLine} color="#3b82f6" onPress={() => router.push("/withdraw")} />
            {isAdmin ? (
              <ServiceNode title="Admin" icon={ShieldCheck} color="#ef4444" onPress={() => router.push("/admin")} />
            ) : (
              <ServiceNode title="History" icon={Plus} color="#10b981" onPress={() => router.push("/history")} />
            )}
          </View>

          {/* Recent Activity - Glass List */}
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ alignItems: 'center' }}>
      <View style={{ width: 72, height: 72, borderRadius: 28, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: `${color}30`, shadowColor: color, shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 12 }}>
        <Icon size={28} color={color} />
        <View style={{ position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: color, opacity: 0.05 }} />
      </View>
      <Text style={{ color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2 }}>{title}</Text>
    </TouchableOpacity>
  );
}
