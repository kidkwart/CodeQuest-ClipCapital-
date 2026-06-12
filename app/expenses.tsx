import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useExpenses, useAddExpense, useDeleteExpense } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, Trash2, ArrowDownLeft, Clock } from "lucide-react-native";

export default function ExpensesScreen() {
  const router = useRouter();
  const { data: expensesList, isLoading, refetch } = useExpenses();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleAdd = async () => {
    if (!amount) return;
    try {
      await addExpense.mutateAsync({
        amount: Number(amount),
        category: "Business",
        note: note || "Business Expense",
        entry_date: new Date().toISOString().split('T')[0]
      });
      setAmount("");
      setNote("");
      alert("Expense logged!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16, height: 40, width: 40, borderRadius: 12, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor="#10B981" onRefresh={refetch} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="Expenses" subtitle="Cost Tracking" />

          <Card glass style={{ marginBottom: 48, borderColor: 'rgba(239,68,68,0.2)' }}>
            <Text style={{ color: '#ef4444', fontWeight: '900', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20 }}>Log New Expense</Text>
            <Input
              label="Amount (GH₵)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              containerClassName="mb-4"
            />
            <Input
              label="Description"
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Electricity bill"
              containerClassName="mb-6"
            />
            <Button
              title="Add Expense"
              variant="destructive"
              onPress={handleAdd}
              loading={addExpense.isPending}
            />
          </Card>

          <View style={{ marginBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, marginLeft: 8 }}>
               <ArrowDownLeft size={18} color="#ef4444" />
               <Text style={{ color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase' }}>Expense History</Text>
            </View>

            {(expensesList ?? []).length === 0 ? (
              <Card style={{ alignItems: 'center', paddingVertical: 60, borderStyle: 'dashed', opacity: 0.3 }}>
                 <Clock size={32} color="#405045" />
                 <Text style={{ color: 'white', fontWeight: 'bold', marginTop: 16, fontStyle: 'italic' }}>No records yet</Text>
              </Card>
            ) : (
              expensesList?.map((item, idx) => (
                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: idx !== expensesList!.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
                      <ArrowDownLeft size={20} color="#ef4444" />
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{item.note}</Text>
                      <Text style={{ color: '#7d8a84', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', mt: 4, letterSpacing: 1 }}>{item.entry_date}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <Text style={{ fontFamily: 'Display-Bold', color: '#ef4444', fontSize: 16 }}>- {item.amount}</Text>
                    <TouchableOpacity onPress={() => deleteExpense.mutate(item.id)}>
                      <Trash2 size={16} color="#ef4444" opacity={0.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
