import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Lucide from "lucide-react-native";
import {
  useAdminStats, usePendingLoans, useReviewLoan,
  useAllWithdrawalRequests, useUpdateWithdrawalStatus,
  useAllUserMessages, useReplyToUser,
  useAllProfiles, useSystemSettings, useSendBroadcast,
  useUpdateUserStatus,
  useAllOrders,
  useUpdateOrderStatus
} from "@/lib/app-queries";
import { Card, StatCard } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import Animated, { FadeInDown } from "react-native-reanimated";
import { cn } from "@/lib/utils";
import { PremiumHeader } from "@/components/native/premium-header";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"stats" | "loans" | "withdrawals" | "orders" | "chat" | "users" | "settings">("stats");
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
            <Lucide.ArrowLeft size={20} color="#fff" />
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

          {/* Navigation Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-10 -mx-6 px-6">
            <TabItem active={activeTab === "stats"} label="Overview" icon={Lucide.TrendingUp} onPress={() => setActiveTab("stats")} />
            <TabItem active={activeTab === "loans"} label="Credit" icon={Lucide.Banknote} onPress={() => setActiveTab("loans")} />
            <TabItem active={activeTab === "withdrawals"} label="Payouts" icon={Lucide.ArrowDownToLine} onPress={() => setActiveTab("withdrawals")} />
            <TabItem active={activeTab === "orders"} label="Orders" icon={Lucide.ShoppingBag} onPress={() => setActiveTab("orders")} />
            <TabItem active={activeTab === "chat"} label="Support" icon={Lucide.MessageSquare} onPress={() => setActiveTab("chat")} />
            <TabItem active={activeTab === "users"} label="Users" icon={Lucide.User} onPress={() => setActiveTab("users")} />
            <TabItem active={activeTab === "settings"} label="System" icon={Lucide.ShieldCheck} onPress={() => setActiveTab("settings")} />
          </ScrollView>

          {activeTab === "stats" && <SystemHealth stats={stats} loading={statsLoading} />}
          {activeTab === "loans" && <LoanQueue />}
          {activeTab === "withdrawals" && <WithdrawalQueue />}
          {activeTab === "orders" && <OrderManagement />}
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
            {groupedMessages[userId].msgs.slice(-4).map((m: any) => (
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
            <View className="flex-1">
              <Input
                placeholder="Type a response..."
                value={replyText[userId] || ""}
                onChangeText={(t) => setReplyText(prev => ({ ...prev, [userId]: t }))}
                containerClassName="mb-0"
              />
            </View>
            <TouchableOpacity
              onPress={() => handleReply(userId)}
              disabled={!replyText[userId]?.trim() || replyMutation.isPending}
              className={cn(
                "h-12 w-12 rounded-xl items-center justify-center",
                replyText[userId]?.trim() ? "bg-primary" : "bg-white/10"
              )}
            >
              {replyMutation.isPending ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Lucide.Send size={20} color={replyText[userId]?.trim() ? "#000" : "#555"} />
              )}
            </TouchableOpacity>
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

    if (settings.isLoading) return <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />;

    const handleBroadcast = async () => {
      if (!notif.title.trim() || !notif.body.trim()) {
        return Alert.alert("Required", "Please fill in both the title and the message.");
      }

      if (Platform.OS === 'web') {
        if (confirm("This message will be sent to ALL registered users. Continue?")) {
          try {
            await broadcast.mutateAsync({ title: notif.title, body: notif.body });
            setNotif({ title: "", body: "" });
            alert("Success: Broadcast sent successfully to all users.");
          } catch (e: any) { alert(e.message); }
        }
      } else {
        Alert.alert(
          "Confirm Broadcast",
          "This message will be sent to ALL registered users. Continue?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Send",
              onPress: async () => {
                try {
                  await broadcast.mutateAsync({ title: notif.title, body: notif.body });
                  setNotif({ title: "", body: "" });
                  Alert.alert("Success", "Broadcast sent successfully to all users.");
                } catch (error: any) {
                  Alert.alert("Error", error.message || "Failed to send broadcast");
                }
              }
            }
          ]
        );
      }
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
          <Input
            label="Title"
            value={notif.title}
            onChangeText={t => setNotif(prev => ({...prev, title: t}))}
            className="mb-4"
          />
          <Input
            label="Message"
            value={notif.body}
            onChangeText={t => setNotif(prev => ({...prev, body: t}))}
            multiline
          />
          <Button
            title="Send Alert"
            className="mt-6"
            onPress={handleBroadcast}
            loading={broadcast.isPending}
            disabled={broadcast.isPending}
          />
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
