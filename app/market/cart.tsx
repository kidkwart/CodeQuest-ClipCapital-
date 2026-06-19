import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useCart } from "@/lib/cart";
import { usePlaceOrder, useProfile, useAddExpense } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, Trash2, ShieldCheck, ShoppingBag, Plus, Minus, XCircle, Wallet, CreditCard } from "lucide-react-native";

// Conditional import for Paystack to avoid web errors
let Paystack: any = null;
if (Platform.OS !== 'web') {
  Paystack = require('react-native-paystack-webview').Paystack;
}

export default function CartScreen() {
  const router = useRouter();
  const cart = useCart();
  const place = usePlaceOrder();
  const { data: profile } = useProfile();
  const addExpense = useAddExpense();

  const [loading, setLoading] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);

  const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  const PAYSTACK_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_your_key_here";

  const handleWalletPayment = async () => {
    if (Number(profile?.wallet_balance || 0) < total) {
      Alert.alert("Insufficient Balance", "Please top up your wallet or pay with Paystack.");
      return;
    }

    setLoading(true);
    try {
      await place.mutateAsync({
        items: cart.items,
        payment_method: "momo",
        status: "paid"
      });

      await addExpense.mutateAsync({
        amount: total,
        category: "Supplies",
        note: `Payment for Order`,
        entry_date: new Date().toISOString().split('T')[0]
      });

      await cart.clear();
      Alert.alert("Success", "Order placed using wallet balance!");
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackSuccess = async (reference: string) => {
    setShowPaystack(false);
    setLoading(true);
    try {
      await place.mutateAsync({
        items: cart.items,
        payment_method: "momo",
        status: "paid",
        momo_reference: reference
      });
      await cart.clear();
      Alert.alert("Success", "Order placed successfully!");
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Critical Error", "Payment received but order failed to save. Contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handleWebPayment = () => {
    Alert.alert(
      "Web Simulation",
      "Paystack WebView is not supported on browsers. Simulate success?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Simulate", onPress: () => handlePaystackSuccess("WEB-ORDER-" + Math.random().toString(36).substr(2, 9).toUpperCase()) }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Stack.Screen options={{ headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
        )
      }} />

      {showPaystack && Platform.OS !== 'web' && (
        <View style={StyleSheet.absoluteFill}>
          <Paystack
            paystackKey={PAYSTACK_KEY}
            amount={total * 100}
            billingEmail={profile?.email || "customer@example.com"}
            onCancel={() => setShowPaystack(false)}
            onSuccess={(res: any) => handlePaystackSuccess(res.transactionRef.reference)}
            autoStart={true}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingTop: 100, paddingBottom: 40, paddingHorizontal: 24 }}>
        <PremiumHeader title="Checkout" subtitle={`${cart.items.length} Items Selected`} />

        {cart.items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShoppingBag size={64} color="#405045" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Button title="Go Shopping" onPress={() => router.push("/market")} style={{ marginTop: 20 }} />
          </View>
        ) : (
          <View>
            {cart.items.map((item) => (
              <Card key={item.product_id} style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>GH₵ {item.price} x {item.qty}</Text>
                </View>
                <TouchableOpacity onPress={() => cart.remove(item.product_id)}>
                  <Trash2 size={18} color="#ef4444" opacity={0.6} />
                </TouchableOpacity>
              </Card>
            ))}

            <Card glass style={styles.summaryCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalValue}>GH₵ {total.toLocaleString()}</Text>
              </View>

              <View style={{ gap: 12 }}>
                <TouchableOpacity onPress={handleWalletPayment} disabled={loading} style={styles.walletBtn}>
                  <Wallet size={20} color="#10b981" />
                  <View>
                    <Text style={styles.btnTitle}>Pay with Wallet</Text>
                    <Text style={styles.btnSub}>Balance: GH₵ {profile?.wallet_balance || '0.00'}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      handleWebPayment();
                    } else {
                      setShowPaystack(true);
                    }
                  }}
                  disabled={loading}
                  style={styles.paystackBtn}
                >
                  <CreditCard size={20} color="#0d1310" />
                  <Text style={styles.paystackBtnText}>
                    {Platform.OS === 'web' ? "Simulate Paystack" : "Pay with Paystack"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  navBtn: { marginLeft: 16, height: 44, width: 44, borderRadius: 14, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyContainer: { alignItems: 'center', paddingVertical: 80, opacity: 0.5 },
  emptyText: { color: 'white', fontFamily: 'Display-Bold', marginTop: 16 },
  itemCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 16 },
  itemName: { color: 'white', fontWeight: 'bold' },
  itemPrice: { color: '#7d8a84', fontSize: 12, marginTop: 4 },
  summaryCard: { marginTop: 24, padding: 24, borderColor: 'rgba(16,185,129,0.2)' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 16, marginBottom: 20 },
  totalLabel: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontFamily: 'Display-Bold', color: '#f59e0b', fontSize: 24 },
  walletBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 16, borderWidth: 1, borderColor: '#10b98130' },
  btnTitle: { color: 'white', fontWeight: 'bold' },
  btnSub: { color: '#10b981', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  paystackBtn: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#10b981', borderRadius: 16 },
  paystackBtnText: { fontFamily: 'Display-Bold', color: '#0d1310', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }
});
