import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert, Platform, TextInput, KeyboardAvoidingView, Vibration } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Lucide from "lucide-react-native";
import {
  useAdminStats, usePendingLoans, useReviewLoan,
  useAllWithdrawalRequests, useUpdateWithdrawalStatus,
  useAllUserMessages, useReplyToUser,
  useAllProfiles, useSystemSettings, useSendBroadcast,
  useUpdateUserStatus,
  useAllOrders,
  useUpdateOrderStatus,
  useAllSusuGroups,
  useDisburseSusuPot
} from "@/lib/app-queries";
import { Card, StatCard } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import Animated, { FadeInDown } from "react-native-reanimated";
import { cn } from "@/lib/utils";
import { PremiumHeader } from "@/components/native/premium-header";
import { LinearGradient } from "expo-linear-gradient";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useTheme } from "@/context/theme-context";

export default function AdminDashboard() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"stats" | "loans" | "withdrawals" | "orders" | "circles" | "chat" | "users" | "settings">("stats");
  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isRefetching } = useAdminStats();

  const onRefresh = async () => {
    await refetchStats();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Stack.Screen options={{
        headerShown: true,
        title: "",
        headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/settings")}
            style={[styles.backButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Lucide.ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 150 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="px-6">
          <PremiumHeader title="Command Center" subtitle="Admin Authority" />

          {/* Navigation Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10 -mx-6 px-6">
            <TabItem active={activeTab === "stats"} label="Overview" icon={Lucide.TrendingUp} onPress={() => setActiveTab("stats")} />
            <TabItem active={activeTab === "loans"} label="Credit" icon={Lucide.Banknote} onPress={() => setActiveTab("loans")} />
            <TabItem active={activeTab === "withdrawals"} label="Payouts" icon={Lucide.ArrowDownToLine} onPress={() => setActiveTab("withdrawals")} />
            <TabItem active={activeTab === "orders"} label="Orders" icon={Lucide.ShoppingBag} onPress={() => setActiveTab("orders")} />
            <TabItem active={activeTab === "circles"} label="Circles" icon={Lucide.Users} onPress={() => setActiveTab("circles")} />
            <TabItem active={activeTab === "chat"} label="Support" icon={Lucide.MessageSquare} onPress={() => setActiveTab("chat")} />
            <TabItem active={activeTab === "users"} label="Users" icon={Lucide.User} onPress={() => setActiveTab("users")} />
            <TabItem active={activeTab === "settings"} label="System" icon={Lucide.ShieldCheck} onPress={() => setActiveTab("settings")} />
          </ScrollView>

          {activeTab === "stats" && <SystemHealth stats={stats} loading={statsLoading} />}
          {activeTab === "loans" && <LoanQueue />}
          {activeTab === "withdrawals" && <WithdrawalQueue />}
          {activeTab === "orders" && <OrderManagement />}
          {activeTab === "circles" && <SusuManagement />}
          {activeTab === "chat" && <AdminChatSection />}
          {activeTab === "users" && <UserDirectory />}
          {activeTab === "settings" && <SettingsSection />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TabItem({ active, label, icon: Icon, onPress }: any) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} className="items-center mr-8">
      <View style={{ backgroundColor: active ? colors.primary : colors.surfaceElevated }} className={cn("p-3 rounded-2xl mb-2")}>
        <Icon size={20} color={active ? "#000" : colors.primary} />
      </View>
      <Text style={{ color: active ? colors.text : colors.textDim }} className={cn("text-[10px] font-bold uppercase tracking-widest")}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * COMPONENT: System Health
 */
function SystemHealth({ stats, loading }: any) {
  const { colors } = useTheme();
  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <Animated.View entering={FadeInDown} style={styles.grid}>
      <View style={{ width: "100%", marginBottom: 4 }}>
        <StatCard
          label="Total Revenue"
          value={`GH₵${stats?.totalCash || 0}`}
          variant="emerald"
        />
      </View>

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
    </Animated.View>
  );
}

/**
 * COMPONENT: Loan Management
 */
function LoanQueue() {
  const { colors } = useTheme();
  const { data: allLoans, isLoading, refetch } = usePendingLoans();
  const [view, setView] = React.useState<'pending' | 'history'>('pending');
  const review = useReviewLoan();

  const handleAction = async (id: string | string[], status: 'approved' | 'rejected') => {
    try {
      await review.mutateAsync({ id, status });
      refetch();
      if (Platform.OS === 'web') {
        alert(`Success: Loan ${status}.`);
      } else {
        Alert.alert("Success", `Loan ${status}.`);
      }
    } catch (e: any) {
        Alert.alert("Error", e.message);
    }
  };

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  const displayLoans = allLoans?.filter(l => view === 'pending' ? l.status === 'pending' : l.status !== 'pending') || [];

  return (
    <Animated.View entering={FadeInDown}>
      <View style={{ backgroundColor: colors.surfaceElevated }} className="flex-row p-1 rounded-xl mb-6">
        <TouchableOpacity
          onPress={() => setView('pending')}
          style={{ backgroundColor: view === 'pending' ? colors.cardBg : 'transparent' }}
          className={cn("flex-1 py-2 rounded-lg items-center")}
        >
          <Text style={{ color: view === 'pending' ? colors.text : colors.textDim }} className={cn("font-bold")}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView('history')}
          style={{ backgroundColor: view === 'history' ? colors.cardBg : 'transparent' }}
          className={cn("flex-1 py-2 rounded-lg items-center")}
        >
          <Text style={{ color: view === 'history' ? colors.text : colors.textDim }} className={cn("font-bold")}>History</Text>
        </TouchableOpacity>
      </View>

      {displayLoans.length === 0 ? (
        <EmptyState icon={Lucide.Inbox} title="No Records" subtitle={`No ${view} loans found.`} />
      ) : (
        displayLoans.map((loan) => (
          <Card key={loan.id} style={{ backgroundColor: colors.cardBg, borderColor: colors.border }} className="mb-4 p-5">
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text style={{ color: colors.text }} className="font-bold text-xl">GH₵ {loan.amount}</Text>
                  {loan.status !== 'pending' && (
                    <View style={{ backgroundColor: (loan.status === 'approved' || loan.status === 'completed' || loan.status === 'repaying') ? colors.primary + '20' : colors.destructive + '20' }} className={cn("ml-2 px-2 py-0.5 rounded-full")}>
                      <Text style={{ color: (loan.status === 'approved' || loan.status === 'completed' || loan.status === 'repaying') ? colors.primary : colors.destructive }} className={cn("text-[10px] font-bold uppercase")}>
                        {loan.status}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: colors.textMuted }} className="text-sm">{loan.profiles?.display_name}</Text>
                <Text style={{ color: colors.textDim }} className="text-xs mt-1 italic">"{loan.purpose}"</Text>
              </View>

              {loan.status === 'pending' && (
                <View className="flex-row gap-3">
                   <TouchableOpacity
                    onPress={() => {}} // Logic to view user info if needed
                    style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border }}
                    className="p-3 rounded-full border"
                  >
                    <Lucide.Search size={24} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAction(loan.id, 'approved')}
                    disabled={review.isPending}
                    style={{ backgroundColor: colors.primary + '20' }}
                    className="p-3 rounded-full"
                  >
                    <Lucide.CheckCircle2 size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAction(loan.id, 'rejected')}
                    disabled={review.isPending}
                    style={{ backgroundColor: colors.destructive + '10' }}
                    className="p-3 rounded-full"
                  >
                    <Lucide.XCircle size={24} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Card>
        ))
      )}
    </Animated.View>
  );
}

/**
 * COMPONENT: Payout Management (Withdrawals)
 */
function WithdrawalQueue() {
  const { colors } = useTheme();
  const { data: requests, isLoading, refetch } = useAllWithdrawalRequests();
  const [view, setView] = React.useState<'pending' | 'history'>('pending');
  const updateStatus = useUpdateWithdrawalStatus();

  const handleAction = async (id: string, status: 'completed' | 'rejected') => {
    const actionLabel = status === 'completed' ? "Mark as Paid" : "Decline";

    const proceed = () => {
      updateStatus.mutate({ id, status }, {
        onSuccess: () => {
          refetch();
          if (Platform.OS === 'web') {
            alert(`Success: Withdrawal ${status === 'completed' ? 'marked as paid' : 'declined'}.`);
          } else {
            Alert.alert("Success", `Withdrawal ${status === 'completed' ? 'marked as paid' : 'declined'}.`);
          }
        },
        onError: (error: any) => {
          Alert.alert("Error", error.message || "Failed to update status");
        }
      });
    };

    if (Platform.OS === 'web') {
      if (confirm(`Are you sure you want to ${actionLabel.toLowerCase()} this withdrawal?`)) {
        proceed();
      }
    } else {
      Alert.alert(
        "Confirm Action",
        `Are you sure you want to ${actionLabel.toLowerCase()} this withdrawal?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: actionLabel, style: status === 'rejected' ? "destructive" : "default", onPress: proceed }
        ]
      );
    }
  };

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  const displayRequests = requests?.filter(r => view === 'pending' ? r.status === 'pending' : r.status !== 'pending') || [];

  return (
    <Animated.View entering={FadeInDown}>
      <View style={{ backgroundColor: colors.surfaceElevated }} className="flex-row p-1 rounded-xl mb-6">
        <TouchableOpacity
          onPress={() => setView('pending')}
          style={{ backgroundColor: view === 'pending' ? colors.cardBg : 'transparent' }}
          className={cn("flex-1 py-2 rounded-lg items-center")}
        >
          <Text style={{ color: view === 'pending' ? colors.text : colors.textDim }} className={cn("font-bold")}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView('history')}
          style={{ backgroundColor: view === 'history' ? colors.cardBg : 'transparent' }}
          className={cn("flex-1 py-2 rounded-lg items-center")}
        >
          <Text style={{ color: view === 'history' ? colors.text : colors.textDim }} className={cn("font-bold")}>History</Text>
        </TouchableOpacity>
      </View>

      {displayRequests.length === 0 ? (
        <EmptyState icon={Lucide.Clock} title="Empty" subtitle={`No ${view} payouts found.`} />
      ) : (
        displayRequests.map((req) => (
          <Card key={req.id} style={{ backgroundColor: colors.cardBg, borderColor: colors.border }} className="mb-4 p-5">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  <Text style={{ color: colors.text }} className="font-bold text-xl">GH₵ {req.amount}</Text>
                  <View style={{ backgroundColor: req.status === 'pending' ? colors.gold + '20' : req.status === 'completed' ? colors.primary + '20' : colors.destructive + '20' }} className={cn("ml-2 px-2 py-0.5 rounded-full")}>
                    <Text style={{ color: req.status === 'pending' ? colors.gold : req.status === 'completed' ? colors.primary : colors.destructive }} className={cn("text-[10px] font-bold uppercase")}>
                      {req.status === 'completed' ? 'PAID' : req.status}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.textMuted }} className="text-sm mb-3">{req.profiles?.display_name || "Unknown User"}</Text>

                <View style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border }} className="p-3 rounded-lg border">
                  <Text style={{ color: colors.textDim }} className="text-[10px] uppercase font-bold mb-1">Bank Details</Text>
                  <Text style={{ color: colors.text }} className="font-medium">{req.bank_name}</Text>
                  <Text style={{ color: colors.text }} className="font-medium">{req.account_number}</Text>
                  <Text style={{ color: colors.textMuted }} className="text-xs">{req.account_name}</Text>
                </View>
              </View>

              {req.status === 'pending' && (
                <View style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleAction(req.id, 'completed')}
                    disabled={updateStatus.isPending}
                    style={{ backgroundColor: colors.primary }}
                    className="px-4 py-3 rounded-xl items-center"
                  >
                    {updateStatus.isPending ? <ActivityIndicator size="small" color="#000" /> : <Text className="text-black font-black text-xs">MARK PAID</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAction(req.id, 'rejected')}
                    disabled={updateStatus.isPending}
                    style={{ backgroundColor: colors.destructive + '10', borderColor: colors.destructive + '20' }}
                    className="border px-4 py-3 rounded-xl items-center"
                  >
                    <Text style={{ color: colors.destructive }} className="font-bold text-xs">DECLINE</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Card>
        ))
      )}
    </Animated.View>
  );
}

/**
 * COMPONENT: Order Management
 */
function OrderManagement() {
  const { colors } = useTheme();
  const { data: orders, isLoading, refetch } = useAllOrders();
  const updateStatus = useUpdateOrderStatus();
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'shipped' | 'completed'>('all');

  const handleUpdate = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      refetch();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  const filteredOrders = orders?.filter(o => filter === 'all' || o.status === filter) || [];

  return (
    <Animated.View entering={FadeInDown}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
        {['all', 'pending', 'paid', 'shipped', 'completed'].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f as any)}
            style={{ backgroundColor: filter === f ? colors.primary : colors.surfaceElevated }}
            className={cn("px-4 py-2 rounded-full mr-2")}
          >
            <Text style={{ color: filter === f ? '#000' : colors.textDim }} className={cn("font-bold text-xs uppercase")}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredOrders.length === 0 ? (
        <EmptyState icon={Lucide.ShoppingBag} title="No Orders" subtitle="No orders found for this filter." />
      ) : (
        filteredOrders.map((order) => (
          <Card key={order.id} style={{ backgroundColor: colors.cardBg, borderColor: colors.border }} className="mb-6 p-5">
            <View className="flex-row justify-between mb-3">
              <View>
                <Text style={{ color: colors.text }} className="font-bold text-lg">GH₵ {order.total}</Text>
                <Text style={{ color: colors.textDim }} className="text-xs uppercase font-bold">{order.payment_method}</Text>
              </View>
              <View style={{ backgroundColor: order.status === 'completed' ? colors.primary + '20' : order.status === 'pending' ? colors.gold + '20' : '#3b82f620' }} className={cn("px-3 py-1 rounded-full")}>
                <Text style={{ color: order.status === 'completed' ? colors.primary : order.status === 'pending' ? colors.gold : '#3b82f6' }} className={cn("text-[10px] font-bold uppercase")}>{order.status}</Text>
              </View>
            </View>

            <View className="mb-4">
              <Text style={{ color: colors.textMuted }} className="text-sm">Buyer: {order.profiles?.display_name}</Text>
              <Text style={{ color: colors.textDim }} className="text-xs">Shop: {order.profiles?.business_name}</Text>
            </View>

            <View style={{ backgroundColor: colors.surfaceElevated }} className="p-3 rounded-lg mb-4">
              {order.order_items?.map((item: any) => (
                <Text key={item.id} style={{ color: colors.textMuted }} className="text-xs">
                   • {item.products?.name} (x{item.qty})
                </Text>
              ))}
            </View>

            <View className="flex-row gap-2">
              {order.status === 'pending' && (
                <Button title="Mark Paid" className="flex-1 py-2" onPress={() => handleUpdate(order.id, 'paid')} />
              )}
              {order.status === 'paid' && (
                <Button title="Ship Order" className="flex-1 py-2" onPress={() => handleUpdate(order.id, 'shipped')} />
              )}
              {order.status === 'shipped' && (
                <Button title="Complete" className="flex-1 py-2" onPress={() => handleUpdate(order.id, 'completed')} />
              )}
              <TouchableOpacity
                onPress={() => handleUpdate(order.id, 'cancelled')}
                style={{ borderColor: colors.destructive + '40' }}
                className="px-4 py-2 border rounded-xl"
              >
                <Text style={{ color: colors.destructive }} className="font-bold text-xs">CANCEL</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}
    </Animated.View>
  );
}

/**
 * COMPONENT: Susu Management
 */
function SusuManagement() {
  const { colors } = useTheme();
  const { data: groups, isLoading, refetch } = useAllSusuGroups();
  const disburse = useDisburseSusuPot();

  const handleDisburse = async (group: any) => {
    Alert.alert(
      "Confirm Disbursement",
      `Are you sure you want to disburse GH₵ ${group.pot} for ${group.name}? This will mark the current cycle winner as paid and reset the pot.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await disburse.mutateAsync({
                group_id: group.id,
                user_id: group.owner_id,
                amount: group.pot
              });
              refetch();
              Alert.alert("Success", "Pot has been disbursed successfully.");
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          }
        }
      ]
    );
  };

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <Animated.View entering={FadeInDown}>
      <Text style={{ color: colors.textDim }} className="text-[10px] uppercase font-bold mb-4 px-2 tracking-widest">Global Savings Circles</Text>

      {(!groups || groups.length === 0) ? (
        <EmptyState icon={Lucide.Users} title="No Circles" subtitle="No active Susu circles found." />
      ) : (
        groups.map((group) => (
          <Card key={group.id} style={{ backgroundColor: colors.cardBg, borderColor: colors.border }} className="mb-4 p-5">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="font-bold text-lg">{group.name}</Text>
                <Text style={{ color: colors.textDim }} className="text-[10px] uppercase font-bold">
                  {group.frequency} · {group.members_count} Members
                </Text>
              </View>
              <View style={{ backgroundColor: colors.primary + '20' }} className="px-3 py-1 rounded-full">
                <Text style={{ color: colors.primary }} className="text-[10px] font-black uppercase">Cycle #{group.cycle_index}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
               <View>
                  <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>CURRENT POT</Text>
                  <Text style={{ color: colors.primary, fontFamily: 'Display-Bold', fontSize: 20 }}>GH₵ {group.pot?.toLocaleString()}</Text>
               </View>
               <View style={{ alignItems: 'flex-end' }}>
                  {group.pot > 0 ? (
                    <TouchableOpacity
                      onPress={() => handleDisburse(group)}
                      style={{ backgroundColor: colors.primary }}
                      className="px-4 py-2 rounded-lg"
                    >
                      <Text className="text-black font-black text-[10px] uppercase">Disburse</Text>
                    </TouchableOpacity>
                  ) : (
                    <View>
                      <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>CONTRIBUTION</Text>
                      <Text style={{ color: colors.text, fontWeight: 'bold' }}>GH₵ {group.contribution}</Text>
                    </View>
                  )}
               </View>
            </View>
          </Card>
        ))
      )}
    </Animated.View>
  );
}

