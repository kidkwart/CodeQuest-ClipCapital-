import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useCart } from "@/lib/cart";
import { usePlaceOrder } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, Trash2, ShieldCheck, ShoppingBag, Plus, Minus, XCircle } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';

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
      alert("Success: Your order has been placed!");
      router.replace("/(tabs)");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleClearCart = () => {
    if (Platform.OS === 'web') {
      if (confirm("Are you sure you want to clear your entire cart?")) {
        cart.clear();
      }
    } else {
      Alert.alert(
        "Clear Cart",
        "Are you sure you want to remove all items from your cart?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Clear All", style: "destructive", onPress: () => cart.clear() }
        ]
      );
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
        ),
        headerRight: () => cart.items.length > 0 ? (
          <TouchableOpacity
            onPress={handleClearCart}
            style={{ marginRight: 16, height: 40, paddingHorizontal: 12, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', flexDirection: 'row', gap: 6 }}
          >
            <XCircle size={16} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontFamily: 'Display-Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Clear</Text>
          </TouchableOpacity>
        ) : null
      }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="Your Cart" subtitle="Order Review" />

          {cart.items.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', py: 80, opacity: 0.3 }}>
              <ShoppingBag size={64} color="#405045" />
              <Text style={{ color: 'white', fontWeight: 'bold', mt: 24, fontStyle: 'italic' }}>Your cart is empty</Text>
            </View>
          ) : (
            <View>
              {cart.items.map((item) => (
                <Card key={item.product_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16, padding: 20 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
                    <Text style={{ color: '#7d8a84', fontSize: 11, fontWeight: '900', mt: 4 }}>GH₵ {item.price}</Text>
                  </View>

                  {/* Quantity Controls */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                    <TouchableOpacity onPress={() => cart.setQty(item.product_id, item.qty - 1)} hitSlop={10}>
                      <Minus size={16} color={item.qty > 1 ? "#10b981" : "#405045"} />
                    </TouchableOpacity>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 14, minWidth: 20, textAlign: 'center' }}>{item.qty}</Text>
                    <TouchableOpacity onPress={() => cart.setQty(item.product_id, item.qty + 1)} hitSlop={10}>
                      <Plus size={16} color="#10b981" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={() => cart.remove(item.product_id)} style={{ marginLeft: 8 }}>
                    <Trash2 size={18} color="#ef4444" opacity={0.6} />
                  </TouchableOpacity>
                </Card>
              ))}

              <Card glass style={{ marginTop: 32, borderColor: 'rgba(16,185,129,0.2)', padding: 32 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Subtotal</Text>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>GH₵ {total.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Delivery</Text>
                  <Text style={{ color: '#10b981', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Complimentary</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', pt: 24, marginBottom: 40 }}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Total Payable</Text>
                  <Text style={{ fontFamily: 'Display-Bold', color: '#f59e0b', fontSize: 28, letterSpacing: -1 }}>GH₵ {total.toLocaleString()}</Text>
                </View>

                {/* PREMIUM PAY BUTTON */}
                <View style={{ borderRadius: 24, overflow: 'hidden', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}>
                  <LinearGradient
                    colors={['#10b981', '#065f46']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <TouchableOpacity
                      onPress={handleCheckout}
                      disabled={place.isPending}
                      activeOpacity={0.8}
                      style={{ height: 72, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12 }}
                    >
                      <Text style={{ fontFamily: 'Display-Bold', color: '#080c0a', fontSize: 15, letterSpacing: 3, textTransform: 'uppercase' }}>
                        {place.isPending ? "Authenticating..." : "Pay with MoMo"}
                      </Text>
                      <ShieldCheck size={20} color="#080c0a" opacity={0.6} />
                    </TouchableOpacity>
                  </LinearGradient>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, opacity: 0.4 }}>
                  <Text style={{ color: '#10b981', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3 }}>Bank-Grade Encryption Active</Text>
                </View>
              </Card>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

import { Platform } from "react-native";
