import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  useAdminStats, usePendingLoans, useReviewLoan,
  useAllWithdrawalRequests, useUpdateWithdrawalStatus,
  useAllUserMessages, useReplyToUser,
  useAllProfiles
} from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { AdminChatCard } from "@/components/native/admin/chat-card";
import { ArrowLeft, TrendingUp, Banknote, Users, ArrowDownToLine, Check, X, MessageSquare, User, ShieldCheck } from "lucide-react-native";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function AdminScreen() {
  const router = useRouter();
  const stats = useAdminStats();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "loans" | "withdrawals" | "chat" | "users">("stats");

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([stats.refetch()]);
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="ml-4 h-10 w-10 rounded-xl bg-surface items-center justify-center border border-white/5">
            <ArrowLeft size={20} color="#fcfcfc" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        <View className="px-6">
          <PremiumHeader title="Command Center" subtitle="Admin Authority" />

          {/* Navigation Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10 -mx-6 px-6">
            <TabItem active={activeTab === "stats"} label="Overview" icon={TrendingUp} onPress={() => setActiveTab("stats")} />
            <TabItem active={activeTab === "loans"} label="Credit" icon={Banknote} onPress={() => setActiveTab("loans")} />
            <TabItem active={activeTab === "withdrawals"} label="Payouts" icon={ArrowDownToLine} onPress={() => setActiveTab("withdrawals")} />
            <TabItem active={activeTab === "chat"} label="Support" icon={MessageSquare} onPress={() => setActiveTab("chat")} />
            <TabItem active={activeTab === "users"} label="Directory" icon={User} onPress={() => setActiveTab("users")} />
          </ScrollView>

          {activeTab === "stats" && <SystemHealth stats={stats.data} />}
          {activeTab === "loans" && <LoanQueue />}
          {activeTab === "withdrawals" && <WithdrawalQueue />}
          {activeTab === "chat" && <AdminChatSection />}
          {activeTab === "users" && <UserDirectory />}
        </View>
      </ScrollView>
    </View>
  );
}

function TabItem({ active, label, icon: Icon, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} className={cn("flex-row items-center gap-2 px-6 py-4 rounded-[22px] mr-3 border", active ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-surface border-white/5")}>
      <Icon size={18} color={active ? "#0d1310" : "#10b981"} />
      <Text style={{ fontFamily: active ? 'Display-Bold' : 'Display-Regular' }} className={cn("text-[10px] uppercase tracking-widest", active ? "text-[#0d1310]" : "text-white")}>{label}</Text>
    </TouchableOpacity>
  );
}

function SystemHealth({ stats }: any) {
  return (
    <Animated.View entering={FadeInDown}>
      <View className="flex-row flex-wrap -mx-2 mb-6">
        <HealthCard title="Revenue" value={`GH₵ ${stats?.dailyIncome || 0}`} color="#10b981" />
        <HealthCard title="Active Risk" value={`GH₵ ${stats?.activeRisk || 0}`} color="#f59e0b" />
        <HealthCard title="Rate" value={`${stats?.approvalRate || 0}%`} color="#3b82f6" />
        <HealthCard title="Directory" value={stats?.totalUsers || 0} color="#8b5cf6" />
      </View>
      <Card glass>
         <Text className="text-primary font-black text-[10px] uppercase tracking-widest mb-1">Ecosystem Liquidity</Text>
         <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-3xl">GH₵ {((stats?.dailyIncome || 0) + (stats?.dailySales || 0)).toLocaleString()}</Text>
      </Card>
    </Animated.View>
  );
}

function HealthCard({ title, value, color }: any) {
  return (
    <View className="w-1/2 px-2 mb-4">
      <Card style={{ borderColor: `${color}30` }} className="p-5 bg-surface/40">
        <Text style={{ color }} className="text-[8px] font-black uppercase tracking-widest mb-1">{title}</Text>
        <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-lg">{value}</Text>
      </Card>
    </View>
  );
}

function LoanQueue() {
  const { data: loans, isLoading } = usePendingLoans();
  const review = useReviewLoan();
  if (isLoading) return <ActivityIndicator color="#10b981" className="mt-20" />;
  return (
    <Animated.View entering={FadeInDown}>
      {loans?.map((l) => (
        <Card key={l.id} className="mb-4">
          <View className="flex-row justify-between mb-4">
            <View>
              <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-xl">GH₵ {l.amount}</Text>
              <Text className="text-muted-foreground text-[10px] font-black uppercase">{l.profiles?.display_name}</Text>
            </View>
            <View className="bg-gold/10 px-3 py-1 rounded-full border border-gold/20"><Text className="text-gold text-[8px] font-black uppercase">{l.status}</Text></View>
          </View>
          <Text className="text-white/60 text-xs mb-6 italic">"{l.purpose}"</Text>
          <View className="flex-row gap-3">
             <Button title="Approve" size="sm" className="flex-1" onPress={() => review.mutate({ id: l.id, status: 'approved' })} />
             <Button title="Reject" size="sm" variant="destructive" className="flex-1" onPress={() => review.mutate({ id: l.id, status: 'rejected' })} />
          </View>
        </Card>
      ))}
    </Animated.View>
  );
}

function WithdrawalQueue() {
  const { data: reqs, isLoading } = useAllWithdrawalRequests();
  const update = useUpdateWithdrawalStatus();
  if (isLoading) return <ActivityIndicator color="#10b981" className="mt-20" />;
  return (
    <Animated.View entering={FadeInDown}>
      {reqs?.map((r) => (
        <Card key={r.id} className="mb-4">
          <View className="flex-row justify-between mb-6">
            <View>
              <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-xl">GH₵ {r.amount}</Text>
              <Text className="text-muted-foreground text-[10px] font-black uppercase">{r.profiles?.display_name}</Text>
            </View>
            <View className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20"><Text className="text-blue-500 text-[8px] font-black uppercase">PENDING</Text></View>
          </View>
          <View className="bg-black/20 p-4 rounded-2xl mb-6 border border-white/5">
             <Text className="text-white/40 text-[8px] font-black uppercase mb-1">Destination</Text>
             <Text className="text-white font-bold text-xs">{r.bank_name}: {r.account_number}</Text>
          </View>
          <Button title="Confirm Payout" onPress={() => update.mutate({ id: r.id, status: 'completed' })} />
        </Card>
      ))}
    </Animated.View>
  );
}

function AdminChatSection() {
  const { data: allMessages, isLoading } = useAllUserMessages();
  const reply = useReplyToUser();
  const qc = useQueryClient();

  if (isLoading) return <ActivityIndicator color="#10b981" className="mt-20" />;

  const grouped = (allMessages ?? []).reduce((acc, m) => {
    if (!acc[m.user_id]) acc[m.user_id] = { profile: (m as any).profiles, messages: [] };
    acc[m.user_id].messages.push(m);
    return acc;
  }, {} as Record<string, { profile: any, messages: any[] }>);

  return (
    <Animated.View entering={FadeInDown}>
      {Object.entries(grouped).map(([userId, data]) => (
        <AdminChatCard
          key={userId}
          user={data.profile}
          messages={data.messages}
          onReply={(t) => reply.mutateAsync({ user_id: userId, message: t })}
        />
      ))}
    </Animated.View>
  );
}

function UserDirectory() {
  const { data: users, isLoading } = useAllProfiles();
  if (isLoading) return <ActivityIndicator color="#10b981" className="mt-20" />;
  return (
    <Animated.View entering={FadeInDown}>
      {users?.map((u) => (
        <Card key={u.id} className="mb-3 flex-row items-center justify-between border-white/5 bg-surface/30">
          <View className="flex-row items-center gap-4">
             <View className="h-10 w-10 rounded-xl bg-primary/10 items-center justify-center border border-primary/20"><User size={18} color="#10b981" /></View>
             <View>
                <Text className="text-white font-bold text-sm">{u.display_name}</Text>
                <Text className="text-muted-foreground text-[8px] uppercase font-black">{u.business_name || 'Artisan'}</Text>
             </View>
          </View>
          <Text style={{ fontFamily: 'Display-Bold' }} className="text-gold text-lg">{u.clip_score}</Text>
        </Card>
      ))}
    </Animated.View>
  );
}
