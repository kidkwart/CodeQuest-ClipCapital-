import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useCart } from "@/lib/cart";
import { usePlaceOrder, useProfile, useMyActiveLoans } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, Trash2, ShoppingBag, Wallet, CreditCard, Banknote, XCircle } from "lucide-react-native";

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
  const { data: activeLoans } = useMyActiveLoans();

  const [loading, setLoading] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);

  const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  const PAYSTACK_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_yoursecretkey";

  const activeLoan = activeLoans?.[0];

  const handleWalletPayment = async () => {
    if (Number(profile?.wallet_balance || 0) < total) {
      const msg = "Insufficient Balance. Please top up your wallet or pay with Paystack.";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Insufficient Balance", msg);
      return;
    }

    setLoading(true);
    try {
      await place.mutateAsync({
        items: cart.items,
        payment_method: "wallet",
        status: "paid"
      });

      await cart.clear();

      const successMsg = "Success: Order placed using wallet balance!";
      if (Platform.OS === 'web') window.alert(successMsg);
      else Alert.alert("Success", successMsg);

      router.replace("/(tabs)");
    } catch (e: any) {
      console.error("Wallet payment failed:", e);
      const errorMsg = e.message === "INSUFFICIENT_BALANCE" ? "Insufficient wallet balance." : `Transaction failed: ${e.message}`;
      if (Platform.OS === 'web') window.alert(errorMsg);
      else Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLoanPayment = async () => {
    if (!activeLoan) {
      Alert.alert("No Active Credit", "You don't have an active credit line.");
      return;
    }

    setLoading(true);
    try {
      await place.mutateAsync({
        items: cart.items,
        payment_method: "loan",
        loan_id: activeLoan.id,
        status: "paid"
      });

      await cart.clear();
      const msg = "Success: Order placed using your credit line!";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Success", msg);

      router.replace("/(tabs)");
    } catch (e: any) {
      console.error("Loan payment failed:", e);
      const errorMsg = `Order failed: ${e.message}`;
      if (Platform.OS === 'web') window.alert(errorMsg);
      else Alert.alert("Error", errorMsg);
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
        momo_reference: reference,
        momo_provider: "Paystack"
      });
      await cart.clear();

      const msg = "Success: Order placed successfully!";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Success", msg);

      router.replace("/(tabs)");
    } catch (e: any) {
      console.error("Paystack order save failed:", e);
      const msg = `Order failed to save: ${e.message}. Please contact support.`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleWebPayment = () => {
    if (window.confirm("Simulate a successful Paystack payment?")) {
      handlePaystackSuccess("WEB-ORDER-" + Math.random().toString(36).substring(2, 9).toUpperCase());
    }
  };

  const handleClearCart = async () => {
    try {
      await cart.clear();
      if (Platform.OS === 'web') {
        window.alert("Cart has been cleared.");
      } else {
        Alert.alert("Success", "Cart has been cleared.");
      }
    } catch (e) {
      console.error("Failed to clear cart:", e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Stack.Screen options={{ headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
        ),
        headerRight: () => cart.items.length > 0 ? (
          <TouchableOpacity onPress={handleClearCart} style={[styles.navBtn, { marginRight: 16 }]}>
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        ) : null
      }} />

      {showPaystack && Platform.OS !== 'web' && (
        <View style={StyleSheet.absoluteFillObject}>
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

      <ScrollView
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <PremiumHeader title="Checkout" subtitle={`${cart.items.length} Items Selected`} />

        {cart.items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShoppingBag size={64} color="#405045" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Button title="Go Shopping" onPress={() => router.push("/market")} style={{ marginTop: 20 }} />
          </View>
        ) : (
          <View>
            <View className="flex-row justify-between items-center mb-4 px-2">
                <Text className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Items in Cart</Text>
                <TouchableOpacity onPress={handleClearCart}>
                    <Text className="text-red-500/60 text-xs font-bold">Clear All</Text>
                </TouchableOpacity>
            </View>

            {cart.items.map((item) => (
              <Card key={item.product_id} className="mb-3 p-0">
                <View className="flex-row items-center p-4">
                  <View style={{ flex: 1 }}>
                    <Text className="text-white font-bold">{item.name}</Text>
                    <Text className="text-white/40 text-xs mt-1">GH₵ {item.price} x {item.qty}</Text>
                  </View>
                  <TouchableOpacity onPress={() => cart.remove(item.product_id)} hitSlop={15}>
                    <Trash2 size={18} color="#ef4444" opacity={0.6} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}

            <Card className="mt-6 p-6">
              <View className="flex-row justify-between items-center border-b border-white/5 pb-4 mb-6">
                <Text className="text-white/60 font-bold">Grand Total</Text>
                <Text className="text-gold font-bold text-2xl">GH₵ {total.toLocaleString()}</Text>
              </View>

              <View style={{ gap: 12 }}>
                {activeLoan && (
                   <Button variant="outline" onPress={handleLoanPayment} loading={loading} style={{ borderColor: '#f59e0b40', height: 70 }}>
                      <View className="flex-row items-center gap-4">
                        <Banknote size={20} color="#f59e0b" />
                        <View>
                          <Text className="text-white font-bold text-sm">Pay with Credit</Text>
                          <Text className="text-[#f59e0b] text-[10px] font-black uppercase">Active Loan Facility</Text>
                        </View>
                      </View>
                   </Button>
                )}

                <Button variant="outline" onPress={handleWalletPayment} loading={loading} style={{ height: 70 }}>
                  <View className="flex-row items-center gap-4">
                    <Wallet size={20} color="#10b981" />
                    <View>
                      <Text className="text-white font-bold text-sm">Pay with Wallet</Text>
                      <Text className="text-primary text-[10px] font-black uppercase">Balance: GH₵ {profile?.wallet_balance || '0.00'}</Text>
                    </View>
                  </View>
                </Button>

                <Button
                  title={Platform.OS === 'web' ? "Simulate Paystack" : "Pay with Paystack"}
                  onPress={() => Platform.OS === 'web' ? handleWebPayment() : setShowPaystack(true)}
                  loading={loading}
                  style={{ height: 60 }}
                />
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  navBtn: { height: 44, width: 44, borderRadius: 14, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyContainer: { alignItems: 'center', paddingVertical: 80, opacity: 0.5 },
  emptyText: { color: 'white', fontFamily: 'Display-Bold', marginTop: 16 },
});
