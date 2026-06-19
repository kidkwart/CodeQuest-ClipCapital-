import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useMyOrders } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { ArrowLeft, ShoppingBag, Clock, CheckCircle2 } from "lucide-react-native";

export default function OrdersScreen() {
  const router = useRouter();
  const { data: orders, isLoading } = useMyOrders();

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{
        headerShown: true, title: "My Orders",
        headerStyle: { backgroundColor: "#0A0A0A" }, headerTintColor: "#FFF",
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView className="flex-1 px-6 pt-6">
        <View className="mb-6">
          <Text className="text-muted-foreground text-xs font-black uppercase tracking-widest">Marketplace</Text>
          <Text className="text-white text-3xl font-black tracking-tighter">Your Orders</Text>
        </View>

        {isLoading ? (
          <Text className="text-muted-foreground italic">Loading your orders...</Text>
        ) : (orders ?? []).length === 0 ? (
          <View className="items-center justify-center py-20">
            <ShoppingBag size={48} color="#404040" />
            <Text className="text-muted-foreground mt-4 font-bold">No orders yet</Text>
          </View>
        ) : (
          <View className="pb-20">
            {orders?.map((o) => (
              <Card key={o.id} className="mb-4">
                <View className="flex-row justify-between items-start mb-4">
                  <View>
                    <Text className="text-white font-bold text-lg">GH₵ {Number(o.total).toLocaleString()}</Text>
                    <Text className="text-muted-foreground text-[10px] uppercase font-bold mt-1">
                      {new Date(o.created_at).toLocaleDateString()} · {o.momo_provider.toUpperCase()}
                    </Text>
                  </View>
                  <View className="bg-primary/10 px-3 py-1 rounded-full">
                    <Text className="text-primary text-[10px] font-black uppercase">{o.status}</Text>
                  </View>
                </View>

                <View className="border-t border-white/5 pt-3">
                  {(o as any).order_items?.map((item: any) => (
                    <View key={item.id} className="flex-row justify-between py-1">
                      <Text className="text-muted-foreground text-xs">{item.products?.name ?? "Item"} × {item.qty}</Text>
                      <Text className="text-white text-xs font-bold">GH₵ {(Number(item.price) * item.qty).toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
