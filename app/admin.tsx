import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  useAdminStats, usePendingLoans, useReviewLoan,
  useAllWithdrawalRequests, useUpdateWithdrawalStatus,
  usePendingSusuPayouts
} from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { ArrowLeft, TrendingUp, Banknote, Users, ArrowDownToLine, Check, X } from "lucide-react-native";

export default function AdminScreen() {
  const router = useRouter();
  const stats = useAdminStats();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await stats.refetch();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{
        headerShown: true, title: "System Admin",
        headerStyle: { backgroundColor: "#0A0A0A" }, headerTintColor: "#FFF",
        headerLeft: () => <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="#FFF" /></TouchableOpacity>
      }} />

      <ScrollView
        className="flex-1 px-6 pt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        {/* System Health Stats */}
        <View className="flex-row items-center gap-2 mb-4">
          <TrendingUp size={20} color="#10B981" />
          <Text className="text-lg font-bold text-white uppercase tracking-tighter">System Health</Text>
        </View>

        <View className="flex-row flex-wrap -mx-2 mb-8">
          <View className="w-1/2 px-2 mb-4">
            <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
              <Text className="text-emerald-500 text-[8px] font-black uppercase">Daily Income</Text>
              <Text className="text-white text-lg font-black mt-1">GH₵ {stats.data?.dailyIncome || 0}</Text>
            </Card>
          </View>
          <View className="w-1/2 px-2 mb-4">
            <Card className="p-4 bg-gold/10 border-gold/20">
              <Text className="text-gold text-[8px] font-black uppercase">Active Risk</Text>
              <Text className="text-white text-lg font-black mt-1">GH₵ {stats.data?.activeRisk || 0}</Text>
            </Card>
          </View>
          <View className="w-1/2 px-2 mb-4">
            <Card className="p-4 bg-blue-500/10 border-blue-500/20">
              <Text className="text-blue-500 text-[8px] font-black uppercase">Approval Rate</Text>
              <Text className="text-white text-lg font-black mt-1">{stats.data?.approvalRate || 0}%</Text>
            </Card>
          </View>
          <View className="w-1/2 px-2 mb-4">
            <Card className="p-4 bg-primary/10 border-primary/20">
              <Text className="text-primary text-[8px] font-black uppercase">Total Users</Text>
              <Text className="text-white text-lg font-black mt-1">{stats.data?.totalUsers || 0}</Text>
            </Card>
          </View>
        </View>

        {/* Queues (Shortcuts) */}
        <Text className="text-white font-bold text-lg mb-4">Management Queues</Text>
        <QueueSection title="Loan Applications" icon={Banknote} color="#10B981" />
        <QueueSection title="Withdrawal Requests" icon={ArrowDownToLine} color="#3B82F6" />
        <QueueSection title="Susu Payouts" icon={Users} color="#F59E0B" />

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}

function QueueSection({ title, icon: Icon, color }: any) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="bg-surface border border-white/5 p-5 rounded-[28px] mb-3 flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-4">
        <View style={{ backgroundColor: `${color}20` }} className="p-3 rounded-2xl">
          <Icon size={20} color={color} />
        </View>
        <Text className="text-white font-bold">{title}</Text>
      </View>
      <View className="bg-white/5 px-3 py-1 rounded-full">
        <Text className="text-white text-[10px] font-black">VIEW</Text>
      </View>
    </TouchableOpacity>
  );
}
