import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTransactionHistory } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, ShoppingBag, Wallet, Banknote } from "lucide-react-native";

export default function HistoryScreen() {
  const router = useRouter();
  const { data: history, isLoading } = useTransactionHistory();

  const getIcon = (type: string, amount: number) => {
    if (type === "order") return <ShoppingBag size={18} color="#F59E0B" />;
    if (type.startsWith("susu")) return <Wallet size={18} color="#10B981" />;
    if (type.startsWith("loan")) return <Banknote size={18} color="#10B981" />;
    return amount > 0 ? <ArrowUpRight size={18} color="#10B981" /> : <ArrowDownLeft size={18} color="#EF4444" />;
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{
        headerShown: true,
        title: "Transaction History",
        headerStyle: { backgroundColor: "#0A0A0A" },
        headerTintColor: "#FFFFFF",
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView className="flex-1 px-6 pt-6">
        {isLoading ? (
          <Text className="text-muted-foreground italic">Loading history...</Text>
        ) : (history ?? []).length === 0 ? (
          <Text className="text-muted-foreground italic text-center py-20">No transactions found</Text>
        ) : (
          <View className="pb-20">
            {history?.map((t) => (
              <View key={`${t.type}-${t.id}`} className="flex-row items-center justify-between py-4 border-b border-border/20">
                <View className="flex-row items-center gap-4">
                  <View className={`h-10 w-10 rounded-2xl items-center justify-center bg-surface border border-border/30`}>
                    {getIcon(t.type, t.amount)}
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-bold text-sm" numberOfLines={1}>{t.title}</Text>
                    <Text className="text-muted-foreground text-[10px] uppercase">
                      {new Date(t.date).toLocaleDateString()} · {t.status || 'COMPLETED'}
                    </Text>
                  </View>
                </View>
                <Text className={`font-black ml-4 ${t.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {t.amount > 0 ? '+' : '-'} GH₵ {Math.abs(t.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
