import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator, TextInput, KeyboardAvoidingView, Vibration } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useProfile, useDeposit } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, ShieldCheck, CheckCircle2, FlaskConical, Zap, ChevronRight } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "../src/context/language-context";

// Defensive import for Paystack
let Paystack: any = null;
try {
  Paystack = require('react-native-paystack-webview').Paystack;
} catch (e) {
  console.warn("Paystack module failed to load:", e);
}

export default function TopUpScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const deposit = useDeposit();

  const [amount, setAmount] = useState("");
  const [showPaystack, setShowPaystack] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const PAYSTACK_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_824b3afe0f0c6cdd1bc0e053adb97f56499796a3";

  const handleSuccess = async (reference: string) => {
    setShowPaystack(false);
    setIsProcessing(true);

    try {
      const cleanAmount = amount.replace(/[^0-9.]/g, '');
      const numAmount = parseFloat(cleanAmount);

      await deposit.mutateAsync({
        amount: numAmount,
        note: `Wallet Top-up (Ref: ${reference})`,
      });

      await refetchProfile();
      setSuccess(true);
      Vibration.vibrate(Platform.OS === 'ios' ? 0 : 50);
    } catch (e: any) {
      console.error("Deposit Error:", e);
      Alert.alert(t.sync_error, "Wallet update failed. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateSuccess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      handleSuccess("IOS-SIM-" + Math.random().toString(36).substring(7).toUpperCase());
    }, 1500);
  };

  const handleAction = () => {
    const cleanAmount = amount.replace(/[^0-9.]/g, '');
    const numAmount = parseFloat(cleanAmount);

    if(!cleanAmount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    if (Platform.OS === 'web') {
      simulateSuccess();
      return;
    }

    Alert.alert(
        "Institutional Gateway",
        "Select your preferred funding protocol:",
        [
            {
              text: "REAL PAYSTACK",
              onPress: () => {
                if (Paystack) {
                  setShowPaystack(true);
                } else {
                  Alert.alert("Module Error", "Paystack not found. Use simulation.");
                }
              }
            },
            { text: "SIMULATION (TEST)", onPress: simulateSuccess },
            { text: t.cancel, style: "cancel" }
        ]
    );
  };

  if (success) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#10b981', '#064e3b']}
          style={styles.successIconCircle}
        >
          <CheckCircle2 size={48} color="#000" strokeWidth={2.5} />
        </LinearGradient>
        <Text style={[styles.successTitle, { color: colors.text }]}>{t.protocol_complete}</Text>
        <Text style={[styles.successSub, { color: colors.textDim }]}>GH₵ {parseFloat(amount).toLocaleString()} {t.vault_addition_success}</Text>
        <BouncyTap style={[styles.returnBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onPress={() => router.replace("/(tabs)/wallet")}>
          <Text style={[styles.returnBtnText, { color: colors.text }]}>{t.return_to_vault}</Text>
        </BouncyTap>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {showPaystack && Paystack && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: colors.background }]}>
          <Paystack
            paystackKey={PAYSTACK_KEY}
            amount={parseFloat(amount.replace(/[^0-9.]/g, '')) * 100}
            billingEmail={profile?.email || "customer@clipcapital.com"}
            activityIndicatorColor={colors.primary}
            onCancel={() => setShowPaystack(false)}
            onSuccess={(res: any) => handleSuccess(res.transactionRef.reference)}
            autoStart={true}
          />
        </View>
      )}

      {isProcessing && (
        <View style={[styles.overlay, { backgroundColor: theme === 'dark' ? 'rgba(8,12,10,0.95)' : 'rgba(255,255,255,0.95)' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.overlayText, { color: colors.primary }]}>{t.syncing_vault}</Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <BouncyTap onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <ArrowLeft size={20} color={colors.text} />
          </BouncyTap>

          <PremiumHeader title={t.add_funds} subtitle={t.capital_injection} />

          <LinearGradient
            colors={theme === 'dark' ? ['#1e2923', '#0f1714'] : ['#ffffff', '#f1f5f9']}
            style={[styles.vaultCard, { borderColor: colors.border }]}
          >
            <View style={styles.vaultHeader}>
              <Text style={[styles.smallLabel, { color: colors.textDim }]}>{t.current_liquidity}</Text>
              <Zap size={14} color={colors.gold} fill={colors.gold} />
            </View>
            <Text style={[styles.balanceValue, { color: colors.text }]}>GH₵ {profile?.wallet_balance?.toLocaleString() || '0.00'}</Text>
          </LinearGradient>

          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: colors.textDim }]}>{t.trans_amount}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={colors.textDim}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                selectionColor={colors.primary}
              />
              <View style={[styles.currencyBadge, { backgroundColor: colors.primary + '10' }]}>
                <Text style={[styles.currencyText, { color: colors.primary }]}>CEDIS</Text>
              </View>
            </View>
          </View>

          <BouncyTap
            onPress={handleAction}
            disabled={isProcessing || !amount}
            style={{ marginTop: 20 }}
          >
            <LinearGradient
              colors={[colors.primary, "#059669"]}
              style={styles.mainBtnPremium}
            >
              {isProcessing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.mainBtnText}>{t.initiate_transfer}</Text>
                  <ChevronRight size={18} color="#000" strokeWidth={3} />
                </View>
              )}
            </LinearGradient>
          </BouncyTap>

          <View style={styles.footerNote}>
            <ShieldCheck size={14} color={colors.textDim} />
            <Text style={[styles.footerText, { color: colors.textDim }]}>{t.encrypted_channel}</Text>
          </View>

          <View style={styles.devBox}>
             <FlaskConical size={12} color={colors.gold} />
             <Text style={[styles.devText, { color: colors.gold }]}>{t.simulation_available}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { height: 48, width: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 32, borderWidth: 1 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successIconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  successTitle: { fontFamily: 'Display-Bold', fontSize: 32, marginBottom: 12, textAlign: 'center' },
  successSub: { textAlign: 'center', marginBottom: 48, fontSize: 15, lineHeight: 22, fontFamily: 'Display-Bold' },
  returnBtn: { paddingHorizontal: 32, paddingVertical: 18, borderRadius: 20, borderWidth: 1 },
  returnBtnText: { fontWeight: '900', fontSize: 11, letterSpacing: 2, fontFamily: 'Display-Bold' },
  vaultCard: { borderRadius: 28, padding: 24, marginBottom: 40, borderWidth: 1 },
  vaultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  smallLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 3, fontFamily: 'Display-Bold' },
  balanceValue: { fontFamily: 'Display-Bold', fontSize: 28 },
  inputSection: { marginBottom: 32 },
  label: { fontWeight: '900', fontSize: 10, letterSpacing: 3, marginBottom: 16, marginLeft: 4, fontFamily: 'Display-Bold' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, borderWidth: 1, paddingHorizontal: 24, height: 72 },
  input: { flex: 1, fontFamily: 'Display-Bold', fontSize: 28, padding: 0 },
  currencyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  currencyText: { fontSize: 9, fontWeight: '900', letterSpacing: 1, fontFamily: 'Display-Bold' },
  mainBtnPremium: { height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mainBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1.5, fontFamily: 'Display-Bold' },
  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40, opacity: 0.4 },
  footerText: { fontSize: 8, fontWeight: 'bold', letterSpacing: 1, fontFamily: 'Display-Bold' },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000, alignItems: 'center', justifyContent: 'center' },
  overlayText: { marginTop: 24, fontWeight: '900', letterSpacing: 3, fontSize: 10, fontFamily: 'Display-Bold' },
  devBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, opacity: 0.3 },
  devText: { fontSize: 8, fontWeight: 'bold', letterSpacing: 1, fontFamily: 'Display-Bold' }
});
