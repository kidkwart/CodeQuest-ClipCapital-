import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { useProfile, useClipScore, useRecentActivity, useAddIncome } from "@/lib/app-queries";
import { StatCard, Card } from "@/components/native/card";
import { Plus, TrendingUp, ShoppingBag, ArrowUpRight, ArrowDownLeft, MessageCircle, Wallet } from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const router = useRouter();
  const profile = useProfile();
  const { score } = useClipScore();
  const activity = useRecentActivity(5);
  const addIncome = useAddIncome();
  const [incomeAmt, setIncomeAmt] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 60 }}
        refreshControl={<RefreshControl refreshing={profile.isLoading} tintColor="#10B981" />}
      >
        <View className="px-6">
          {/* Header - Massive Premium Typography */}
          <View className="flex-row justify-between items-start mb-12">
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_15px_#10b981]" />
                <Text className="text-[#10b981] font-black text-[10px] uppercase tracking-[0.45em]">ClipCapital Premium</Text>
              </View>
              <Text style={{ fontFamily: 'Display-Bold' }} className="text-[#fcfcfc] text-5xl leading-[0.82] tracking-tighter">
                Akwaaba,{"\n"}{profile.data?.display_name?.split(' ')[0] || "Artisan"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/support")}
              className="h-16 w-16 rounded-[28px] bg-[#0f1714] items-center justify-center border border-[#10b981]/30 shadow-2xl"
            >
              <MessageCircle size={28} color="#10b981" />
            </TouchableOpacity>
          </View>

          {/* Emerald & Gold Stat Pair */}
          <View className="flex-row gap-5 mb-10">
            <View className="flex-1">
              <StatCard label="My Wallet" value={`GH₵ ${profile.data?.wallet_balance || 0}`} variant="emerald" hint="Available" />
            </View>
            <View className="flex-1">
              <StatCard label="ClipScore" value={String(score)} variant="gold" hint="Verified" />
            </View>
          </View>

          {/* The Signature Quick Log - Neon PWA Gradient */}
          <View className="mb-14 rounded-[42px] overflow-hidden shadow-[0_25px_60px_rgba(16,185,129,0.3)] border border-[#10b981]/40">
            <LinearGradient
              colors={['#10B981', '#064e3b', '#080c0a']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              className="p-9 flex-row items-center"
            >
              <View className="flex-1">
                <Text className="text-white/70 font-black text-[10px] uppercase tracking-[0.4em] mb-2">Daily Revenue Log</Text>
                <TextInput
                  value={incomeAmt}
                  onChangeText={setIncomeAmt}
                  placeholder="0.00 GH₵"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="numeric"
                  style={{ fontFamily: 'Display-Bold' }}
                  className="text-white text-4xl p-0 tracking-tighter"
                />
              </View>
              <TouchableOpacity
                onPress={() => alert("Revenue Logged")}
                className="bg-[#fcfcfc] h-16 w-16 rounded-[24px] items-center justify-center shadow-2xl"
              >
                <Plus size={32} color="#064e3b" />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Member Services Icons */}
          <Text className="text-[#fcfcfc]/30 font-black text-[11px] uppercase tracking-[0.4em] mb-8 ml-2">Shop Facilities</Text>
          <View className="flex-row justify-between mb-16 px-1">
            <ServiceNode title="Market" icon={ShoppingBag} color="#f59e0b" onPress={() => router.push("/market")} />
            <ServiceNode title="Loans" icon={TrendingUp} color="#10b981" onPress={() => router.push("/loans")} />
            <ServiceNode title="Susu" icon={Wallet} color="#10b981" onPress={() => router.push("/susu")} />
            <ServiceNode title="History" icon={Plus} color="#3b82f6" onPress={() => router.push("/history")} />
          </View>

          {/* Recent Activity Glass Panel */}
          <View className="flex-row justify-between items-end mb-8 px-2">
            <Text style={{ fontFamily: 'Display-Bold' }} className="text-[#fcfcfc] text-2xl tracking-tight">Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push("/history")}>
              <Text className="text-[#10b981] font-black text-[10px] uppercase tracking-widest mb-1">View History →</Text>
            </TouchableOpacity>
          </View>

          <Card glass className="p-2 border-[#10b981]/10">
            {activity.data?.map((item, idx) => (
              <View key={item.id} className={cn("flex-row items-center justify-between p-6", idx !== 4 && "border-b border-[#10b981]/10")}>
                <View className="flex-row items-center gap-5">
                  <View className={cn(
                    "h-14 w-14 rounded-[22px] bg-[#0f1714] items-center justify-center border",
                    item.type === 'income' ? "border-[#10b981]/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                  )}>
                    {item.type === 'income' ? <ArrowUpRight size={24} color="#10B981" /> : <ArrowDownLeft size={24} color="#EF4444" />}
                  </View>
                  <View>
                    <Text className="text-[#fcfcfc] font-bold text-base tracking-tight">{item.note}</Text>
                    <Text className="text-[#7d8a84] text-[10px] font-black uppercase mt-1 tracking-wider">{item.date}</Text>
                  </View>
                </View>
                <Text style={{ fontFamily: 'Display-Bold' }} className={cn("text-lg tracking-tighter", item.type === 'income' ? 'text-[#10b981]' : 'text-[#ef4444]')}>
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="items-center">
      <View style={{ borderColor: `${color}35`, backgroundColor: '#0f1714' }} className="h-20 w-20 rounded-[30px] items-center justify-center border shadow-2xl mb-4 relative">
        <Icon size={28} color={color} />
        <View style={{ backgroundColor: color, position: 'absolute', width: 30, height: 30, borderRadius: 15, opacity: 0.1 }} />
      </View>
      <Text className="text-[#fcfcfc]/30 font-black text-[9px] uppercase tracking-[0.35em]">{title}</Text>
    </TouchableOpacity>
  );
}
