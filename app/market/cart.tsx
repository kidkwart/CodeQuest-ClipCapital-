import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useCart } from "@/lib/cart";
import { usePlaceOrder, useProfile, useMyActiveLoans } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, Trash2, ShoppingBag, Wallet, CreditCard, Banknote, CheckCircle2, AlertCircle, Plus, Minus, ArrowRight, ArrowLeftCircle, Sparkles } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';

// Safer conditional import for Paystack
const PaystackComponent = Platform.OS !== 'web' ? require('react-native-paystack-webview').Paystack : null;

export default function CartScreen() {
  const router = useRouter();
  const cart = useCart();
  const place = usePlaceOrder();
  const { data: profile } = useProfile();
  const { data: activeLoans } = useMyActiveLoans();

  const [loading, setLoading] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  const PAYSTACK_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_824b3afe0f0c6cdd1bc0e053adb97f56499796a3";

  const activeLoan = activeLoans?.[0];

  const handleSuccess = async (reference: string) => {
    setShowPaystack(false);
    setLoading(true);
    setStatusMessage({ text: "Finalizing order...", type: "success" });

    try {
      await place.mutateAsync({
        items: cart.items,
        payment_method: "momo",
        status: "paid",
        momo_reference: reference,
        momo_provider: "Paystack"
      });

      await cart.clear();
      Alert.alert("Success! 🎉", "Your order has been placed successfully.");
      router.replace("/(tabs)");
    } catch (e: any) {
      console.error("Order placement failed:", e);
      setStatusMessage({ text: "Order failed to save. Please contact support.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleWalletPayment = async () => {
    if (Number(profile?.wallet_balance || 0) < total) {
      setStatusMessage({ text: "Insufficient wallet balance.", type: "error" });
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
      Alert.alert("Success! 🎉", "Order placed using your wallet balance.");
      router.replace("/(tabs)");
    } catch (e: any) {
      console.error("Wallet payment failed:", e);
      setStatusMessage({ text: e.message || "Transaction failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLoanPayment = async () => {
    if (!activeLoan) {
      Alert.alert("No Credit", "You don't have an active credit line.");
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
      Alert.alert("Success! 💳", "Order placed using your credit line.");
      router.replace("/(tabs)");
    } catch (e: any) {
      console.error("Loan payment failed:", e);
      setStatusMessage({ text: e.message || "Order failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackLaunch = () => {
    if (Platform.OS === 'web') {
        setLoading(true);
        setTimeout(() => {
            handleSuccess("WEB-ORDER-" + Date.now());
        }, 1500);
    } else {
        Alert.alert(
            "Payment Gateway",
            "Choose your payment processing method:",
            [
                { text: "Real Paystack", onPress: () => {
                    if (!PaystackComponent) {
                        Alert.alert("Error", "Library not loaded. Use Simulation.");
                        return;
                    }
                    setShowPaystack(true);
                }},
                { text: "Simulation (Test)", onPress: () => {
                    setLoading(true);
                    setTimeout(() => {
                        handleSuccess("SIM-MARKET-" + Date.now());
                    }, 1500);
                }},
                { text: "Cancel", style: "cancel" }
            ]
        );
    }
  };

  const handleClearCart = async () => {
    await cart.clear();
  };

  const updateQty = (productId: string, delta: number) => {
    const item = cart.items.find(i => i.product_id === productId);
    if (!item) return;
    const newQty = Math.max(1, item.qty + delta);
    cart.setQty(productId, newQty);
  };

  if (cart.items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.emptyContent}>
           <LinearGradient
             colors={['#10b981', '#064e3b']}
             style={styles.emptyIconCircle}
           >
              <ShoppingBag size={40} color="#000" strokeWidth={2} />
           </LinearGradient>

           <Text style={styles.emptyTitle}>Cart is empty</Text>
           <Text style={styles.emptySubtitle}>Your premium equipment selections will appear here. Ready to scale your business?</Text>

           <TouchableOpacity
             onPress={() => router.push("/market")}
             style={styles.browseButton}
             activeOpacity={0.8}
           >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.browseButtonInner}
              >
                <Sparkles size={16} color="#000" />
                <Text style={styles.browseButtonText}>GO TO MARKETPLACE</Text>
              </LinearGradient>
           </TouchableOpacity>

           <TouchableOpacity
             onPress={() => router.replace("/(tabs)")}
             style={styles.backLink}
           >
              <ArrowLeft size={14} color="#7d8a84" />
              <Text style={styles.backLinkText}>Return to Dashboard</Text>
           </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {showPaystack && Platform.OS !== 'web' && PaystackComponent && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: '#080c0a' }]}>
          <PaystackComponent
            paystackKey={PAYSTACK_KEY}
            amount={total * 100}
            billingEmail={profile?.email || "customer@clipcapital.com"}
            activityIndicatorColor="#10b981"
            onCancel={() => setShowPaystack(false)}
            onSuccess={(res: any) => handleSuccess(res.transactionRef.reference)}
            autoStart={true}
          />
        </View>
      )}

      {(loading || place.isPending) && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.overlayText}>Processing Order...</Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearCart} style={styles.clearBtn}>
               <Trash2 size={18} color="#ef4444" />
               <Text style={styles.clearText}>CLEAR</Text>
            </TouchableOpacity>
          </View>

          <PremiumHeader title="Checkout" subtitle={`${cart.items.length} Premium Items`} />

          <View style={styles.itemList}>
            {cart.items.map((item) => (
              <Card key={item.product_id} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPricePer}>GH₵ {item.price.toLocaleString()} each</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                     <Text style={styles.itemTotal}>GH₵ {(item.price * item.qty).toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.qtyRow}>
                   <View style={styles.qtyControls}>
                      <TouchableOpacity onPress={() => updateQty(item.product_id, -1)} style={styles.qtyBtn}>
                         <Minus size={14} color="#7d8a84" />
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{item.qty}</Text>
                      <TouchableOpacity onPress={() => updateQty(item.product_id, 1)} style={styles.qtyBtn}>
                         <Plus size={14} color="#10b981" />
                      </TouchableOpacity>
                   </View>
                   <TouchableOpacity onPress={() => cart.remove(item.product_id)} style={styles.removeBtn}>
                      <Trash2 size={14} color="#ef4444" />
                      <Text style={styles.removeText}>REMOVE</Text>
                   </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
               <Text style={styles.summaryLabel}>GRAND TOTAL</Text>
               <Text style={styles.summaryValue}>GH₵ {total.toLocaleString()}</Text>
            </View>

            {statusMessage.text !== "" && (
              <View style={[styles.statusBox, statusMessage.type === 'error' ? styles.statusError : styles.statusSuccess]}>
                {statusMessage.type === 'error' ? <AlertCircle size={14} color="#ef4444" /> : <CheckCircle2 size={14} color="#10b981" />}
                <Text style={[styles.statusText, { color: statusMessage.type === 'error' ? '#ef4444' : '#10b981' }]}>
                  {statusMessage.text}
                </Text>
              </View>
            )}

            <View style={{ gap: 12 }}>
                {activeLoan && (
                   <TouchableOpacity onPress={handleLoanPayment} style={[styles.payBtn, { borderColor: '#f59e0b40', borderWidth: 1 }]}>
                      <Banknote size={20} color="#f59e0b" />
                      <View style={{ flex: 1 }}>
                         <Text style={styles.payBtnTitle}>Pay with Credit</Text>
                         <Text style={styles.payBtnSub}>Active Loan Line</Text>
                      </View>
                      <ArrowRight size={16} color="#405045" />
                   </TouchableOpacity>
                )}

                <TouchableOpacity onPress={handleWalletPayment} style={[styles.payBtn, { borderColor: '#10b98140', borderWidth: 1 }]}>
                   <Wallet size={20} color="#10b981" />
                   <View style={{ flex: 1 }}>
                      <Text style={styles.payBtnTitle}>Pay with Wallet</Text>
                      <Text style={styles.payBtnSub}>Balance: GH₵ {profile?.wallet_balance?.toLocaleString() || '0.00'}</Text>
                   </View>
                   <ArrowRight size={16} color="#405045" />
                </TouchableOpacity>

                <Button
                    title="Pay with Mobile Money"
                    onPress={handlePaystackLaunch}
                    size="lg"
                />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c0a' },
  scrollContent: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { height: 44, width: 44, borderRadius: 14, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239, 68, 68, 0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  clearText: { color: '#ef4444', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  centerContainer: { flex: 1, backgroundColor: '#080c0a', justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyContent: { width: '100%', alignItems: 'center' },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 32, shadowColor: '#10b981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  emptyTitle: { color: 'white', fontFamily: 'Display-Bold', fontSize: 28, marginBottom: 12 },
  emptySubtitle: { color: '#7d8a84', fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, marginBottom: 40 },
  browseButton: { width: '100%', maxWidth: 280 },
  browseButtonInner: { height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  browseButtonText: { color: '#000', fontFamily: 'Display-Bold', fontSize: 13, letterSpacing: 1 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
  backLinkText: { color: '#7d8a84', fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: 'white', fontFamily: 'Display-Bold', fontSize: 24, marginTop: 20 },
  itemList: { marginBottom: 32 },
  itemCard: { padding: 20, marginBottom: 12, backgroundColor: '#0f1714' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  itemName: { color: 'white', fontWeight: 'bold', fontSize: 14, maxWidth: '70%' },
  itemPricePer: { color: '#405045', fontSize: 11, marginTop: 4, fontWeight: '600' },
  itemTotal: { color: '#10b981', fontFamily: 'Display-Bold', fontSize: 16 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1a211e', alignItems: 'center', justifyContent: 'center' },
  qtyValue: { color: 'white', fontFamily: 'Display-Bold', fontSize: 14, marginHorizontal: 16 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  removeText: { color: '#ef4444', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  summaryCard: { padding: 24, backgroundColor: '#0f1714' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 20 },
  summaryLabel: { color: '#7d8a84', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  summaryValue: { color: 'white', fontFamily: 'Display-Bold', fontSize: 24 },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)' },
  payBtnTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  payBtnSub: { color: '#7d8a84', fontSize: 11, marginTop: 2 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,12,10,0.95)', zIndex: 10000, alignItems: 'center', justifyContent: 'center' },
  overlayText: { color: 'white', marginTop: 20, fontWeight: 'bold' },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1 },
  statusError: { backgroundColor: '#ef444410', borderColor: '#ef444430' },
  statusSuccess: { backgroundColor: '#10b98110', borderColor: '#10b98130' },
  statusText: { fontSize: 12, fontWeight: 'bold', flex: 1 }
});
