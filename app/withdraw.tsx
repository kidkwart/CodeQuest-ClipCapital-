import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Alert, Platform, ActivityIndicator, KeyboardAvoidingView, TextInput, Vibration } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useProfile, useMyWithdrawals, useRequestWithdrawal } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, Wallet, History, Clock, CheckCircle2, AlertCircle, Landmark, ArrowRight, Plus, ChevronRight, Zap } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useTheme } from "@/context/theme-context";

export default function WithdrawScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: withdrawals, isLoading: loadingHistory, refetch } = useMyWithdrawals();
  const request = useRequestWithdrawal();

  const [amount, setAmount] = useState("");
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const isPrivate = profile?.privacy_mode_enabled ?? false;
  const balance = profile?.wallet_balance || 0;

  const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
  const remainingBalance = balance - parsedAmount;

  const handleRequest = async () => {
    setStatusMessage({ text: "", type: "" });

    if (!profile?.account_number) {
      Alert.alert(
        "Institutional Requirement",
        "Please configure your Payout Protocol in Settings before initiating a liquidation.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Settings", onPress: () => router.push("/settings") }
        ]
      );
      return;
    }

    if (parsedAmount < 5) {
      setStatusMessage({ text: "Minimum liquidation amount is GH₵ 5.00", type: "error" });
      return;
    }

    if (parsedAmount > balance) {
      setStatusMessage({ text: "Insufficient liquidity in your vault.", type: "error" });
      return;
    }

    try {
      await request.mutateAsync({
        amount: parsedAmount,
        bank_name: profile.bank_name || "MTN",
        account_number: profile.account_number,
        account_name: profile.account_name || profile.display_name
      });

      setAmount("");
      setStatusMessage({ text: "Liquidation request received. Processing...", type: "success" });
      Vibration.vibrate(Platform.OS === 'ios' ? 0 : 20);
      Alert.alert("Request Received", "Your liquidation protocol has been initiated. Our team will verify and process shortly.");
      refetch();
    } catch (e: any) {
      console.error("Withdrawal Error:", e);
      setStatusMessage({ text: e.message || "Protocol failed. Check connection.", type: "error" });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={loadingHistory || loadingProfile} tintColor={colors.primary} onRefresh={refetch} />}
        >
          <View style={{ paddingHorizontal: 24 }}>
            <BouncyTap onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <ArrowLeft size={20} color={colors.text} />
            </BouncyTap>

            <PremiumHeader title="Withdraw" subtitle="Liquidate Capital" />

            {/* Account Card */}
            <LinearGradient
              colors={theme === 'dark' ? ['#1e2923', '#0f1714'] : ['#ffffff', '#f1f5f9']}
              style={[styles.accountCard, { borderColor: colors.border }]}
            >
              <View style={{ zIndex: 2 }}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardLabel, { color: colors.textMuted }]}>PAYOUT DESTINATION</Text>
                  <ShieldCheck size={14} color={colors.primary} />
                </View>
                {profile?.account_number ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.bankName, { color: colors.text }]}>{profile.bank_name?.toUpperCase()}</Text>
                    <Text style={[styles.accNumber, { color: colors.text }]}>{profile.account_number}</Text>
                    <Text style={[styles.accName, { color: colors.primary }]}>{profile.account_name || profile.display_name}</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => router.push("/settings")} style={[styles.setupBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <Text style={[styles.setupText, { color: colors.text }]}>Setup Payout Account</Text>
                    <ChevronRight size={14} color={colors.text} />
                  </TouchableOpacity>
                )}
              </View>
              <Landmark size={140} color={colors.text} style={[styles.cardIcon, { opacity: theme === 'dark' ? 0.05 : 0.02 }]} />
            </LinearGradient>

            {/* Balance Preview */}
            <View style={styles.balanceRow}>
              <View style={styles.balanceInfo}>
                <Text style={[styles.balanceLabel, { color: colors.textDim }]}>AVAILABLE LIQUIDITY</Text>
                <Text style={[styles.balanceValue, { color: colors.text }]}>
                  {isPrivate ? "••••••" : `GH₵ ${balance.toLocaleString()}`}
                </Text>
              </View>
              <BouncyTap onPress={() => router.push("/topup")}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.premiumAddBtn}
                >
                  <Plus size={14} color="#000" strokeWidth={3} />
                  <Text style={styles.premiumAddBtnText}>DEPOSIT</Text>
                </LinearGradient>
              </BouncyTap>
            </View>

            {/* Withdrawal Form */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textDim }]}>Withdrawal Protocol</Text>
              <Card style={[styles.formCard, { backgroundColor: colors.cardBg }]}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>AMOUNT TO LIQUIDATE (GHS)</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                     <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="0.00"
                        placeholderTextColor={colors.textDim}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        selectionColor={colors.primary}
                     />
                     <Zap size={18} color={colors.gold} fill={colors.gold} style={{ opacity: 0.5 }} />
                  </View>
                </View>

                {parsedAmount > 0 && (
                  <View style={[styles.calcBox, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '15' }]}>
                    <View style={styles.calcRow}>
                      <Text style={[styles.calcLabel, { color: colors.textMuted }]}>Vault Balance After Protocol</Text>
                      <Text style={[styles.calcValue, { color: colors.primary }, remainingBalance < 0 && { color: colors.destructive }]}>
                        GH₵ {remainingBalance.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}

                {statusMessage.text !== "" && (
                  <View style={[styles.statusBox, statusMessage.type === 'success' ? styles.statusSuccess : styles.statusError]}>
                    {statusMessage.type === 'success' ? <CheckCircle2 size={16} color={colors.primary} /> : <AlertCircle size={16} color={colors.destructive} />}
                    <Text style={[styles.statusText, statusMessage.type === 'success' ? { color: colors.primary } : { color: colors.destructive }]}>
                      {statusMessage.text}
                    </Text>
                  </View>
                )}

                <BouncyTap onPress={handleRequest} disabled={request.isPending || !amount}>
                   <LinearGradient
                     colors={['#10b981', '#059669']}
                     style={styles.mainConfirmBtn}
                   >
                     {request.isPending ? (
                       <ActivityIndicator color="#000" />
                     ) : (
                       <Text style={styles.mainConfirmBtnText}>CONFIRM LIQUIDATION</Text>
                     )}
                   </LinearGradient>
                </BouncyTap>
              </Card>
            </View>

            {/* History */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <History size={12} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textDim }]}>Liquidation History</Text>
              </View>

              {(withdrawals ?? []).length === 0 ? (
                <View style={styles.emptyState}>
                   <Clock size={40} color={colors.textDim} />
                   <Text style={[styles.emptyText, { color: colors.text }]}>No liquidation records found.</Text>
                </View>
              ) : (
                withdrawals?.map((w) => (
                  <Card key={w.id} style={[styles.historyCard, { backgroundColor: colors.cardBg }]}>
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyAmount, { color: colors.text }]}>GH₵ {w.amount.toLocaleString()}</Text>
                      <Text style={[styles.historyDate, { color: colors.textDim }]}>{new Date(w.created_at).toLocaleDateString('en-GB')}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: w.status === 'completed' ? colors.primary + '15' : colors.gold + '15' }]}>
                      <Text style={[styles.statusBadgeText, { color: w.status === 'completed' ? colors.primary : colors.gold }]}>
                        {w.status.toUpperCase()}
                      </Text>
                    </View>
                  </Card>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Add missing ShieldCheck import