/**
 * COMPONENT: Admin Support / Chat
 */
function AdminChatSection() {
  const { colors } = useTheme();
  const { data: messages, isLoading, refetch } = useAllUserMessages();
  const replyMutation = useReplyToUser();
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const handleReply = async (userId: string) => {
    const text = replyText[userId];
    if (!text || !text.trim()) return;

    try {
      await replyMutation.mutateAsync({ user_id: userId, message: text.trim() });
      setReplyText(prev => ({ ...prev, [userId]: "" }));
      refetch();
    } catch (e: any) {
      // Alert.alert("Error", e.message);
    }
  };

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  // Group messages by user
  const groupedMessages = messages?.reduce((acc: any, msg: any) => {
    if (!acc[msg.user_id]) {
      acc[msg.user_id] = {
        profile: msg.profiles,
        msgs: []
      };
    }
    acc[msg.user_id].msgs.push(msg);
    return acc;
  }, {});

  const userIds = Object.keys(groupedMessages || {});

  if (userIds.length === 0) return <EmptyState icon={Lucide.MessageSquare} title="Inbox Empty" subtitle="No active support tickets." />;

  return (
    <Animated.View entering={FadeInDown}>
      <Text style={{ color: colors.text }} className="font-bold mb-4 px-2">{userIds.length} Active Conversations</Text>
      {userIds.map((userId) => (
        <Card key={userId} style={{ backgroundColor: colors.cardBg, borderColor: colors.border }} className="mb-6 p-5">
          <View className="flex-row items-center mb-4">
            <View style={{ backgroundColor: colors.primary + '15' }} className="h-10 w-10 rounded-full items-center justify-center mr-3">
              <Lucide.User size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ color: colors.text }} className="font-bold">{groupedMessages[userId].profile?.display_name || "User"}</Text>
              <Text style={{ color: colors.textDim }} className="text-xs">{groupedMessages[userId].profile?.business_name || "No Business Name"}</Text>
            </View>
          </View>

          <View className="mb-4">
            {groupedMessages[userId].msgs
              .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .slice(-10) // Show last 10 messages for context
              .map((m: any) => (
              <View
                key={m.id}
                style={{
                  backgroundColor: m.is_from_admin ? colors.primary + '15' : colors.surfaceElevated,
                  borderColor: m.is_from_admin ? colors.primary + '30' : colors.border
                }}
                className={cn(
                  "p-3 rounded-2xl mb-2 max-w-[85%] border",
                  m.is_from_admin ? "self-end" : "self-start"
                )}
              >
                <Text style={{ color: m.is_from_admin ? colors.primary : colors.text }} className={cn("text-sm", m.is_from_admin ? "font-medium" : "")}>
                  {m.message}
                </Text>
                <Text style={{ color: colors.textDim }} className="text-[8px] mt-1 self-end">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center gap-2">
            <View style={{ flex: 1, height: 56, backgroundColor: colors.surfaceElevated, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, justifyContent: 'center' }}>
              <TextInput
                placeholder="Type transmission..."
                placeholderTextColor={colors.textDim}
                value={replyText[userId] || ""}
                onChangeText={(t) => setReplyText(prev => ({ ...prev, [userId]: t }))}
                style={{ color: colors.text, fontWeight: 'bold', fontSize: 13 }}
                multiline
              />
            </View>
            <BouncyTap
              onPress={() => handleReply(userId)}
              disabled={!replyText[userId]?.trim() || replyMutation.isPending}
            >
              <LinearGradient
                colors={replyText[userId]?.trim() ? [colors.primary, colors.primary + 'cc'] : [colors.surfaceElevated, colors.cardBg]}
                style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: replyText[userId]?.trim() ? 0.3 : 0, shadowRadius: 10 }}
              >
                {replyMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Lucide.Send size={20} color={replyText[userId]?.trim() ? "#000" : colors.textDim} strokeWidth={2.5} />
                )}
              </LinearGradient>
            </BouncyTap>
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
  const { colors } = useTheme();
  const { data: users, isLoading } = useAllProfiles();
  const updateStatus = useUpdateUserStatus();

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View>
      {users?.map((u) => (
        <Card key={u.id} style={{ backgroundColor: colors.cardBg, borderColor: colors.border }} className="mb-4 p-5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <View style={{ backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }} className="h-12 w-12 rounded-2xl items-center justify-center border">
              <Lucide.User size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ color: colors.text }} className="font-bold text-lg">{u.display_name || "User"}</Text>
              <Text style={{ color: u.status === 'banned' ? colors.destructive : colors.primary }} className={cn("text-[10px] uppercase font-bold")}>
                {u.status || 'Active'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-4">
             <Text style={{ color: colors.gold }} className="font-bold text-xl">{u.clip_score}</Text>
             <TouchableOpacity
                onPress={() => updateStatus.mutate({ id: u.id, status: u.status === 'banned' ? 'active' : 'banned' })}
             >
                {u.status === 'banned' ? <Lucide.Unlock size={22} color={colors.primary} /> : <Lucide.Lock size={22} color={colors.destructive} />}
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
    const { colors, theme } = useTheme();
    const { settings, updateSettings } = useSystemSettings();
    const broadcast = useSendBroadcast();
    const [notif, setNotif] = useState({ title: "", body: "" });
    const [localRate, setLocalRate] = useState<string>("");

    useEffect(() => {
        if (settings.data) {
            setLocalRate(String(settings.data.interest_rate));
        }
    }, [settings.data]);

    if (settings.isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

    const handleUpdateRate = () => {
        const rate = parseFloat(localRate);
        if (!isNaN(rate)) {
            updateSettings.mutate({ interest_rate: rate });
            Vibration.vibrate(Platform.OS === 'ios' ? 0 : 10);
            Alert.alert("Governance Update", `Institutional Interest Rate successfully adjusted to ${rate}%.`);
        } else {
            Alert.alert("Invalid Input", "Please enter a numeric percentage.");
        }
    };

    const handleBroadcast = async () => {
      if (!notif.title.trim() || !notif.body.trim()) {
        return Alert.alert("Required", "Please fill in both the title and the message.");
      }

      const performBroadcast = async () => {
        try {
          await broadcast.mutateAsync({ title: notif.title, body: notif.body });
          setNotif({ title: "", body: "" });
          Alert.alert("Success", "Institutional broadcast transmitted to all vault users.");
        } catch (e: any) {
          Alert.alert("Error", e.message);
        }
      };

      Alert.alert(
        "Confirm Broadcast",
        "This message will be transmitted to ALL registered vault users. Proceed?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "TRANSMIT", style: "destructive", onPress: performBroadcast }
        ]
      );
    };

    return (
      <Animated.View entering={FadeInDown}>
        <View className="mb-8">
          <Text style={{ color: colors.text }} className="font-bold mb-4 text-lg">System Governance</Text>
          <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.border }} className="p-6">
            <View style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border }} className="mb-8 p-4 rounded-2xl border">
                <View className="mb-4">
                  <Text style={{ color: colors.text }} className="font-bold text-sm">Base Interest Rate</Text>
                  <Text style={{ color: colors.textDim }} className="text-[10px] uppercase font-bold tracking-widest mt-1">Global credit growth percentage</Text>
                </View>

                <View className="flex-row items-center gap-4">
                    <View style={{ backgroundColor: colors.cardBg, borderColor: colors.border }} className="flex-1 flex-row items-center rounded-2xl px-5 h-16 border">
                        <TextInput
                            value={localRate}
                            keyboardType="decimal-pad"
                            onChangeText={setLocalRate}
                            placeholder="0.0"
                            placeholderTextColor={colors.textDim}
                            style={{ flex: 1, color: colors.primary, fontFamily: 'Display-Bold', fontSize: 24 }}
                            selectionColor={colors.primary}
                        />
                        <Text style={{ fontFamily: 'Display-Bold', color: colors.primary }} className="text-xl ml-2">%</Text>
                    </View>

                    <BouncyTap onPress={handleUpdateRate}>
                       <LinearGradient
                        colors={[colors.primary, colors.primary + 'cc']}
                        style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10 }}
                       >
                          <Lucide.Check size={28} color="#000" strokeWidth={3} />
                       </LinearGradient>
                    </BouncyTap>
                </View>
            </View>

            <View style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border }} className="flex-row justify-between items-center p-6 rounded-2xl border">
                <View className="flex-1 mr-4">
                  <Text style={{ color: colors.text }} className="font-bold text-sm">Vault Lockdown</Text>
                  <Text style={{ color: colors.textDim }} className="text-[10px] uppercase font-bold tracking-widest mt-1">Suspend all global activities</Text>
                </View>

                <BouncyTap
                  onPress={async () => {
                    const newVal = !settings.data?.maintenance_mode;
                    try {
                      Vibration.vibrate(Platform.OS === 'ios' ? 0 : [0, 50, 20, 50]);
                      await updateSettings.mutateAsync({ maintenance_mode: newVal });
                      Alert.alert("Vault Protocol", `System Lockdown has been ${newVal ? 'ENGAGED' : 'RELEASED'}.`);
                    } catch (e: any) {
                      Alert.alert("Error", e.message);
                    }
                  }}
                >
                  <LinearGradient
                    colors={settings.data?.maintenance_mode ? ['#ef4444', '#7f1d1d'] : [colors.primary, colors.primary + 'cc']}
                    style={styles.maintenanceBtn}
                  >
                    <View style={styles.maintenanceBtnInner}>
                       {settings.data?.maintenance_mode ? (
                         <Lucide.ShieldAlert size={16} color="#000" strokeWidth={3} />
                       ) : (
                         <Lucide.ShieldCheck size={16} color="#000" strokeWidth={3} />
                       )}
                       <Text style={styles.maintenanceBtnText}>
                         {settings.data?.maintenance_mode ? "RELEASE VAULT" : "ENGAGE LOCKDOWN"}
                       </Text>
                    </View>
                  </LinearGradient>
                </BouncyTap>
            </View>
          </Card>
        </View>

        <Text style={{ color: colors.text }} className="font-bold mb-4 text-lg">Broadcast Protocol</Text>
        <Card style={{ backgroundColor: colors.cardBg, borderColor: colors.border, borderRadius: 40 }} className="p-8">
          <View className="mb-8">
            <View className="flex-row items-center gap-2 mb-3 ml-1">
              <Lucide.Tag size={12} color={colors.primary} />
              <Text style={{ color: colors.primary }} className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Signal Title</Text>
            </View>
            <TextInput
              value={notif.title}
              onChangeText={t => setNotif(prev => ({...prev, title: t}))}
              placeholder="e.g. SYSTEM UPGRADE COMPLETE"
              placeholderTextColor={colors.textDim}
              style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }}
              className="h-16 rounded-2xl px-6 font-bold border"
              selectionColor={colors.primary}
            />
          </View>

          <View className="mb-10">
            <View className="flex-row items-center gap-2 mb-3 ml-1">
              <Lucide.MessageSquare size={12} color={colors.primary} />
              <Text style={{ color: colors.primary }} className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Global Transmission</Text>
            </View>
            <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
              <TextInput
                value={notif.body}
                onChangeText={t => setNotif(prev => ({...prev, body: t}))}
                placeholder="Type institutional transmission details..."
                placeholderTextColor={colors.textDim}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{ minHeight: 160, padding: 20, color: colors.text, fontSize: 15, fontWeight: '500', lineHeight: 22 }}
                selectionColor={colors.primary}
              />
              <LinearGradient
                colors={['transparent', colors.primary + '05']}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 }}
                pointerEvents="none"
              />
            </View>
          </View>

          <BouncyTap onPress={handleBroadcast} disabled={broadcast.isPending}>
            <LinearGradient
              colors={[colors.primary, colors.primary + 'cc']}
              style={{ height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}
            >
               {broadcast.isPending ? (
                 <ActivityIndicator color="#000" />
               ) : (
                 <View className="flex-row items-center gap-4">
                   <Text style={{ fontFamily: 'Display-Bold' }} className="text-black text-sm tracking-[0.1em] uppercase">Initiate Broadcast</Text>
                   <Lucide.Zap size={20} color="#000" fill="#000" />
                 </View>
               )}
            </LinearGradient>
          </BouncyTap>
        </Card>
      </Animated.View>
    );
}

function EmptyState({ icon: Icon, title, subtitle }: any) {
  const { colors } = useTheme();
  return (
    <View className="items-center justify-center py-20 opacity-50">
      <Icon size={48} color={colors.primary} />
      <Text style={{ color: colors.text }} className="font-bold mt-4">{title}</Text>
      <Text style={{ color: colors.textMuted }}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080C0A" },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginLeft: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 16 },
  gridItem: { width: "48%" },
  maintenanceBtn: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  maintenanceBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  maintenanceBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1.5
  }
});
