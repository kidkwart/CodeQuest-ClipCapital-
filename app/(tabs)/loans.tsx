import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Keyboard, Switch, RefreshControl, Modal, TouchableWithoutFeedback } from "react-native";
import { useProfile, useLoans, useApplyLoan, useClipScore, useRecordRepayment, useSystemSettings } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { Landmark, Zap, AlertCircle, CheckCircle2, Calendar, Info, ArrowLeft, Clock, CreditCard, Wallet, X, ArrowRight, Smartphone, ChevronRight } from "lucide-react-native";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { Paystack } from 'react-native-paystack-webview';
import { useTheme } from "@/context/theme-context";

export default function LoansScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { data: profile } = useProfile();
  const { data: loans, isLoading: isLoansLoading, refetch } = useLoans();
  const { settings } = useSystemSettings();
  const { score } = useClipScore();
  const applyLoan = useApplyLoan();
  const recordRepayment = useRecordRepayment();

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Repayment State
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState<"wallet" | "momo">("wallet");
  const [showPaystack, setShowPaystack] = useState(false);

  const isPrivate = profile?.privacy_mode_enabled ?? false;
  const PAYSTACK_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_824b3afe0f0c6cdd1bc0e053adb97f56499796a3";

  // Dynamic Interest Rate from DB
  const currentScore = score || 100;
  const maxLoan = currentScore * 5;
  const rawRate = settings.data?.interest_rate ?? 15;
  const interestRate = rawRate / 100;

  const activeLoan = loans?.find(l => l.status === 'approved' || l.status === 'repaying');
  const hasPendingLoan = loans?.some(l => l.status === 'pending');

  const isActuallyActive = activeLoan && (activeLoan.balance || 0) > 0;
  const currentActiveLoan = isActuallyActive ? activeLoan : null;

  const getRemainingDays = (disbursedAt: string, durationDays: number) => {
    if (!disbursedAt) return durationDays;
    const start = new Date(disbursedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, durationDays - diffDays);
  };

  const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
  const interestAmount = parsedAmount * interestRate;
  const totalRepayable = parsedAmount + interestAmount;

  const handleApply = async () => {
    setStatusMessage({ text: "", type: "" });
    Keyboard.dismiss();

    if (!amount || parsedAmount <= 0) {
      setStatusMessage({ text: "Please enter a valid amount.", type: "error" });
      return;
    }

    if (!purpose.trim()) {
      setStatusMessage({ text: "Please state the purpose of this credit.", type: "error" });
      return;
    }

    if (!agreed) {
      setStatusMessage({ text: "Please agree to the Terms of Service.", type: "error" });
      return;
    }

    if (currentActiveLoan) {
      Alert.alert("Action Blocked", "You already have an active loan facility.");
      return;
    }

    if (hasPendingLoan) {
      Alert.alert("Application Pending", "Your previous request is still under review.");
      return;
    }

    if (parsedAmount > maxLoan) {
      setStatusMessage({ text: `Limit Exceeded: Max is GH₵ ${maxLoan.toLocaleString()}`, type: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      await applyLoan.mutateAsync({
        amount: parsedAmount,
        duration_days: 30,
        purpose: purpose.trim()
      });

      setStatusMessage({ text: "Success! Application sent.", type: "success" });
      setAmount("");
      setPurpose("");
      setAgreed(false);
      Alert.alert("Success", "Credit request sent! It will be reviewed shortly.");
      refetch();
    } catch (e: any) {
      setStatusMessage({ text: e.message || "Failed to submit.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const processRepaymentRecord = async (reference: string, isWallet: boolean) => {
    const amt = parseFloat(repayAmount.replace(/[^0-9.]/g, '')) || 0;
    if (amt <= 0) return;

    try {
      setIsSubmitting(true);
      await recordRepayment.mutateAsync({
        loan_id: currentActiveLoan!.id,
        amount: amt,
        momo_provider: isWallet ? "Wallet" : "Mobile Money",
        momo_reference: reference,
        status: 'confirmed'
      });

      Alert.alert("Success! 🎉", "Your loan balance has been updated.");
      setShowRepayModal(false);
      setRepayAmount("");
      refetch();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Repayment record failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRepayment = async () => {
    Keyboard.dismiss();
    const amt = parseFloat(repayAmount.replace(/[^0-9.]/g, ''));
    if (!amt || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to repay.");
      return;
    }

    if (repayMethod === 'wallet') {
      if ((profile?.wallet_balance || 0) < amt) {
        Alert.alert("Insufficient Funds", "You do not have enough balance in your wallet.");
        return;
      }
      await processRepaymentRecord("WAL-REF-" + Date.now(), true);
    } else {
      if (Platform.OS === 'web') {
        setIsSubmitting(true);
        setTimeout(() => {
          processRepaymentRecord("SIM-REF-" + Date.now(), false);
        }, 1500);
      } else {
        Alert.alert(
            "Institutional Gateway",
            "Select your preferred funding protocol:",
            [
                { text: "REAL PAYSTACK", onPress: () => setShowPaystack(true) },
                { text: "SIMULATION (TEST)", onPress: () => {
                    setIsSubmitting(true);
                    setTimeout(() => {
                      processRepaymentRecord("IOS-SIM-REF-" + Date.now(), false);
                    }, 1500);
                  }
                },
                { text: "CANCEL", style: "cancel" }
            ]
        );
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'repaying': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      case 'completed':
      case 'paid': return '#3b82f6';
      default: return '#7d8a84';
    }
  };

  if (isLoansLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {showPaystack && Platform.OS !== 'web' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: colors.background }]}>
          <Paystack
            paystackKey={PAYSTACK_KEY}
            amount={(parseFloat(repayAmount.replace(/[^0-9.]/g, '')) || 0) * 100}
            billingEmail={profile?.email || "customer@clipcapital.com"}
            activityIndicatorColor={colors.primary}
            onCancel={() => setShowPaystack(false)}
            onSuccess={(res: any) => {
               setShowPaystack(false);
               processRepaymentRecord(res.transactionRef.reference, false);
            }}
            autoStart={true}
          />
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isLoansLoading} onRefresh={refetch} tintColor={colors.primary} progressViewOffset={Platform.OS === 'ios' ? 110 : 0} />}
        >
          <View style={{ paddingHorizontal: 24 }}>
            <PremiumHeader title="Credit" subtitle="Institutional Capital" />

            {currentActiveLoan ? (
               <Card style={[styles.activeLoanCard, { backgroundColor: colors.cardBg, borderColor: `${colors.primary}40` }]}>
                  <View style={styles.activeHeader}>
                     <View style={styles.activeLabelRow}>
                        <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
                        <Text style={[styles.activeTag, { color: colors.primary }]}>ACTIVE LOAN FACILITY</Text>
                     </View>
                     <Text style={styles.remainingDays}>
                        {getRemainingDays(currentActiveLoan.disbursed_at, currentActiveLoan.duration_days || 30)} Days Left
                     </Text>
                  </View>

                  <Text style={[styles.activeAmount, { color: colors.text }]}>
                     {isPrivate ? "••••••" : `GH₵ ${(currentActiveLoan.balance || 0).toLocaleString()}`}
                  </Text>
                  <Text style={[styles.activeSub, { color: colors.textMuted }]}>Total Remaining Balance</Text>

                  <View style={[styles.activeDetails, { borderTopColor: colors.border }]}>
                     <View style={styles.detailItem}>
                        <Clock size={12} color={colors.textMuted} />
                        <Text style={[styles.detailText, { color: colors.textMuted }]}>Due: {new Date(new Date(currentActiveLoan.disbursed_at || Date.now()).getTime() + (currentActiveLoan.duration_days || 30) * 86400000).toLocaleDateString('en-GB')}</Text>
                     </View>
                     <BouncyTap onPress={() => setShowRepayModal(true)}>
                        <LinearGradient
                          colors={['#10b981', '#059669']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.premiumRepayBtn}
                        >
                           <Text style={styles.repayBtnText}>REPAY NOW</Text>
                        </LinearGradient>
                     </BouncyTap>
                  </View>
               </Card>
            ) : (
              <LinearGradient colors={theme === 'dark' ? ['#1e2923', '#0f1714'] : ['#ffffff', '#f1f5f9']} style={[styles.limitCard, { borderColor: colors.border }]}>
                <View style={styles.limitHeader}>
                  <View>
                    <Text style={[styles.limitLabel, { color: colors.textMuted }]}>AVAILABLE CREDIT</Text>
                    <Text style={[styles.limitAmount, { color: colors.text }]}>{isPrivate ? "••••••" : `GH₵ ${maxLoan.toLocaleString()}`}</Text>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: `${colors.gold}15` }]}>
                    <Zap size={12} color={colors.gold} fill={colors.gold} />
                    <Text style={[styles.scoreText, { color: colors.gold }]}>{currentScore} Score</Text>
                  </View>
                </View>
                <View style={[styles.progressContainer, { backgroundColor: colors.border }]}><View style={[styles.progressBar, { backgroundColor: colors.primary, width: '100%' }]} /></View>
                <Text style={[styles.limitHint, { color: colors.textMuted }]}>Boost your ClipScore by logging sales and paying on time.</Text>
              </LinearGradient>
            )}

            {!currentActiveLoan && (
               <View style={styles.section}>
               <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Request New Credit</Text>
               <Card style={[styles.formCard, { backgroundColor: colors.cardBg }]}>
                 <View style={styles.inputGroup}>
                   <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Amount (GH₵)</Text>
                   <TextInput style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]} placeholder="0.00" placeholderTextColor={colors.textDim} keyboardType="numeric" value={amount} onChangeText={setAmount} />
                 </View>
                 <View style={styles.inputGroup}>
                   <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Business Purpose</Text>
                   <TextInput style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]} placeholder="e.g. New Equipment" placeholderTextColor={colors.textDim} value={purpose} onChangeText={setPurpose} />
                 </View>

                 {parsedAmount > 0 && (
                   <View style={[styles.estimateBox, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}15` }]}>
                     <View style={styles.estimateRow}>
                       <Text style={[styles.estimateLabel, { color: colors.textMuted }]}>Interest ({rawRate}%)</Text>
                       <Text style={[styles.estimateValue, { color: colors.text }]}>+ GH₵ {interestAmount.toLocaleString()}</Text>
                     </View>
                     <View style={styles.estimateRow}>
                       <Text style={[styles.estimateLabel, { color: colors.textMuted }]}>Total to Repay</Text>
                       <Text style={[styles.totalValue, { color: colors.primary }]}>GH₵ {totalRepayable.toLocaleString()}</Text>
                     </View>
                   </View>
                 )}

                 <View style={styles.termsRow}>
                    <Switch value={agreed} onValueChange={setAgreed} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
                    <Text style={[styles.termsText, { color: colors.textMuted }]}>I agree to the credit terms.</Text>
                 </View>

                 {statusMessage.text !== "" && (
                   <View style={[styles.statusBox, statusMessage.type === 'success' ? styles.statusSuccess : styles.statusError]}>
                     <Text style={[styles.statusText, { color: statusMessage.type === 'success' ? '#10b981' : '#ef4444' }]}>{statusMessage.text}</Text>
                   </View>
                 )}

                <TouchableOpacity
                  onPress={handleApply}
                  disabled={isSubmitting || applyLoan.isPending}
                  activeOpacity={0.8}
                >
                   <LinearGradient
                     colors={['#10b981', '#059669']}
                     start={{ x: 0, y: 0 }}
                     end={{ x: 1, y: 1 }}
                     style={styles.mainBtnPremium}
                   >
                     {isSubmitting ? (
                       <ActivityIndicator color="#000" />
                     ) : (
                       <View style={styles.btnContent}>
                         <Text style={styles.mainBtnText}>SUBMIT APPLICATION</Text>
                         <ChevronRight size={18} color="#000" strokeWidth={3} />
                       </View>
                     )}
                   </LinearGradient>
                </TouchableOpacity>
               </Card>
             </View>
            )}

            <View style={[styles.section, { marginBottom: 60 }]}>
              <View style={styles.sectionHeader}>
                <Calendar size={14} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Credit History</Text>
              </View>
              {(!loans || loans.length === 0) ? (
                <View style={styles.emptyState}>
                   <Info size={32} color={colors.textDim} /><Text style={[styles.emptyText, { color: colors.textMuted }]}>No history found.</Text>
                </View>
              ) : (
                loans.map((loan) => (
                  <Card key={loan.id} style={[styles.historyCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                       <Text style={[styles.historyPurpose, { color: colors.text }]}>{loan.purpose || "Credit Line"}</Text>
                       <Text style={[styles.historyDate, { color: colors.textDim }]}>{new Date(loan.created_at).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                       <Text style={[styles.historyAmount, { color: colors.text }]}>GH₵ {loan.amount?.toLocaleString()}</Text>
                       <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(loan.status)}20` }]}>
                          <Text style={[styles.statusBadgeText, { color: getStatusColor(loan.status) }]}>{loan.status?.toUpperCase()}</Text>
                       </View>
                    </View>
                  </Card>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showRepayModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ width: '100%' }}
            >
              <Card style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Repay Loan</Text>
                  <TouchableOpacity onPress={() => setShowRepayModal(false)}>
                    <X color={colors.textDim} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Amount to Repay (GH₵)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                    value={repayAmount}
                    onChangeText={setRepayAmount}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={{ marginTop: 8 }}
                    onPress={() => setRepayAmount(currentActiveLoan?.balance?.toString() || "0")}
                  >
                    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: 'bold' }}>PAY FULL BALANCE: GH₵ {currentActiveLoan?.balance?.toLocaleString()}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Payment Method</Text>
                  <View style={{ gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => setRepayMethod('wallet')}
                      style={[styles.methodBtn, { backgroundColor: colors.surfaceElevated }, repayMethod === 'wallet' && { borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}05`, borderWidth: 1 }]}
                    >
                      <Wallet size={18} color={repayMethod === 'wallet' ? colors.primary : colors.textMuted} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.methodTitle, { color: colors.text }, repayMethod === 'wallet' && { color: colors.primary }]}>Wallet Balance</Text>
                        <Text style={[styles.methodSub, { color: colors.textDim }]}>Available: GH₵ {profile?.wallet_balance?.toLocaleString()}</Text>
                      </View>
                      {repayMethod === 'wallet' && <CheckCircle2 size={16} color={colors.primary} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setRepayMethod('momo')}
                      style={[styles.methodBtn, { backgroundColor: colors.surfaceElevated }, repayMethod === 'momo' && { borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}05`, borderWidth: 1 }]}
                    >
                      <Smartphone size={18} color={repayMethod === 'momo' ? colors.primary : colors.textMuted} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.methodTitle, { color: colors.text }, repayMethod === 'momo' && { color: colors.primary }]}>Mobile Money</Text>
                        <Text style={[styles.methodSub, { color: colors.textDim }]}>Instant Payout</Text>
                      </View>
                      {repayMethod === 'momo' && <CheckCircle2 size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleRepayment}
                  disabled={isSubmitting}
                  style={{ marginTop: 10 }}
                >
                  <LinearGradient colors={['#10b981', '#059669']} style={styles.mainBtnPremium}>
                      {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={styles.mainBtnText}>CONFIRM REPAYMENT</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </Card>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingBottom: 120 },
  limitCard: { padding: 32, borderRadius: 32, marginBottom: 32, borderWidth: 1 },
  activeLoanCard: { padding: 24, borderRadius: 28, marginBottom: 32, borderWidth: 1 },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  activeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
  activeTag: { fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  remainingDays: { color: '#f59e0b', fontSize: 12, fontWeight: 'bold' },
  activeAmount: { fontFamily: 'Display-Bold', fontSize: 36 },
  activeSub: { fontSize: 12, marginTop: 4 },
  activeDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 20, borderTopWidth: 1 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 11, fontWeight: 'bold' },
  premiumRepayBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  repayBtnText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  limitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  limitLabel: { fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  limitAmount: { fontFamily: 'Display-Bold', fontSize: 32, marginTop: 4 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100 },
  scoreText: { fontSize: 10, fontWeight: 'bold' },
  progressContainer: { height: 4, borderRadius: 2, marginBottom: 16 },
  progressBar: { height: '100%', borderRadius: 2 },
  limitHint: { fontSize: 11, lineHeight: 18 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginLeft: 8 },
  sectionTitle: { fontWeight: '900', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' },
  formCard: { padding: 24, borderRadius: 28 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '900', marginBottom: 12, letterSpacing: 2 },
  input: { padding: 18, borderRadius: 16, fontSize: 24, fontWeight: 'bold', borderWidth: 1, fontFamily: 'Display-Bold' },
  estimateBox: { padding: 20, borderRadius: 20, marginBottom: 24, borderWidth: 1 },
  estimateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  estimateLabel: { fontSize: 12, fontWeight: '600' },
  estimateValue: { fontSize: 13, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontFamily: 'Display-Bold' },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingHorizontal: 4 },
  termsText: { fontSize: 11, flex: 1 },
  mainBtnPremium: { height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mainBtnText: { color: '#000', fontFamily: 'Display-Bold', fontSize: 14, letterSpacing: 1 },
  statusBox: { padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  statusError: { backgroundColor: '#ef444410', borderColor: '#ef444430' },
  statusSuccess: { backgroundColor: '#10b98110', borderColor: '#10b98130' },
  statusText: { fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, marginBottom: 12, borderRadius: 20, borderWidth: 1 },
  historyPurpose: { fontWeight: 'bold', fontSize: 14 },
  historyDate: { fontSize: 11, marginTop: 4 },
  historyAmount: { fontFamily: 'Display-Bold', fontSize: 16, marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 9, fontWeight: '900' },
  emptyState: { alignItems: 'center', paddingVertical: 40, opacity: 0.5 },
  emptyText: { fontSize: 13, marginTop: 12, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end', padding: 16 },
  modalContent: { padding: 32, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontFamily: 'Display-Bold', fontSize: 24 },
  methodBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 20, borderWidth: 1 },
  methodTitle: { fontWeight: 'bold', fontSize: 14 },
  methodSub: { fontSize: 11, marginTop: 2 }
});