import { ShieldCheck } from "lucide-react-native";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c0a' },
  scrollContent: { paddingTop: 60, paddingBottom: 60 },
  headerBtn: { height: 48, width: 48, borderRadius: 16, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', marginBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  accountCard: { padding: 24, borderRadius: 28, overflow: 'hidden', marginBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { color: 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: 9, letterSpacing: 3 },
  bankName: { color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  accNumber: { fontFamily: 'Display-Bold', color: 'white', fontSize: 28, marginTop: 4 },
  accName: { color: '#10b981', fontWeight: 'bold', fontSize: 10, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 },
  cardIcon: { position: 'absolute', right: -30, bottom: -30, opacity: 0.05, transform: [{ rotate: '-10deg' }] },
  setupBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  setupText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, paddingHorizontal: 8 },
  balanceInfo: { gap: 6 },
  balanceLabel: { color: 'rgba(252,252,252,0.3)', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  balanceValue: { color: 'white', fontFamily: 'Display-Bold', fontSize: 24 },
  premiumAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  premiumAddBtnText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  section: { marginBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginLeft: 8 },
  sectionTitle: { color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' },
  formCard: { padding: 24, backgroundColor: '#0f1714', borderRadius: 28 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { color: '#7d8a84', fontSize: 10, fontWeight: '900', marginBottom: 16, letterSpacing: 2 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, height: 64 },
  input: { flex: 1, fontFamily: 'Display-Bold', color: 'white', fontSize: 24, padding: 0 },
  calcBox: { padding: 16, backgroundColor: 'rgba(16,185,129,0.03)', borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(16,185,129,0.1)' },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calcLabel: { color: '#7d8a84', fontSize: 11, fontWeight: 'bold' },
  calcValue: { color: '#10b981', fontSize: 12, fontWeight: '900' },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1 },
  statusError: { backgroundColor: '#ef444410', borderColor: '#ef444430' },
  statusSuccess: { backgroundColor: '#10b98110', borderColor: '#10b98130' },
  statusText: { fontSize: 12, fontWeight: 'bold', flex: 1 },
  mainConfirmBtn: { height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  mainConfirmBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 2 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, marginBottom: 12, backgroundColor: '#0f1714', borderRadius: 20 },
  historyInfo: { gap: 6 },
  historyAmount: { color: 'white', fontFamily: 'Display-Bold', fontSize: 18 },
  historyDate: { color: '#405045', fontSize: 10, fontWeight: '900' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  emptyState: { paddingVertical: 40, alignItems: 'center', opacity: 0.3 },
  emptyText: { color: 'white', fontWeight: 'bold', marginTop: 16, fontSize: 13, fontStyle: 'italic' }
});
