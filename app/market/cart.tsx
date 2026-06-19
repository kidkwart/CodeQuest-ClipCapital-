import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useCart } from "@/lib/cart";
import { usePlaceOrder } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { ArrowLeft, Trash2, ShieldCheck } from "lucide-react-native";

export default function CartScreen() {
  const router = useRouter();
  const cart = useCart();
  const place = usePlaceOrder();

  const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);

  const handleCheckout = async () => {
    if (cart.items.length === 0) return;
    try {
      await place.mutateAsync({
        items: cart.items,
        payment_method: "momo",
        status: "paid"
      });
      await cart.clear();
      alert("Order placed successfully!");
      router.replace("/(tabs)");
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{
        headerShown: true,
        title: "Your Cart",
        headerStyle: { backgroundColor: "#0A0A0A" },
        headerTintColor: "#FFFFFF",
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView className="flex-1 px-6 pt-6">
        {cart.items.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-muted-foreground italic">Your cart is empty</Text>
          </View>
        ) : (
          <View className="space-y-4">
            {cart.items.map((item) => (
              <Card key={item.product_id} className="flex-row items-center gap-4">
                <View className="flex-1">
                  <Text className="text-foreground font-bold">{item.name}</Text>
                  <Text className="text-muted-foreground text-xs">GH₵ {item.price} × {item.qty}</Text>
                </View>
                <TouchableOpacity onPress={() => cart.remove(item.product_id)}>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </Card>
            ))}

            <Card className="mt-6 bg-surface-elevated">
              <View className="flex-row justify-between mb-2">
                <Text className="text-muted-foreground">Subtotal</Text>
                <Text className="text-foreground font-bold">GH₵ {total.toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between mb-6">
                <Text className="text-muted-foreground">Delivery</Text>
                <Text className="text-primary font-black uppercase text-xs">Free</Text>
              </View>
              <View className="flex-row justify-between border-t border-border/20 pt-4 mb-6">
                <Text className="text-foreground font-black text-lg">Total</Text>
                <Text className="text-gold font-black text-2xl">GH₵ {total.toLocaleString()}</Text>
              </View>

              <Button
                title="Pay with Mobile Money"
                onPress={handleCheckout}
                loading={place.isPending}
              />
              <View className="flex-row items-center justify-center gap-2 mt-4 opacity-60">
                <ShieldCheck size={14} color="#10B981" />
                <Text className="text-[10px] text-primary font-bold">SECURE CHECKOUT</Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
