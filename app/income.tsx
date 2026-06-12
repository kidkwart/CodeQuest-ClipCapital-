import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useIncome, useAddIncome, useDeleteIncome } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import { ArrowLeft, Trash2, TrendingUp } from "lucide-react-native";

export default function IncomeScreen() {
  const router = useRouter();
  const { data: incomeList } = useIncome();
  const addIncome = useAddIncome();
  const deleteIncome = useDeleteIncome();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleAdd = async () => {
    if (!amount) return;
    try {
      await addIncome.mutateAsync({
        amount: Number(amount),
        note: note || "Manual Entry",
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
        title: "Income Tracker",
        headerStyle: { backgroundColor: "#0A0A0A" },
        headerTintColor: "#FFFFFF",
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView className="flex-1 px-6 pt-6">
        <Card className="mb-8 border-emerald-500/20 bg-emerald-500/5">
          <Text className="text-emerald-500 font-black text-xs uppercase mb-4">Log New Income</Text>
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
            placeholder="e.g. Morning Shift"
            containerClassName="mb-4"
          />
          <Button
            title="Add Income"
            onPress={handleAdd}
            loading={addIncome.isPending}
          />
        </Card>

        <View className="mb-20">
          <Text className="text-lg font-bold text-foreground mb-4">History</Text>
          {(incomeList ?? []).length === 0 ? (
            <Text className="text-muted-foreground italic">No entries yet</Text>
          ) : (
            incomeList?.map((item) => (
              <View key={item.id} className="flex-row items-center justify-between py-4 border-b border-border/20">
                <View>
                  <Text className="text-foreground font-bold">{item.note}</Text>
                  <Text className="text-muted-foreground text-[10px]">{item.entry_date}</Text>
                </View>
                <View className="flex-row items-center gap-4">
                  <Text className="text-emerald-500 font-black">GH₵ {item.amount}</Text>
                  <TouchableOpacity onPress={() => deleteIncome.mutate(item.id)}>
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
