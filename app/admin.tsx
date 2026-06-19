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

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"stats" | "loans" | "withdrawals" | "orders" | "circles" | "chat" | "users" | "settings">("stats");
  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isRefetching } = useAdminStats();

  const onRefresh = async () => {
    await refetchStats();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#080C0A" }}
    >
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
            <Lucide.ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#10B981" />}
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
 * COMPONENT: System Health
 */
function SystemHealth({ stats, loading }: any) {
  if (loading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;

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

  if (isLoading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;

  const displayLoans = allLoans?.filter(l => view === 'pending' ? l.status === 'pending' : l.status !== 'pending') || [];

  return (
    <Animated.View entering={FadeInDown}>
      <View className="flex-row bg-white/5 p-1 rounded-xl mb-6">
        <TouchableOpacity
          onPress={() => setView('pending')}
          className={cn("flex-1 py-2 rounded-lg items-center", view === 'pending' ? "bg-white/10" : "")}
        >
          <Text className={cn("font-bold", view === 'pending' ? "text-white" : "text-white/40")}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView('history')}
          className={cn("flex-1 py-2 rounded-lg items-center", view === 'history' ? "bg-white/10" : "")}
        >
          <Text className={cn("font-bold", view === 'history' ? "text-white" : "text-white/40")}>History</Text>
        </TouchableOpacity>
      </View>

      {displayLoans.length === 0 ? (
        <EmptyState icon={Lucide.Inbox} title="No Records" subtitle={`No ${view} loans found.`} />
      ) : (
        displayLoans.map((loan) => (
          <Card key={loan.id} className="mb-4 p-5">
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-white font-bold text-xl">GH₵ {loan.amount}</Text>
                  {loan.status !== 'pending' && (
                    <View className={cn("ml-2 px-2 py-0.5 rounded-full", (loan.status === 'approved' || loan.status === 'completed' || loan.status === 'repaying') ? "bg-primary/20" : "bg-red-500/20")}>
                      <Text className={cn("text-[10px] font-bold uppercase", (loan.status === 'approved' || loan.status === 'completed' || loan.status === 'repaying') ? "text-primary" : "text-red-500")}>
                        {loan.status}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-white/60 text-sm">{loan.profiles?.display_name}</Text>
                <Text className="text-xs text-white/40 mt-1 italic">"{loan.purpose}"</Text>
              </View>

              {loan.status === 'pending' && (
                <View className="flex-row gap-3">
                   <TouchableOpacity
                    onPress={() => setActiveTab("stats")} // Logic to view user info if needed, but for now just a shortcut
                    className="bg-white/5 p-3 rounded-full border border-white/5"
                  >
                    <Lucide.Search size={24} color="#7d8a84" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAction(loan.id, 'approved')}
                    disabled={review.isPending}
                    className="bg-primary/20 p-3 rounded-full"
                  >
                    <Lucide.CheckCircle2 size={24} color="#10b981" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAction(loan.id, 'rejected')}
                    disabled={review.isPending}
                    className="bg-red-500/10 p-3 rounded-full"
                  >
                    <Lucide.XCircle size={24} color="#ef4444" />
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

  if (isLoading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;

  const displayRequests = requests?.filter(r => view === 'pending' ? r.status === 'pending' : r.status !== 'pending') || [];

  return (
    <Animated.View entering={FadeInDown}>
      <View className="flex-row bg-white/5 p-1 rounded-xl mb-6">
        <TouchableOpacity
          onPress={() => setView('pending')}
          className={cn("flex-1 py-2 rounded-lg items-center", view === 'pending' ? "bg-white/10" : "")}
        >
          <Text className={cn("font-bold", view === 'pending' ? "text-white" : "text-white/40")}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView('history')}
          className={cn("flex-1 py-2 rounded-lg items-center", view === 'history' ? "bg-white/10" : "")}
        >
          <Text className={cn("font-bold", view === 'history' ? "text-white" : "text-white/40")}>History</Text>
        </TouchableOpacity>
      </View>

      {displayRequests.length === 0 ? (
        <EmptyState icon={Lucide.Clock} title="Empty" subtitle={`No ${view} payouts found.`} />
      ) : (
        displayRequests.map((req) => (
          <Card key={req.id} className="mb-4 p-5">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  <Text className="text-white font-bold text-xl">GH₵ {req.amount}</Text>
                  <View className={cn("ml-2 px-2 py-0.5 rounded-full",
                    req.status === 'pending' ? "bg-yellow-500/20" :
                    req.status === 'completed' ? "bg-primary/20" : "bg-red-500/20"
                  )}>
                    <Text className={cn("text-[10px] font-bold uppercase",
                      req.status === 'pending' ? "text-yellow-500" :
                      req.status === 'completed' ? "text-primary" : "text-red-500"
                    )}>
                      {req.status === 'completed' ? 'PAID' : req.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-white/60 text-sm mb-3">{req.profiles?.display_name || "Unknown User"}</Text>

                <View className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <Text className="text-white/40 text-[10px] uppercase font-bold mb-1">Bank Details</Text>
                  <Text className="text-white font-medium">{req.bank_name}</Text>
                  <Text className="text-white font-medium">{req.account_number}</Text>
                  <Text className="text-white/80 text-xs">{req.account_name}</Text>
                </View>
              </View>

              {req.status === 'pending' && (
                <View style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleAction(req.id, 'completed')}
                    disabled={updateStatus.isPending}
                    className="bg-primary px-4 py-3 rounded-xl items-center"
                  >
                    {updateStatus.isPending ? <ActivityIndicator size="small" color="#000" /> : <Text className="text-black font-black text-xs">MARK PAID</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAction(req.id, 'rejected')}
                    disabled={updateStatus.isPending}
                    className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl items-center"
                  >
                    <Text className="text-red-500 font-bold text-xs">DECLINE</Text>
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

  if (isLoading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;

  const filteredOrders = orders?.filter(o => filter === 'all' || o.status === filter) || [];

  return (
    <Animated.View entering={FadeInDown}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
        {['all', 'pending', 'paid', 'shipped', 'completed'].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f as any)}
            className={cn("px-4 py-2 rounded-full mr-2", filter === f ? "bg-primary" : "bg-white/5")}
          >
            <Text className={cn("font-bold text-xs uppercase", filter === f ? "text-black" : "text-white/40")}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredOrders.length === 0 ? (
        <EmptyState icon={Lucide.ShoppingBag} title="No Orders" subtitle="No orders found for this filter." />
      ) : (
        filteredOrders.map((order) => (
          <Card key={order.id} className="mb-6 p-5">
            <View className="flex-row justify-between mb-3">
              <View>
                <Text className="text-white font-bold text-lg">GH₵ {order.total}</Text>
                <Text className="text-white/40 text-xs uppercase font-bold">{order.payment_method}</Text>
              </View>
              <View className={cn("px-3 py-1 rounded-full",
                order.status === 'completed' ? "bg-primary/20" :
                order.status === 'pending' ? "bg-yellow-500/20" : "bg-blue-500/20"
              )}>
                <Text className={cn("text-[10px] font-bold uppercase",
                  order.status === 'completed' ? "text-primary" :
                  order.status === 'pending' ? "text-yellow-500" : "text-blue-500"
                )}>{order.status}</Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-white/60 text-sm">Buyer: {order.profiles?.display_name}</Text>
              <Text className="text-white/40 text-xs">Shop: {order.profiles?.business_name}</Text>
            </View>

            <View className="bg-black/20 p-3 rounded-lg mb-4">
              {order.order_items?.map((item: any) => (
                <Text key={item.id} className="text-white/80 text-xs">
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
                className="px-4 py-2 border border-red-500/30 rounded-xl"
              >
                <Text className="text-red-500 font-bold text-xs">CANCEL</Text>
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
              // Note: Picking winner logic should be server-side or more complex,
              // for now we pick the owner or the user at current cycle index
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

  if (isLoading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;

  return (
    <Animated.View entering={FadeInDown}>
      <Text className="text-white/40 text-[10px] uppercase font-bold mb-4 px-2 tracking-widest">Global Savings Circles</Text>

      {(!groups || groups.length === 0) ? (
        <EmptyState icon={Lucide.Users} title="No Circles" subtitle="No active Susu circles found." />
      ) : (
        groups.map((group) => (
          <Card key={group.id} className="mb-4 p-5">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">{group.name}</Text>
                <Text className="text-white/40 text-[10px] uppercase font-bold">
                  {group.frequency} · {group.members_count} Members
                </Text>
              </View>
              <View className="bg-primary/20 px-3 py-1 rounded-full">
                <Text className="text-primary text-[10px] font-black uppercase">Cycle #{group.cycle_index}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
               <View>
                  <Text style={{ color: '#7d8a84', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>CURRENT POT</Text>
                  <Text style={{ color: '#10b981', fontFamily: 'Display-Bold', fontSize: 20 }}>GH₵ {group.pot?.toLocaleString()}</Text>
               </View>
               <View style={{ alignItems: 'flex-end' }}>
                  {group.pot > 0 ? (
                    <TouchableOpacity
                      onPress={() => handleDisburse(group)}
                      className="bg-primary px-4 py-2 rounded-lg"
                    >
                      <Text className="text-black font-black text-[10px] uppercase">Disburse</Text>
                    </TouchableOpacity>
                  ) : (
                    <View>
                      <Text style={{ color: '#7d8a84', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>CONTRIBUTION</Text>
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>GH₵ {group.contribution}</Text>
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

  if (isLoading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;

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
      <Text className="text-white font-bold mb-4 px-2">{userIds.length} Active Conversations</Text>
      {userIds.map((userId) => (
        <Card key={userId} className="mb-6 p-5">
          <View className="flex-row items-center mb-4">
            <View className="h-10 w-10 rounded-full bg-primary/20 items-center justify-center mr-3">
              <Lucide.User size={20} color="#10b981" />
            </View>
            <View>
              <Text className="text-white font-bold">{groupedMessages[userId].profile?.display_name || "User"}</Text>
              <Text className="text-white/40 text-xs">{groupedMessages[userId].profile?.business_name || "No Business Name"}</Text>
            </View>
          </View>

          <View className="mb-4">
            {groupedMessages[userId].msgs
              .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .slice(-10) // Show last 10 messages for context
              .map((m: any) => (
              <View
                key={m.id}
                className={cn(
                  "p-3 rounded-2xl mb-2 max-w-[85%]",
                  m.is_from_admin ? "bg-primary/20 self-end border border-primary/10" : "bg-white/10 self-start border border-white/5"
                )}
              >
                <Text className={cn("text-sm", m.is_from_admin ? "text-primary font-medium" : "text-white")}>
                  {m.message}
                </Text>
                <Text className="text-[8px] text-white/30 mt-1 self-end">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center gap-2">
            <View style={{ flex: 1, height: 56, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, justifyContent: 'center' }}>
              <TextInput
                placeholder="Type transmission..."
                placeholderTextColor="#405045"
                value={replyText[userId] || ""}
                onChangeText={(t) => setReplyText(prev => ({ ...prev, [userId]: t }))}
                style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}
                multiline
              />
            </View>
            <BouncyTap
              onPress={() => handleReply(userId)}
              disabled={!replyText[userId]?.trim() || replyMutation.isPending}
            >
              <LinearGradient
                colors={replyText[userId]?.trim() ? ['#10b981', '#059669'] : ['#1a211e', '#0d1310']}
                style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOpacity: replyText[userId]?.trim() ? 0.3 : 0, shadowRadius: 10 }}
              >
                {replyMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Lucide.Send size={20} color={replyText[userId]?.trim() ? "#000" : "#405045"} strokeWidth={2.5} />
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
  const { data: users, isLoading } = useAllProfiles();
  const updateStatus = useUpdateUserStatus();

  if (isLoading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;

  return (
    <View>
      {users?.map((u) => (
        <Card key={u.id} className="mb-4 p-5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 rounded-2xl bg-primary/10 items-center justify-center border border-primary/20">
              <Lucide.User size={20} color="#10b981" />
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
                {u.status === 'banned' ? <Lucide.Unlock size={22} color="#10b981" /> : <Lucide.Lock size={22} color="#ef4444" />}
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
    const [localRate, setLocalRate] = useState<string>("");

    useEffect(() => {
        if (settings.data) {
            setLocalRate(String(settings.data.interest_rate));
        }
    }, [settings.data]);

    if (settings.isLoading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;

    const handleUpdateRate = () => {
        const rate = parseFloat(localRate);
        if (!isNaN(rate)) {
            updateSettings.mutate({ interest_rate: rate });
            Vibration.vibrate(Platform.OS === 'ios' ? 0 : 10);
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
          <Text className="text-white font-bold mb-4 text-lg">System Governance</Text>
          <Card className="p-6 border-white/5 bg-[#0f1714]">
            <View className="flex-row justify-between items-center mb-8">
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">Base Interest Rate</Text>
                  <Text className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Global credit growth %</Text>
                </View>
                <View className="flex-row items-center bg-white/5 rounded-xl px-4 h-12 border border-white/5">
                    <TextInput
                        value={localRate}
                        keyboardType="numeric"
                        onChangeText={setLocalRate}
                        onEndEditing={handleUpdateRate}
                        style={{ color: '#10b981', fontWeight: 'bold', fontSize: 16, textAlign: 'right', width: 45 }}
                        selectionColor="#10b981"
                    />
                    <Text className="text-[#10b981] font-bold ml-1">%</Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">Institutional Maintenance</Text>
                  <Text className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">Suspend all vault activities</Text>
                </View>
                <BouncyTap
                  onPress={() => {
                    const newVal = !settings.data?.maintenance_mode;
                    updateSettings.mutate({ maintenance_mode: newVal });
                    Vibration.vibrate(Platform.OS === 'ios' ? 0 : [0, 10, 5, 10]);
                  }}
                >
                  <LinearGradient
                    colors={settings.data?.maintenance_mode ? ['#ef4444', '#991b1b'] : ['#10b981', '#065f46']}
                    style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 }}
                  >
                    <Text className="font-black text-[10px] text-black tracking-widest">
                      {settings.data?.maintenance_mode ? "DISABLE MAINTENANCE" : "ENGAGE MAINTENANCE"}
                    </Text>
                  </LinearGradient>
                </BouncyTap>
            </View>
          </Card>
        </View>

        <Text className="text-white font-bold mb-4 text-lg">Broadcast Protocol</Text>
        <Card className="p-8 border-white/5 bg-[#0f1714]" style={{ borderRadius: 40 }}>
          <View className="mb-8">
            <View className="flex-row items-center gap-2 mb-3 ml-1">
              <Lucide.Tag size={12} color="#10b981" />
              <Text className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-60">Signal Title</Text>
            </View>
            <TextInput
              value={notif.title}
              onChangeText={t => setNotif(prev => ({...prev, title: t}))}
              placeholder="e.g. SYSTEM UPGRADE COMPLETE"
              placeholderTextColor="#334140"
              className="bg-white/5 h-16 rounded-2xl px-6 text-white font-bold border border-white/5"
              selectionColor="#10b981"
            />
          </View>

          <View className="mb-10">
            <View className="flex-row items-center gap-2 mb-3 ml-1">
              <Lucide.MessageSquare size={12} color="#10b981" />
              <Text className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-60">Global Transmission</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <TextInput
                value={notif.body}
                onChangeText={t => setNotif(prev => ({...prev, body: t}))}
                placeholder="Type institutional transmission details..."
                placeholderTextColor="#334140"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{ minHeight: 160, padding: 20, color: 'white', fontSize: 15, fontWeight: '500', lineHeight: 22 }}
                selectionColor="#10b981"
              />
              <LinearGradient
                colors={['transparent', 'rgba(16,185,129,0.02)']}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 }}
                pointerEvents="none"
              />
            </View>
          </View>

          <BouncyTap onPress={handleBroadcast} disabled={broadcast.isPending}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={{ height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}
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
  return (
    <View className="items-center justify-center py-20 opacity-50">
      <Icon size={48} color="#10B981" />
      <Text className="text-white font-bold mt-4">{title}</Text>
      <Text className="text-slate-400">{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080C0A" },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginLeft: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 16 },
  gridItem: { width: "48%" }
});
