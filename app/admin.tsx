import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft, TrendingUp, Banknote, ArrowDownToLine,
  MessageSquare, User, ShieldCheck, AlertCircle,
  CheckCircle2, XCircle, Clock, Users, Lock, Unlock,
  ShieldAlert, BellRing, Settings, Info
} from "lucide-react-native";
import {
  useAdminStats, usePendingLoans, useReviewLoan,
  useAllWithdrawalRequests, useUpdateWithdrawalStatus,
  useAllUserMessages, useReplyToUser,
  useAllProfiles, useSystemSettings, useSendBroadcast,
  useUpdateUserStatus
} from "@/lib/app-queries";
import { Card, StatCard } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import Animated, { FadeInDown } from "react-native-reanimated";
import { cn } from "@/lib/utils";
import { PremiumHeader } from "@/components/native/premium-header";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"stats" | "loans" | "withdrawals" | "chat" | "users" | "settings">("stats");
  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isRefetching } = useAdminStats();

  const onRefresh = async () => {
    await refetchStats();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerShown: true,
        title: "",
        headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/settings")}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        <View className="px-6">
          <PremiumHeader title="Command Center" subtitle="Admin Authority" />

          {/* Navigation Bar - Original Vertical Style */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10 -mx-6 px-6">
            <TabItem active={activeTab === "stats"} label="Overview" icon={TrendingUp} onPress={() => setActiveTab("stats")} />
            <TabItem active={activeTab === "loans"} label="Credit" icon={Banknote} onPress={() => setActiveTab("loans")} />
            <TabItem active={activeTab === "withdrawals"} label="Payouts" icon={ArrowDownToLine} onPress={() => setActiveTab("withdrawals")} />
            <TabItem active={activeTab === "chat"} label="Support" icon={MessageSquare} onPress={() => setActiveTab("chat")} />
            <TabItem active={activeTab === "users"} label="Users" icon={User} onPress={() => setActiveTab("users")} />
            <TabItem active={activeTab === "settings"} label="System" icon={ShieldCheck} onPress={() => setActiveTab("settings")} />
          </ScrollView>

          {activeTab === "stats" && <SystemHealth stats={stats} loading={statsLoading} />}
          {activeTab === "loans" && <LoanQueue />}
          {activeTab === "withdrawals" && <WithdrawalQueue />}
          {activeTab === "chat" && <AdminChatSection />}
          {activeTab === "users" && <UserDirectory />}
          {activeTab === "settings" && <SettingsSection />}
        </View>
      </ScrollView>
    </View>
  );
}

