import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useProfile, useMyWithdrawals, useRequestWithdrawal } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import { ArrowLeft, Wallet, AlertCircle, History, Clock, CheckCircle2, XCircle } from "lucide-react-native";
import { cn } from "@/lib/utils";

export default function WithdrawScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: withdrawals } = useMyWithdrawals();
  const request = useRequestWithdrawal();
  const [amount, setAmount] = useState("");

  const handleRequest = async () => {
    if (!profile?.account_number) {
      alert("Please set up your Payout Details in Settings first.");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt < 5) {
      alert("Minimum withdrawal is GH₵ 5");
      return;
    }
    try {
      await request.mutateAsync({
        amount: amt,
        bank_name: profile.bank_name || "MTN",
        account_number: profile.account_number,
        account_name: profile.account_name || profile.display_name
      });
      setAmount("");
      alert("Withdrawal request sent! Admin will process it shortly.");
    } catch (e) {
      alert("Failed to submit request.");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{
        headerShown: true, title: "Withdraw Funds",
        headerStyle: { backgroundColor: "#0A0A0A" }, headerTintColor: "#FFF",
        headerLeft: () => <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="#FFF" /></TouchableOpacity>
      }} />

      <ScrollView className="flex-1 px-6 pt-6">
        <Card className="bg-primary mb-8 border-none overflow-hidden">
          <View className="relative z-10">
            <Text className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Active Payout Account</Text>
            {profile?.account_number ? (
              <View>
                <Text className="text-white text-2xl font-black">{profile.bank_name}: {profile.account_number}</Text>
                <Text className="text-white/80 text-xs font-bold mt-1">{profile.account_name}</Text>
              </View>
            ) : (
              <Text className="text-white font-bold">Payout account not set</Text>
            )}
          </View>
          <Wallet size={120} color="white" style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1, transform: [{ rotate: '15deg' }] }} />
        </Card>

        <Text className="text-lg font-bold text-white mb-4">New Request</Text>
        <Card className="mb-10">
          <Input
            label="Amount (GH₵)" value={amount} onChangeText={setAmount}
            keyboardType="numeric" placeholder="50.00" containerClassName="mb-6"
          />
          <Button title="Confirm Withdrawal" onPress={handleRequest} loading={request.isPending} />
        </Card>

        <View className="mb-20">
          <View className="flex-row items-center gap-2 mb-4">
            <History size={20} color="#10B981" />
            <Text className="text-lg font-bold text-white">Request History</Text>
          </View>
          {(withdrawals ?? []).length === 0 ? (
            <Text className="text-muted-foreground italic">No past requests</Text>
          ) : (
            withdrawals?.map((w) => (
              <View key={w.id} className="flex-row items-center justify-between py-4 border-b border-white/5">
                <View>
                  <Text className="text-white font-bold">GH₵ {w.amount}</Text>
                  <Text className="text-muted-foreground text-[10px] uppercase font-bold">{new Date(w.created_at).toLocaleDateString()} · {w.status}</Text>
                </View>
                {w.status === 'completed' ? <CheckCircle2 size={18} color="#10B981" /> : <Clock size={18} color="#F59E0B" />}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
