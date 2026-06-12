import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Alert, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useProfile, useMyWithdrawals, useRequestWithdrawal } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, Wallet, History, Clock, CheckCircle2 } from "lucide-react-native";

export default function WithdrawScreen() {
  const router = useRouter();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: withdrawals, isLoading: loadingHistory, refetch } = useMyWithdrawals();
  const request = useRequestWithdrawal();
  const [amount, setAmount] = useState("");

  const handleRequest = async () => {
    if (!profile?.account_number) {
      if (Platform.OS === 'web') {
        if (confirm("Payout details not found. Go to Settings to configure them?")) {
          router.push("/settings");
        }
      } else {
        Alert.alert(
          "Setup Required",
          "Please set up your Payout Details in Settings before making a withdrawal.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Go to Settings", onPress: () => router.push("/settings") }
          ]
        );
      }
      return;
    }
    const amt = Number(amount);
    if (!amt || amt < 5) {
      alert("Minimum withdrawal is GH₵ 5");
      return;
    }
    if (amt > (profile?.wallet_balance || 0)) {
      alert("Insufficient balance. You cannot withdraw more than what is in your wallet.");
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
      if (Platform.OS === 'web') {
        alert("Withdrawal request sent! Admin will process it shortly.");
      } else {
        Alert.alert("Success", "Withdrawal request sent! Admin will process it shortly.");
      }
    } catch (e: any) {
      console.error("Withdrawal Error:", e);
      alert("Failed to submit request: " + (e.message || "Unknown error"));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginLeft: 16, height: 40, width: 40, borderRadius: 12, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loadingHistory || loadingProfile} tintColor="#10B981" onRefresh={refetch} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="Withdraw" subtitle="Liquidate Capital" />

          <Card style={{ backgroundColor: '#10b981', marginBottom: 40, padding: 0, overflow: 'hidden', height: 160 }}>
             <View style={{ padding: 28, flex: 1, justifyContent: 'space-between', zIndex: 10 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 4 }}>Active Payout Destination</Text>
                {profile?.account_number ? (
                  <View>
                    <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 32, letterSpacing: -1 }}>{profile.bank_name}</Text>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 }}>{profile.account_number}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, mt: 8 }}>{profile.account_name}</Text>
                  </View>
                ) : (
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Payout account not configured</Text>
                )}
             </View>
             <Wallet size={160} color="white" style={{ position: 'absolute', right: -40, bottom: -40, opacity: 0.1, transform: [{ rotate: '15deg' }] }} />
          </Card>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 40 }}>
            <TouchableOpacity
              onPress={() => router.push("/topup")}
              style={{ flex: 1, height: 56, backgroundColor: '#10b981', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
            >
               <Text style={{ fontFamily: 'Display-Bold', color: '#080c0a', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5 }}>Add Funds</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, backgroundColor: '#0f1714', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
               <Text style={{ color: '#7d8a84', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>Available</Text>
               <Text style={{ color: 'white', fontWeight: 'bold' }}>GH₵ {profile?.wallet_balance || '0.00'}</Text>
            </View>
          </View>

          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Request Payout</Text>
          <Card glass style={{ marginBottom: 48, borderColor: 'rgba(16,185,129,0.2)' }}>
             <Input
               label="Amount (GH₵)" value={amount} onChangeText={setAmount}
               keyboardType="numeric" placeholder="0.00" containerClassName="mb-6"
             />
             <Button title="Confirm Withdrawal" onPress={handleRequest} loading={request.isPending} />
          </Card>

          <View style={{ marginBottom: 80 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, marginLeft: 4 }}>
              <History size={18} color="#10B981" />
              <Text style={{ color: 'rgba(252,252,252,0.4)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 4 }}>Request History</Text>
            </View>
            {(withdrawals ?? []).length === 0 ? (
              <Card style={{ alignItems: 'center', py: 40, opacity: 0.3, borderStyle: 'dashed' }}>
                 <Clock size={32} color="#405045" />
                 <Text style={{ color: 'white', fontWeight: 'bold', mt: 16, fontStyle: 'italic' }}>No history yet</Text>
              </Card>
            ) : (
              withdrawals?.map((w) => (
                <Card key={w.id} style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWeight: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(20,29,26,0.3)' }}>
                  <View>
                    <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 18 }}>GH₵ {w.amount}</Text>
                    <Text style={{ color: '#7d8a84', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, mt: 4 }}>
                      {new Date(w.created_at).toLocaleDateString()} · {w.status}
                    </Text>
                  </View>
                  {w.status === 'completed' ? (
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={18} color="#10B981" />
                    </View>
                  ) : (
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={18} color="#f59e0b" />
                    </View>
                  )}
                </Card>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
