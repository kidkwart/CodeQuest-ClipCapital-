import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useExpenses, useAddExpense, useDeleteExpense } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import { ArrowLeft, Trash2 } from "lucide-react-native";

export default function ExpensesScreen() {
  const router = useRouter();
  const { data: expensesList } = useExpenses();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Supplies");
  const [note, setNote] = useState("");

  const handleAdd = async () => {
    if (!amount) return;
    try {
      await addExpense.mutateAsync({
        amount: Number(amount),
        category,
        note: note || category,
        entry_date: new Date().toISOString().split('T')[0]
      });
      setAmount("");
      setNote("");
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{
        headerShown: true,
        title: "Expense Tracker",
        headerStyle: { backgroundColor: "#0A0A0A" },
        headerTintColor: "#FFFFFF",
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView className="flex-1 px-6 pt-6">
        <Card className="mb-8 border-red-500/20 bg-red-500/5">
          <Text className="text-red-500 font-black text-xs uppercase mb-4 tracking-widest">Log New Expense</Text>
          <Input
            label="Amount (GH₵)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
            containerClassName="mb-3"
          />
          <Input
            label="Note"
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Electricity bill"
            containerClassName="mb-4"
          />
          <Button
            title="Add Expense"
            variant="destructive"
            onPress={handleAdd}
            loading={addExpense.isPending}
          />
        </Card>

        <View className="mb-20">
          <Text className="text-lg font-bold text-white mb-4">History</Text>
          {(expensesList ?? []).length === 0 ? (
            <Text className="text-muted-foreground italic">No entries yet</Text>
          ) : (
            expensesList?.map((item) => (
              <View key={item.id} className="flex-row items-center justify-between py-4 border-b border-white/5">
                <View>
                  <Text className="text-white font-bold">{item.note}</Text>
                  <Text className="text-muted-foreground text-[10px] uppercase font-bold">{item.entry_date} · {item.category}</Text>
                </View>
                <View className="flex-row items-center gap-4">
                  <Text className="text-red-500 font-black">GH₵ {item.amount}</Text>
                  <TouchableOpacity onPress={() => deleteExpense.mutate(item.id)}>
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
