import React, { useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useApplyForLoan, useClipScore, useMyLoans } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import { PremiumHeader } from "@/components/native/premium-header";
import { LoanCalculator } from "@/components/native/loan-calculator";
import { History, TrendingUp } from "lucide-react-native";

export default function Loans() {
  const { score } = useClipScore();
  const list = useMyLoans();
  const apply = useApplyForLoan();
  const maxLoan = Math.max(200, Math.min(5000, Math.round((score - 100) * 8)));

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");

  async function handleApply() {
    if (!amount) return;
    try {
      await apply.mutateAsync({ amount: Number(amount), term_months: 3, purpose });
      setAmount(""); setPurpose("");
      alert("Application sent! High-tier processing in progress.");
    } catch (e: any) { alert(e.message); }
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 140, paddingTop: 60 }}
      refreshControl={<RefreshControl refreshing={list.isLoading} tintColor="#10B981" />}
    >
      <View className="px-6">
        <PremiumHeader title="ClipLoans" subtitle="Growth Capital" />

        {/* Dynamic Limit Card */}
        <Card glass className="mb-10 border-gold/20">
          <Text className="text-gold font-black text-[10px] uppercase tracking-[0.4em] mb-4 text-center">Premium Credit Line</Text>
          <View className="items-center">
            <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-5xl tracking-tighter">GH₵ {maxLoan.toLocaleString()}</Text>
            <Text className="text-muted-foreground text-[10px] font-bold mt-2 uppercase">Your Dynamic Borrowing Limit</Text>
          </View>

          <View className="mt-8 pt-8 border-t border-white/5 space-y-4">
            <Input
              label="Request Amount" value={amount} onChangeText={setAmount}
              keyboardType="numeric" placeholder="0.00"
            />
            <Input
              label="Business Purpose" value={purpose} onChangeText={setPurpose}
              placeholder="e.g. Shop Expansion"
            />
            <Button title="Unlock Capital" onPress={handleApply} loading={apply.isPending} />
          </View>
        </Card>

        <LoanCalculator maxAmount={maxLoan} />

        <View className="mt-12">
          <Text className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mb-6 ml-1">Loan Portfolio</Text>
          {list.data?.length === 0 ? (
            <Card className="items-center py-10 border-dashed opacity-50">
               <TrendingUp size={32} color="#405045" />
               <Text className="text-muted-foreground font-bold mt-4 italic">No active facilities</Text>
            </Card>
          ) : (
            list.data?.map((l) => (
              <Card key={l.id} className="mb-4">
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-lg">GH₵ {l.amount}</Text>
                    <Text className="text-muted-foreground text-[10px] font-bold uppercase">{l.purpose}</Text>
                  </View>
                  <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    <Text className="text-primary text-[9px] font-black uppercase">{l.status}</Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
