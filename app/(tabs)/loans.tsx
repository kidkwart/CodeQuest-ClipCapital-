import React, { useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from "react-native";
import { useApplyForLoan, useClipScore, useMyLoans } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import { PremiumHeader } from "@/components/native/premium-header";
import { LoanCalculator } from "@/components/native/loan-calculator";
import { Banknote, Clock, ShieldCheck } from "lucide-react-native";

export default function Loans() {
  const { score } = useClipScore();
  const list = useMyLoans();
  const apply = useApplyForLoan();
  const maxLoan = Math.max(200, Math.min(5000, Math.round((score - 100) * 8)));

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");

  async function handleApply() {
    const requestedAmount = Number(amount);
    if (!requestedAmount || requestedAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (requestedAmount > maxLoan) {
      alert(`Limit Exceeded: Your maximum borrowing capacity is GH₵ ${maxLoan.toLocaleString()}.`);
      return;
    }

    try {
      await apply.mutateAsync({ amount: requestedAmount, term_months: 3, purpose });
      setAmount(""); setPurpose("");
      alert("Success: Your application is being processed.");
    } catch (e: any) { alert(e.message); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 60 }}
        refreshControl={<RefreshControl refreshing={list.isLoading} tintColor="#10B981" />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="ClipLoans" subtitle="Elite Credit" />

          {/* Hero Application Card - THE PREMIUM BOX */}
          <Card glass style={{ marginBottom: 48, padding: 32, borderColor: '#f59e0b30' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
               <ShieldCheck size={16} color="#f59e0b" />
               <Text style={{ color: '#f59e0b', fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase' }}>Private Credit Line</Text>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <Text style={{ fontFamily: 'Display-Bold', color: '#fcfcfc', fontSize: 64, letterSpacing: -3, lineHeight: 64 }}>GH₵ {maxLoan.toLocaleString()}</Text>
              <Text style={{ color: '#7d8a84', fontFamily: 'Display-Bold', fontSize: 10, marginTop: 12, textTransform: 'uppercase', letterSpacing: 3 }}>Your Borrowing Capacity</Text>
            </View>

            <View style={{ gap: 24 }}>
              <Input
                label="Request Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00 GH₵"
              />
              <Input
                label="Loan Purpose"
                value={purpose}
                onChangeText={setPurpose}
                placeholder="e.g. Shop Expansion"
              />
              <Button
                title="Unlock Capital"
                onPress={handleApply}
                loading={apply.isPending}
                variant="secondary"
                size="lg"
                style={{ marginTop: 12 }}
              />
            </View>
          </Card>

          <LoanCalculator maxAmount={maxLoan} />

          <View style={{ marginTop: 64 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32, marginLeft: 8 }}>
               <Banknote size={20} color="#10B981" />
               <Text style={{ color: 'rgba(252,252,252,0.3)', fontFamily: 'Display-Bold', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase' }}>Active Facilities</Text>
            </View>

            {(list.data ?? []).length === 0 ? (
              <Card style={{ alignItems: 'center', paddingVertical: 80, borderStyle: 'dashed', opacity: 0.3, backgroundColor: 'transparent' }}>
                 <Clock size={40} color="#405045" />
                 <Text style={{ color: 'white', fontFamily: 'Display-Bold', marginTop: 20, fontStyle: 'italic', fontSize: 12 }}>No active facilities found</Text>
              </Card>
            ) : (
              <View style={{ paddingBottom: 40 }}>
                {list.data?.map((l) => (
                  <Card key={l.id} style={{ marginBottom: 16, padding: 24, backgroundColor: 'rgba(15,23,20,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Display-Bold', color: '#fcfcfc', fontSize: 20 }}>GH₵ {l.amount}</Text>
                        <Text style={{ color: '#7d8a84', fontFamily: 'Display-Bold', fontSize: 9, textTransform: 'uppercase', marginTop: 6, letterSpacing: 2 }}>{l.purpose}</Text>
                      </View>
                      <View style={{ backgroundColor: '#10b98115', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: '#10b98130' }}>
                        <Text style={{ color: '#10B981', fontFamily: 'Display-Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{l.status}</Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
