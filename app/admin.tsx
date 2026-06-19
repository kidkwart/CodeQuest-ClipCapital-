import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert, Platform, TextInput, KeyboardAvoidingView, Vibration, SafeAreaView } from "react-native";
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 0, backgroundColor: colors.background }} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Back Button for Admin */}
      <View style={styles.topNav}>
        <BouncyTap
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/settings")}
          style={[styles.backButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
        >
          <Lucide.ArrowLeft size={20} color={colors.text} />
        </BouncyTap>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <View style={{ paddingHorizontal: 24 }}>
            <PremiumHeader title="Command Center" subtitle="Admin Authority" />

            {/* Navigation Bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={{ paddingRight: 40 }}>
              <TabItem active={activeTab === "stats"} label="Overview" icon={Lucide.TrendingUp} onPress={() => setActiveTab("stats")} />
              <TabItem active={activeTab === "loans"} label="Credit" icon={Lucide.Banknote} onPress={() => setActiveTab("loans")} />
              <TabItem active={activeTab === "withdrawals"} label="Payouts" icon={Lucide.ArrowDownToLine} onPress={() => setActiveTab("withdrawals")} />
              <TabItem active={activeTab === "orders"} label="Orders" icon={Lucide.ShoppingBag} onPress={() => setActiveTab("orders")} />
              <TabItem active={activeTab === "circles"} label="Circles" icon={Lucide.Users} onPress={() => setActiveTab("circles")} />
              <TabItem active={activeTab === "chat"} label="Support" icon={Lucide.MessageSquare} onPress={() => setActiveTab("chat")} />
              <TabItem active={activeTab === "users"} label="Users" icon={Lucide.User} onPress={() => setActiveTab("users")} />
              <TabItem active={activeTab === "settings"} label="System" icon={Lucide.ShieldCheck} onPress={() => setActiveTab("settings")} />
            </ScrollView>

            <View>
                {activeTab === "stats" && <SystemHealth stats={stats} loading={statsLoading} />}
                {activeTab === "loans" && <LoanQueue />}
                {activeTab === "withdrawals" && <WithdrawalQueue />}
                {activeTab === "orders" && <OrderManagement />}
                {activeTab === "circles" && <SusuManagement />}
                {activeTab === "chat" && <AdminChatSection />}
                {activeTab === "users" && <UserDirectory />}
                {activeTab === "settings" && <SettingsSection />}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function TabItem({ active, label, icon: Icon, onPress }: any) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', marginRight: 32 }}>
      <View style={{
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        backgroundColor: active ? colors.primary : colors.surfaceElevated,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border
      }}>
        <Icon size={20} color={active ? "#000" : colors.primary} />
      </View>
      <Text style={{
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: active ? colors.text : colors.textDim
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

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

function LoanQueue() {
  const { colors } = useTheme();
  const { data: allLoans, isLoading, refetch } = usePendingLoans();
  const [view, setView] = React.useState<'pending' | 'history'>('pending');
  const review = useReviewLoan();

  const handleAction = async (id: string | string[], status: 'approved' | 'rejected') => {
    try {
      await review.mutateAsync({ id, status });
      Vibration.vibrate(Platform.OS === 'ios' ? 0 : 10);
      refetch();
      Alert.alert("Success", `Loan ${status}.`);
    } catch (e: any) {
        Alert.alert("Error", e.message);
    }
  };

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  const displayLoans = allLoans?.filter(l => view === 'pending' ? l.status === 'pending' : l.status !== 'pending') || [];

  return (
    <Animated.View entering={FadeInDown}>
      <View style={{ backgroundColor: colors.surfaceElevated, flexDirection: 'row', padding: 4, borderRadius: 12, marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => setView('pending')}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: view === 'pending' ? colors.cardBg : 'transparent' }}
        >
          <Text style={{ fontWeight: 'bold', color: view === 'pending' ? colors.text : colors.textDim }}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView('history')}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: view === 'history' ? colors.cardBg : 'transparent' }}
        >
          <Text style={{ fontWeight: 'bold', color: view === 'history' ? colors.text : colors.textDim }}>History</Text>
        </TouchableOpacity>
      </View>

      {displayLoans.length === 0 ? (
        <EmptyState icon={Lucide.Inbox} title="No Records" subtitle={`No ${view} loans found.`} />
      ) : (
        displayLoans.map((loan) => (
          <Card key={loan.id} style={{ marginBottom: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>GH₵ {loan.amount}</Text>
                  {loan.status !== 'pending' && (
                    <View style={{ marginLeft: 8, paddingHorizontal: 8, py: 2, borderRadius: 6, backgroundColor: (loan.status === 'approved' || loan.status === 'completed' || loan.status === 'repaying') ? colors.primary + '20' : colors.destructive + '20' }}>
                      <Text style={{ color: (loan.status === 'approved' || loan.status === 'completed' || loan.status === 'repaying') ? colors.primary : colors.destructive, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {loan.status}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>{loan.profiles?.display_name}</Text>
                <Text style={{ color: colors.textDim, fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>"{loan.purpose}"</Text>
              </View>

              {loan.status === 'pending' && (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleAction(loan.id, 'approved')}
                    disabled={review.isPending}
                    style={{ backgroundColor: colors.primary + '20', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Lucide.CheckCircle2 size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAction(loan.id, 'rejected')}
                    disabled={review.isPending}
                    style={{ backgroundColor: colors.destructive + '10', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
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

function WithdrawalQueue() {
  const { colors } = useTheme();
  const { data: requests, isLoading, refetch } = useAllWithdrawalRequests();
  const [view, setView] = React.useState<'pending' | 'history'>('pending');
  const updateStatus = useUpdateWithdrawalStatus();

  const handleAction = async (id: string, status: 'completed' | 'rejected') => {
    try {
      await updateStatus.mutateAsync({ id, status });
      Vibration.vibrate(Platform.OS === 'ios' ? 0 : 10);
      refetch();
      Alert.alert("Success", `Withdrawal ${status === 'completed' ? 'marked as paid' : 'declined'}.`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update status");
    }
  };

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  const displayRequests = requests?.filter(r => view === 'pending' ? r.status === 'pending' : r.status !== 'pending') || [];

  return (
    <Animated.View entering={FadeInDown}>
      <View style={{ backgroundColor: colors.surfaceElevated, flexDirection: 'row', padding: 4, borderRadius: 12, marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => setView('pending')}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: view === 'pending' ? colors.cardBg : 'transparent' }}
        >
          <Text style={{ fontWeight: 'bold', color: view === 'pending' ? colors.text : colors.textDim }}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setView('history')}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: view === 'history' ? colors.cardBg : 'transparent' }}
        >
          <Text style={{ fontWeight: 'bold', color: view === 'history' ? colors.text : colors.textDim }}>History</Text>
        </TouchableOpacity>
      </View>

      {displayRequests.length === 0 ? (
        <EmptyState icon={Lucide.Clock} title="Empty" subtitle={`No ${view} payouts found.`} />
      ) : (
        displayRequests.map((req) => (
          <Card key={req.id} style={{ marginBottom: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>GH₵ {req.amount}</Text>
                  <View style={{ marginLeft: 8, paddingHorizontal: 8, py: 2, borderRadius: 6, backgroundColor: req.status === 'pending' ? colors.gold + '15' : req.status === 'completed' ? colors.primary + '15' : colors.destructive + '15' }}>
                    <Text style={{ color: req.status === 'pending' ? colors.gold : req.status === 'completed' ? colors.primary : colors.destructive, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {req.status}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.textMuted, marginTop: 4 }}>{req.profiles?.display_name}</Text>

                <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceElevated }}>
                  <Text style={{ color: colors.textDim, fontSize: 10, fontWeight: 'bold' }}>BANK DETAILS</Text>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{req.bank_name}</Text>
                  <Text style={{ color: colors.text, fontSize: 14 }}>{req.account_number}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{req.account_name}</Text>
                </View>
              </View>

              {req.status === 'pending' && (
                <View style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleAction(req.id, 'completed')}
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                  >
                    <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>MARK PAID</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAction(req.id, 'rejected')}
                    style={{ borderColor: colors.destructive, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                  >
                    <Text style={{ color: colors.destructive, fontSize: 10, fontWeight: 'bold' }}>DECLINE</Text>
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

function OrderManagement() {
  const { colors } = useTheme();
  const { data: orders, isLoading, refetch } = useAllOrders();
  const updateStatus = useUpdateOrderStatus();
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'shipped' | 'completed'>('all');

  const handleUpdate = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      Vibration.vibrate(Platform.OS === 'ios' ? 0 : 10);
      refetch();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed': return colors.primary;
      case 'pending': return colors.gold;
      case 'shipped': return '#3b82f6';
      case 'cancelled': return colors.destructive;
      default: return colors.textDim;
    }
  };

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  const filteredOrders = orders?.filter(o => filter === 'all' || o.status === filter) || [];

  return (
    <Animated.View entering={FadeInDown}>
      <Text style={{ color: colors.textDim, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 16, marginLeft: 8 }}>
        ORDER LOGISTICS & FULFILLMENT
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24, marginHorizontal: -24, paddingHorizontal: 24 }}>
        {['all', 'pending', 'paid', 'shipped', 'completed'].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => {
                setFilter(f as any);
                Vibration.vibrate(Platform.OS === 'ios' ? 0 : 5);
            }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              marginRight: 8,
              backgroundColor: filter === f ? colors.primary : colors.cardBg,
              borderWidth: 1,
              borderColor: filter === f ? colors.primary : colors.border
            }}
          >
            <Text style={{ fontWeight: '900', fontSize: 10, textTransform: 'uppercase', color: filter === f ? '#000' : colors.textMuted }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredOrders.length === 0 ? (
        <EmptyState icon={Lucide.ShoppingBag} title="No Orders" subtitle={`No ${filter !== 'all' ? filter : ''} orders in queue.`} />
      ) : (
        filteredOrders.map((order) => (
          <Card key={order.id} style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
            <View style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Lucide.Package size={14} color={colors.primary} />
                        <Text style={{ color: colors.textDim, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>ORDER #{order.id.slice(0, 8).toUpperCase()}</Text>
                    </View>
                    <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Display-Bold', marginTop: 4 }}>GH₵ {order.total.toLocaleString()}</Text>
                  </View>

                  <View style={{ backgroundColor: `${getStatusColor(order.status)}15`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: `${getStatusColor(order.status)}30` }}>
                    <Text style={{ color: getStatusColor(order.status), fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{order.status}</Text>
                  </View>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Lucide.User size={14} color={colors.textDim} />
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold' }}>{order.profiles?.display_name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Lucide.Store size={14} color={colors.textDim} />
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{order.profiles?.business_name || 'Individual Merchant'}</Text>
                  </View>
                </View>

                <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.textDim, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 12 }}>ITEM MANIFEST</Text>
                  {order.order_items?.map((item: any, idx: number) => (
                    <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: idx === order.order_items.length - 1 ? 0 : 8 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 13, flex: 1 }} numberOfLines={1}>• {item.products?.name}</Text>
                      <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13, marginLeft: 12 }}>x{item.qty}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {order.status === 'pending' && (
                    <TouchableOpacity
                        onPress={() => handleUpdate(order.id, 'paid')}
                        style={{ flex: 1, backgroundColor: colors.primary, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 11, letterSpacing: 1 }}>CONFIRM PAYMENT</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'paid' && (
                    <TouchableOpacity
                        onPress={() => handleUpdate(order.id, 'shipped')}
                        style={{ flex: 1, backgroundColor: '#3b82f6', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 }}>DISPATCH ORDER</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'shipped' && (
                    <TouchableOpacity
                        onPress={() => handleUpdate(order.id, 'completed')}
                        style={{ flex: 1, backgroundColor: colors.primary, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 11, letterSpacing: 1 }}>MARK DELIVERED</Text>
                    </TouchableOpacity>
                  )}

                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <TouchableOpacity
                        onPress={() => handleUpdate(order.id, 'cancelled')}
                        style={{ width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.destructive + '40', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Lucide.Trash2 size={20} color={colors.destructive} />
                    </TouchableOpacity>
                  )}
                </View>
            </View>

            <View style={{ backgroundColor: colors.surfaceElevated, paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Lucide.CreditCard size={12} color={colors.textDim} />
                    <Text style={{ color: colors.textDim, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>{order.payment_method}</Text>
                </View>
                <Text style={{ color: colors.textDim, fontSize: 10, fontWeight: 'bold' }}>{new Date(order.created_at).toLocaleDateString('en-GB')}</Text>
            </View>
          </Card>
        ))
      )}
    </Animated.View>
  );
}

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
              Vibration.vibrate(Platform.OS === 'ios' ? 0 : 20);
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
      {(!groups || groups.length === 0) ? (
        <EmptyState icon={Lucide.Users} title="No Circles" subtitle="No active Susu circles found." />
      ) : (
        groups.map((group) => (
          <Card key={group.id} style={{ marginBottom: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>{group.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, textTransform: 'uppercase', marginTop: 2 }}>
                  {group.frequency} · {group.members_count} Members
                </Text>
              </View>
              <View style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold' }}>CYCLE #{group.cycle_index}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
               <View>
                  <Text style={{ color: colors.textDim, fontSize: 9, fontWeight: 'bold' }}>CURRENT POT</Text>
                  <Text style={{ color: colors.primary, fontSize: 20, fontWeight: 'bold' }}>GH₵ {group.pot?.toLocaleString()}</Text>
               </View>
               {group.pot > 0 && (
                  <TouchableOpacity
                    onPress={() => handleDisburse(group)}
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                  >
                    <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>DISBURSE</Text>
                  </TouchableOpacity>
               )}
            </View>
          </Card>
        ))
      )}
    </Animated.View>
  );
}

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
      Vibration.vibrate(Platform.OS === 'ios' ? 0 : 5);
      setReplyText(prev => ({ ...prev, [userId]: "" }));
      refetch();
    } catch (e: any) { }
  };

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  const groupedMessages = messages?.reduce((acc: any, msg: any) => {
    if (!acc[msg.user_id]) acc[msg.user_id] = { profile: msg.profiles, msgs: [] };
    acc[msg.user_id].msgs.push(msg);
    return acc;
  }, {});

  const userIds = Object.keys(groupedMessages || {});

  if (userIds.length === 0) return <EmptyState icon={Lucide.MessageSquare} title="Inbox Empty" subtitle="No active support tickets." />;

  return (
    <Animated.View entering={FadeInDown}>
      {userIds.map((userId) => (
        <Card key={userId} style={{ marginBottom: 16, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Lucide.User size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ color: colors.text, fontWeight: 'bold' }}>{groupedMessages[userId].profile?.display_name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{groupedMessages[userId].profile?.business_name}</Text>
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            {groupedMessages[userId].msgs.slice(-5).map((m: any) => (
              <View key={m.id} style={{ alignSelf: m.is_from_admin ? 'flex-end' : 'flex-start', backgroundColor: m.is_from_admin ? colors.primary + '20' : colors.surfaceElevated, padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '85%' }}>
                <Text style={{ color: m.is_from_admin ? colors.primary : colors.text, fontSize: 13 }}>{m.message}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              value={replyText[userId] || ""}
              onChangeText={(t) => setReplyText(prev => ({ ...prev, [userId]: t }))}
              placeholder="Reply..."
              placeholderTextColor={colors.textDim}
              style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 12, paddingHorizontal: 16, color: colors.text }}
            />
            <TouchableOpacity
              onPress={() => handleReply(userId)}
              style={{ backgroundColor: colors.primary, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
            >
              <Lucide.Send size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </Card>
      ))}
    </Animated.View>
  );
}

function UserDirectory() {
  const { colors } = useTheme();
  const { data: users, isLoading } = useAllProfiles();
  const updateStatus = useUpdateUserStatus();

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View>
      {users?.map((u) => (
        <Card key={u.id} style={{ marginBottom: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary + '10', alignItems: 'center', justifyContent: 'center' }}>
              <Lucide.User size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ color: colors.text, fontWeight: 'bold' }}>{u.display_name}</Text>
              <Text style={{ color: u.status === 'banned' ? colors.destructive : colors.primary, fontSize: 10, fontWeight: 'bold' }}>{u.status?.toUpperCase() || 'ACTIVE'}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
             <Text style={{ color: colors.gold, fontWeight: 'bold' }}>{u.clip_score} pts</Text>
             <TouchableOpacity style={{ marginTop: 4 }} onPress={() => updateStatus.mutate({ id: u.id, status: u.status === 'banned' ? 'active' : 'banned' })}>
                {u.status === 'banned' ? <Lucide.Unlock size={20} color={colors.primary} /> : <Lucide.Lock size={20} color={colors.destructive} />}
             </TouchableOpacity>
          </View>
        </Card>
      ))}
    </View>
  );
}

function SettingsSection() {
    const { colors } = useTheme();
    const { settings, updateSettings } = useSystemSettings();
    const broadcast = useSendBroadcast();
    const [notif, setNotif] = useState({ title: "", body: "" });
    const [localRate, setLocalRate] = useState<string>("");

    useEffect(() => {
        if (settings.data) setLocalRate(String(settings.data.interest_rate));
    }, [settings.data]);

    if (settings.isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

    return (
      <Animated.View entering={FadeInDown}>
        <Card style={{ marginBottom: 24, padding: 20 }}>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>Interest Control</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                    value={localRate}
                    onChangeText={setLocalRate}
                    keyboardType="numeric"
                    style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 12, paddingHorizontal: 16, color: colors.text, fontSize: 20, fontWeight: 'bold' }}
                />
                <TouchableOpacity
                    onPress={() => {
                        updateSettings.mutate({ interest_rate: parseFloat(localRate) });
                        Vibration.vibrate(Platform.OS === 'ios' ? 0 : 10);
                    }}
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center' }}
                >
                    <Text style={{ color: '#000', fontWeight: 'bold' }}>UPDATE</Text>
                </TouchableOpacity>
            </View>
        </Card>

        <Card style={{ padding: 20 }}>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>System Lock</Text>
            <TouchableOpacity
              onPress={() => {
                Vibration.vibrate(100);
                updateSettings.mutate({ maintenance_mode: !settings.data?.maintenance_mode });
              }}
              style={{
                backgroundColor: settings.data?.maintenance_mode ? colors.primary : colors.destructive,
                height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>
                {settings.data?.maintenance_mode ? "UNLOCK SYSTEM" : "LOCK SYSTEM"}
              </Text>
            </TouchableOpacity>
        </Card>

        <Card style={{ marginTop: 24, padding: 20 }}>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>Global Broadcast</Text>
            <TextInput
              value={notif.title}
              onChangeText={t => setNotif(prev => ({...prev, title: t}))}
              placeholder="Title"
              placeholderTextColor={colors.textDim}
              style={{ backgroundColor: colors.surfaceElevated, borderRadius: 12, padding: 12, color: colors.text, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}
            />
            <TextInput
              value={notif.body}
              onChangeText={t => setNotif(prev => ({...prev, body: t}))}
              placeholder="Message"
              placeholderTextColor={colors.textDim}
              multiline
              style={{ backgroundColor: colors.surfaceElevated, borderRadius: 12, padding: 12, color: colors.text, height: 100, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1, borderColor: colors.border }}
            />
            <TouchableOpacity
              onPress={() => broadcast.mutate(notif)}
              style={{ backgroundColor: colors.primary, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
            >
               {broadcast.isPending ? <ActivityIndicator color="#000" /> : <Text style={{ color: '#000', fontWeight: '900' }}>SEND SIGNAL</Text>}
            </TouchableOpacity>
        </Card>
      </Animated.View>
    );
}

function EmptyState({ icon: Icon, title, subtitle }: any) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 60, opacity: 0.5 }}>
      <Icon size={48} color={colors.textDim} />
      <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 18, marginTop: 16 }}>{title}</Text>
      <Text style={{ color: colors.textMuted }}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 150 },
  topNav: { paddingTop: 20 },
  backButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginLeft: 24, marginBottom: 12, borderWidth: 1 },
  tabScroll: { marginBottom: 32, paddingLeft: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 16 },
  gridItem: { width: "48%" },
  maintenanceBtn: { height: 52, borderRadius: 16, paddingHorizontal: 20, justifyContent: 'center' },
  maintenanceBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  maintenanceBtnText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1.5 }
});
