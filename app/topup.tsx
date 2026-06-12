import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useProfile, useAddIncome } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react-native";

// Conditional import for Paystack to avoid web errors
let Paystack: any = null;
if (Platform.OS !== 'web') {
  Paystack = require('react-native-paystack-webview').Paystack;
}

export default function TopUpScreen() {
  const router = useRouter();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const addIncome = useAddIncome();

  const [amount, setAmount] = useState("");
  const [showPaystack, setShowPaystack] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const PAYSTACK_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

  const handleSuccess = async (reference: string) => {
    console.log("Payment successful, reference:", reference);
    setShowPaystack(false);
    setIsProcessing(true);

    try {
      await addIncome.mutateAsync({
        amount: Number(amount),
        note: `Wallet Deposit (Ref: ${reference})`,
      });

      console.log("Database updated, refetching profile...");
      await refetchProfile();
      setSuccess(true);
    } catch (e: any) {
      console.error("Deposit Processing Error:", e);

      const msg = e.message === "DATABASE_FUNCTION_MISSING"
        ? "Database configuration error. Please run the SQL script in Supabase."
        : (e.message || "Failed to update balance.");

      if (Platform.OS === 'web') {
        alert("Error: " + msg);
      } else {
        Alert.alert("Deposit Error", msg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = () => {
    if(!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return Alert.alert("Invalid Amount", "Please enter a valid number.");
    }

    if (Platform.OS === 'web') {
      handleSuccess("WEB-SIM-" + Math.random().toString(36).substring(7).toUpperCase());
    } else {
      setShowPaystack(true);
    }
  };

  if (success) {
    return (
      <View style={styles.centerContainer}>
        <CheckCircle2 size={80} color="#10b981" />
        <Text style={styles.successTitle}>Deposit Successful!</Text>
        <Text style={styles.successSub}>GH₵ {amount} has been added to your wallet.</Text>
        <Button title="Return to Wallet" onPress={() => router.replace("/(tabs)/wallet")} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Stack.Screen options={{ headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
        )
      }} />

      {showPaystack && Platform.OS !== 'web' && (
        <View style={StyleSheet.absoluteFill}>
          <Paystack
            paystackKey={PAYSTACK_KEY}
            amount={Number(amount) * 100}
            billingEmail={profile?.email || "user@example.com"}
            activityIndicatorColor="#10b981"
            onCancel={() => setShowPaystack(false)}
            onSuccess={(res: any) => handleSuccess(res.transactionRef.reference)}
            autoStart={true}
          />
        </View>
      )}

      {isProcessing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.overlayText}>Finalizing Transaction...</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingTop: 100, paddingHorizontal: 24 }}>
        <PremiumHeader title="Add Funds" subtitle="Instant Wallet Top-up" />

        <Card style={styles.balanceCard}>
          <Text style={styles.smallLabel}>CURRENT BALANCE</Text>
          <Text style={styles.balanceValue}>GH₵ {profile?.wallet_balance?.toLocaleString() || '0.00'}</Text>
        </Card>

        <View style={{ marginBottom: 40 }}>
          <Text style={styles.label}>AMOUNT TO ADD (GH₵)</Text>
          <Input
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        <Button
          title={Platform.OS === 'web' ? "Simulate Deposit" : "Pay with Paystack"}
          onPress={handleAction}
          size="lg"
          disabled={isProcessing}
        />

        <View style={styles.footerNote}>
          <ShieldCheck size={14} color="#10b981" />
          <Text style={styles.footerText}>Secured by Paystack Encryption</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBtn: { marginLeft: 16, height: 44, width: 44, borderRadius: 14, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  centerContainer: { flex: 1, backgroundColor: '#080c0a', alignItems: 'center', justifyContent: 'center', padding: 40 },
  successTitle: { fontFamily: 'Display-Bold', color: 'white', fontSize: 28, marginTop: 24, marginBottom: 8 },
  successSub: { color: '#7d8a84', textAlign: 'center', marginBottom: 40 },
  balanceCard: { backgroundColor: '#10b98110', borderColor: '#10b98130', marginBottom: 32, padding: 20 },
  smallLabel: { color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  balanceValue: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  label: { color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, opacity: 0.6 },
  footerText: { color: '#10b981', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,12,10,0.9)', zIndex: 100, alignItems: 'center', justifyContent: 'center' },
  overlayText: { color: 'white', marginTop: 20, fontFamily: 'Display-Bold' }
});
