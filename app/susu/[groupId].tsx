import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useGroup, useGroupMembers, useGroupContributions, useRecordContribution } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import { ArrowLeft, Users, Wallet, Check, Clock, ShieldCheck } from "lucide-react-native";

export default function GroupDetails() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  const group = useGroup(groupId as string);
  const members = useGroupMembers(groupId as string);
  const contributions = useGroupContributions(groupId as string);
  const record = useRecordContribution();

  const [amount, setAmount] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([group.refetch(), members.refetch(), contributions.refetch()]);
    setRefreshing(false);
  };

  if (!group.data) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Loading group details...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{
        headerShown: true,
        title: group.data.name,
        headerStyle: { backgroundColor: "#0A0A0A" },
        headerTintColor: "#FFFFFF",
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        className="flex-1 px-6 pt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        {/* Pot Info */}
        <Card className="bg-primary mb-6 border-none">
          <Text className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Group Pot</Text>
          <Text className="text-white text-4xl font-black">GH₵ {group.data.pot}</Text>
          <View className="flex-row justify-between items-center mt-4">
            <Text className="text-white/80 text-xs font-bold">{group.data.frequency} Rotation</Text>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white text-[10px] font-black">CYCLE {group.data.cycle_index}</Text>
            </View>
          </View>
        </Card>

        {/* Contribute Section */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-foreground mb-4">Pay Contribution</Text>
          <Card>
            <Input
              label="Amount (GH₵)"
              value={amount}
              onChangeText={setAmount}
              placeholder={String(group.data.contribution)}
              keyboardType="numeric"
              className="mb-4"
            />
            <Button
              title="Pay via Mobile Money"
              className="bg-emerald-600"
              onPress={() => alert("Payment UI (Paystack Native) would open here.")}
            />
            <View className="flex-row items-center gap-2 mt-4 opacity-60">
              <ShieldCheck size={14} color="#10B981" />
              <Text className="text-[10px] text-primary font-bold">Secured by ClipCapital</Text>
            </View>
          </Card>
        </View>

        {/* Members List */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <Users size={20} color="#10B981" />
            <Text className="text-lg font-bold text-foreground">Susu Members</Text>
          </View>
          <Card className="p-0 overflow-hidden">
            {members.data?.map((m: any, idx: number) => (
              <View key={m.id} className="p-4 border-b border-border/20 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-muted/20 items-center justify-center">
                    <Text className="text-primary font-bold">{idx + 1}</Text>
                  </View>
                  <View>
                    <Text className="text-foreground font-bold">{m.profiles?.display_name || "Member"}</Text>
                    {m.has_received && (
                      <Text className="text-emerald-500 text-[9px] font-black">RECEIVED PAYOUT</Text>
                    )}
                  </View>
                </View>
                {m.has_received ? <Check size={16} color="#10B981" /> : <Clock size={16} color="#737373" />}
              </View>
            ))}
          </Card>
        </View>

        {/* Recent Contributions */}
        <View className="pb-20">
          <View className="flex-row items-center gap-2 mb-4">
            <Clock size={20} color="#F59E0B" />
            <Text className="text-lg font-bold text-foreground">Activity History</Text>
          </View>
          {contributions.data?.length === 0 ? (
            <Text className="text-muted-foreground italic text-center">No contributions yet</Text>
          ) : (
            contributions.data?.map((c) => (
              <View key={c.id} className="flex-row justify-between items-center py-3 border-b border-border/20">
                <View>
                  <Text className="text-foreground text-xs font-bold">{c.momo_reference}</Text>
                  <Text className="text-muted-foreground text-[10px]">{new Date(c.created_at).toLocaleDateString()}</Text>
                </View>
                <Text className="text-primary font-black">GH₵ {c.amount}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