function TabItem({ active, label, icon: Icon, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} className="items-center mr-8">
      <View className={cn("p-3 rounded-2xl mb-2", active ? "bg-primary" : "bg-white/5")}>
        <Icon size={20} color={active ? "#000" : "#10B981"} />
      </View>
      <Text className={cn("text-[10px] font-bold uppercase tracking-widest", active ? "text-white" : "text-white/40")}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * COMPONENT: System Health (Grid View with Large Cards)
 */
function SystemHealth({ stats, loading }: any) {
  if (loading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;

  return (
    <Animated.View entering={FadeInDown} style={{ gap: 16 }}>
      {/* Featured Large Card */}
      <StatCard
        label="Total Revenue"
        value={`GH₵${stats?.totalCash || 0}`}
        hint="All Time"
        variant="emerald"
      />

      {/* Grid of StatCards - Side by Side */}
      <View style={styles.gridRow}>
        <View style={styles.gridItem}>
          <StatCard
            label="Volume"
            value={`GH₵${stats?.totalVolume || 0}`}
          />
        </View>
        <View style={styles.gridItem}>
          <StatCard
            label="Active Risk"
            value={`GH₵${stats?.activeRisk || 0}`}
            variant="gold"
          />
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridItem}>
          <StatCard
            label="Users"
            value={`${stats?.totalUsers || 0}`}
          />
        </View>
        <View style={styles.gridItem}>
          <StatCard
            label="Approval"
            value={`${stats?.approvalRate || 0}%`}
          />
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * COMPONENT: Loan Management
 */
function LoanQueue() {
  const { data: loans, isLoading, refetch } = usePendingLoans();
  const review = useReviewLoan();

  const handleAction = async (id: string | string[], status: 'approved' | 'rejected') => {
    try {
      await review.mutateAsync({ id, status });
      refetch();
    } catch (e: any) {
        Alert.alert("Error", e.message);
    }
  };

  if (isLoading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;
  if (!loans?.length) return <EmptyState icon={CheckCircle2} title="Clean Slate" subtitle="All loan applications processed." />;

  return (
    <Animated.View entering={FadeInDown}>
      <View className="flex-row justify-between items-center mb-4 px-2">
        <Text className="text-white font-bold">{loans.length} Pending</Text>
        <TouchableOpacity onPress={() => handleAction(loans.map(l => l.id), 'approved')}>
          <Text className="text-primary font-bold">Approve All</Text>
        </TouchableOpacity>
      </View>
      {loans.map((loan) => (
        <Card key={loan.id} className="mb-4 p-5">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white font-bold text-xl">GH₵ {loan.amount}</Text>
              <Text className="text-white/60 text-sm">{loan.profiles?.display_name}</Text>
              <Text className="text-xs text-primary/80 mt-1 italic">"{loan.purpose}"</Text>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => handleAction(loan.id, 'approved')} className="bg-primary/20 p-3 rounded-full">
                <CheckCircle2 size={24} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleAction(loan.id, 'rejected')} className="bg-red-500/10 p-3 rounded-full">
                <XCircle size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      ))}
    </Animated.View>
  );
}

/**
 * COMPONENT: User Directory
 */
function UserDirectory() {
  const { data: users, isLoading } = useAllProfiles();
  const updateStatus = useUpdateUserStatus();

  if (isLoading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;

  return (
    <View>
      {users?.map((u) => (
        <Card key={u.id} className="mb-4 p-5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 rounded-2xl bg-primary/10 items-center justify-center border border-primary/20">
              <User size={20} color="#10b981" />
            </View>
            <View>
              <Text className="text-white font-bold text-lg">{u.display_name || "User"}</Text>
              <Text className={cn("text-[10px] uppercase font-bold", u.status === 'banned' ? "text-red-500" : "text-primary")}>
                {u.status || 'Active'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-4">
             <Text className="text-gold font-bold text-xl">{u.clip_score}</Text>
             <TouchableOpacity
                onPress={() => updateStatus.mutate({ id: u.id, status: u.status === 'banned' ? 'active' : 'banned' })}
             >
                {u.status === 'banned' ? <Unlock size={22} color="#10b981" /> : <Lock size={22} color="#ef4444" />}
             </TouchableOpacity>
          </View>
        </Card>
      ))}
    </View>
  );
}

/**
 * COMPONENT: System Settings
 */
function SettingsSection() {
    const { settings, updateSettings } = useSystemSettings();
    const broadcast = useSendBroadcast();
    const [notif, setNotif] = useState({ title: "", body: "" });

    if (settings.isLoading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;

    const handleBroadcast = async () => {
      if (!notif.title || !notif.body) return Alert.alert("Required", "Fill all fields");

      Alert.alert("Confirm", "Send this broadcast to ALL users?", [
        { text: "Cancel", style: "cancel" },
        { text: "Send", onPress: async () => {
            await broadcast.mutateAsync(notif);
            setNotif({ title: "", body: "" });
            Alert.alert("Success", "Broadcast sent!");
        }}
      ]);
    };

    return (
      <Animated.View entering={FadeInDown}>
        <Text className="text-white font-bold mb-4 text-lg">System Preferences</Text>
        <Card className="mb-8 p-6">
          <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-white font-bold">Interest Rate</Text>
                <Text className="text-white/40 text-xs">Global % for loans</Text>
              </View>
              <View className="w-20">
                  <Input
                      value={String(settings.data?.interest_rate)}
                      keyboardType="numeric"
                      onChangeText={(val) => updateSettings.mutate({ interest_rate: parseFloat(val) })}
                      containerClassName="space-y-0"
                  />
              </View>
          </View>
          <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-white font-bold">Maintenance Mode</Text>
                <Text className="text-white/40 text-xs">Lock app transactions</Text>
              </View>
              <TouchableOpacity
                  onPress={() => updateSettings.mutate({ maintenance_mode: !settings.data?.maintenance_mode })}
                  className={cn("px-6 py-3 rounded-2xl", settings.data?.maintenance_mode ? "bg-red-500" : "bg-primary")}
              >
                  <Text className="font-black text-xs text-black">{settings.data?.maintenance_mode ? "DISABLE" : "ENABLE"}</Text>
              </TouchableOpacity>
          </View>
        </Card>

        <Text className="text-white font-bold mb-4 text-lg">Broadcast Message</Text>
        <Card className="p-6">
          <Input label="Title" value={notif.title} onChangeText={t => setNotif({...notif, title: t})} className="mb-4" />
          <Input label="Message" value={notif.body} onChangeText={t => setNotif({...notif, body: t})} multiline />
          <Button title="Send Alert" className="mt-6" onPress={handleBroadcast} loading={broadcast.isPending} />
        </Card>
      </Animated.View>
    );
}

function EmptyState({ icon: Icon, title, subtitle }: any) {
  return (
    <View className="items-center justify-center py-20 opacity-50">
      <Icon size={48} color="#10B981" />
      <Text className="text-white font-bold mt-4">{title}</Text>
      <Text className="text-slate-400">{subtitle}</Text>
    </View>
  );
}

function WithdrawalQueue() { return <EmptyState icon={Clock} title="No Payouts" subtitle="All withdrawal requests are cleared." /> }
function AdminChatSection() { return <EmptyState icon={MessageSquare} title="Inbox Empty" subtitle="No active support tickets." /> }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080C0A" },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginLeft: 16 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  gridItem: { flex: 1 }
});
