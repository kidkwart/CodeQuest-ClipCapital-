import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Keyboard, Switch, RefreshControl, Modal, TouchableWithoutFeedback } from "react-native";
import { useProfile, useLoans, useApplyLoan, useClipScore, useRecordRepayment } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { Landmark, Zap, AlertCircle, CheckCircle2, Calendar, Info, ArrowLeft, Clock, CreditCard, Wallet, X, ArrowRight, Smartphone, ChevronRight } from "lucide-react-native";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { Paystack } from 'react-native-paystack-webview';

export default function LoansScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: loans, isLoading: isLoansLoading, refetch } = useLoans();
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

  // 1. Fixed Multiplier (5x Score)
  const currentScore = score || 100;
  const maxLoan = currentScore * 5;
  const interestRate = 0.15;

  const activeLoan = loans?.find(l => l.status === 'approved' || l.status === 'repaying');
  const hasPendingLoan = loans?.some(l => l.status === 'pending');

  // If loan is approved/repaying but balance is 0, it's effectively gone
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
        status: 'confirmed' // Always confirmed if we get here
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
      // Mobile Money via Paystack
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
                {
                  text: "REAL PAYSTACK",
                  onPress: () => setShowPaystack(true)
                },
                {
                  text: "SIMULATION (TEST)",
                  onPress: () => {
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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Paystack Layer */}
      {showPaystack && Platform.OS !== 'web' && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: '#080c0a' }]}>
          <Paystack
            paystackKey={PAYSTACK_KEY}
            amount={(parseFloat(repayAmount.replace(/[^0-9.]/g, '')) || 0) * 100}
            billingEmail={profile?.email || "customer@clipcapital.com"}
            activityIndicatorColor="#10b981"
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
          refreshControl={<RefreshControl refreshing={isLoansLoading} onRefresh={refetch} tintColor="#10b981" progressViewOffset={Platform.OS === 'ios' ? 110 : 0} />}
        >
          <View style={{ paddingHorizontal: 24 }}>
            <PremiumHeader title="Credit" subtitle="Institutional Capital" />

            {/* ACTIVE LOAN CARD */}
            {currentActiveLoan ? (
               <Card style={styles.activeLoanCard}>
                  <View style={styles.activeHeader}>
                     <View style={styles.activeLabelRow}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.activeTag}>ACTIVE LOAN FACILITY</Text>
                     </View>
                     <Text style={styles.remainingDays}>
                        {getRemainingDays(currentActiveLoan.disbursed_at, currentActiveLoan.duration_days || 30)} Days Left
                     </Text>
                  </View>

                  <Text style={styles.activeAmount}>
                     {isPrivate ? "••••••" : `GH₵ ${(currentActiveLoan.balance || 0).toLocaleString()}`}
                  </Text>
                  <Text style={styles.activeSub}>Total Remaining Balance</Text>

                  <View style={styles.activeDetails}>
                     <View style={styles.detailItem}>
                        <Clock size={12} color="#7d8a84" />
                        <Text style={styles.detailText}>Due: {new Date(new Date(currentActiveLoan.disbursed_at || Date.now()).getTime() + (currentActiveLoan.duration_days || 30) * 86400000).toLocaleDateString('en-GB')}</Text>
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
              <LinearGradient colors={['#1e2923', '#0f1714']} style={styles.limitCard}>
                <View style={styles.limitHeader}>
                  <View>
                    <Text style={styles.limitLabel}>AVAILABLE CREDIT</Text>
                    <Text style={styles.limitAmount}>{isPrivate ? "••••••" : `GH₵ ${maxLoan.toLocaleString()}`}</Text>
                  </View>
                  <View style={styles.scoreBadge}>
                    <Zap size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.scoreText}>{currentScore} Score</Text>
                  </View>
                </View>
                <View style={styles.progressContainer}><View style={[styles.progressBar, { width: '100%' }]} /></View>
                <Text style={styles.limitHint}>Boost your ClipScore by logging sales and paying on time.</Text>
              </LinearGradient>
            )}

            {/* Application Section */}
            {!currentActiveLoan && (
               <View style={styles.section}>
               <Text style={styles.sectionTitle}>Request New Credit</Text>
               <Card style={styles.formCard}>
                 <View style={styles.inputGroup}>
                   <Text style={styles.inputLabel}>Amount (GH₵)</Text>
                   <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#5a6b69" keyboardType="numeric" value={amount} onChangeText={setAmount} />
                 </View>
                 <View style={styles.inputGroup}>
                   <Text style={styles.inputLabel}>Business Purpose</Text>
                   <TextInput style={styles.input} placeholder="e.g. New Equipment" placeholderTextColor="#5a6b69" value={purpose} onChangeText={setPurpose} />
                 </View>

                 {parsedAmount > 0 && (
                   <View style={styles.estimateBox}>
                     <View style={styles.estimateRow}>
                       <Text style={styles.estimateLabel}>Interest (15%)</Text>
                       <Text style={styles.estimateValue}>+ GH₵ {interestAmount.toLocaleString()}</Text>
                     </View>
                     <View style={styles.estimateRow}>
                       <Text style={styles.estimateLabel}>Total to Repay</Text>
                       <Text style={styles.totalValue}>GH₵ {totalRepayable.toLocaleString()}</Text>
                     </View>
                   </View>
                 )}

                 <View style={styles.termsRow}>
                    <Switch value={agreed} onValueChange={setAgreed} trackColor={{ false: "#1a211e", true: "#10b981" }} thumbColor="#fff" />
                    <Text style={styles.termsText}>I agree to the credit terms.</Text>
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

            {/* History */}
            <View style={[styles.section, { marginBottom: 60 }]}>
              <View style={styles.sectionHeader}>
                <Calendar size={14} color="#10b981" />
                <Text style={styles.sectionTitle}>Credit History</Text>
              </View>
              {(!loans || loans.length === 0) ? (
                <View style={styles.emptyState}>
                   <Info size={32} color="#405045" /><Text style={styles.emptyText}>No history found.</Text>
                </View>
              ) : (
                loans.map((loan) => (
                  <Card key={loan.id} style={styles.historyCard}>
                    <View style={{ flex: 1 }}>
                       <Text style={styles.historyPurpose}>{loan.purpose || "Credit Line"}</Text>
                       <Text style={styles.historyDate}>{new Date(loan.created_at).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                       <Text style={styles.historyAmount}>GH₵ {loan.amount?.toLocaleString()}</Text>
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

      {/* REPAYMENT MODAL */}
      <Modal visible={showRepayModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ width: '100%' }}
            >
              <Card style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Repay Loan</Text>
                  <TouchableOpacity onPress={() => setShowRepayModal(false)}>
                    <X color="#7d8a84" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount to Repay (GH₵)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#405045"
                    keyboardType="numeric"
                    value={repayAmount}
                    onChangeText={setRepayAmount}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  <TouchableOpacity
                    style={{ marginTop: 8 }}
                    onPress={() => {
                      setRepayAmount(currentActiveLoan?.balance?.toString() || "0");
                      Keyboard.dismiss();
                    }}
                  >
                    <Text style={{ color: '#10b981', fontSize: 11, fontWeight: 'bold' }}>PAY FULL BALANCE: GH₵ {currentActiveLoan?.balance?.toLocaleString()}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payment Method</Text>
                  <View style={{ gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => { setRepayMethod('wallet'); Keyboard.dismiss(); }}
                      style={[styles.methodBtn, repayMethod === 'wallet' && styles.methodBtnActive]}
                    >
                      <Wallet size={18} color={repayMethod === 'wallet' ? "#10b981" : "#7d8a84"} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.methodTitle, repayMethod === 'wallet' && { color: '#10b981' }]}>Wallet Balance</Text>
                        <Text style={styles.methodSub}>Available: GH₵ {profile?.wallet_balance?.toLocaleString()}</Text>
                      </View>
                      {repayMethod === 'wallet' && <CheckCircle2 size={16} color="#10b981" />}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => { setRepayMethod('momo'); Keyboard.dismiss(); }}
                      style={[styles.methodBtn, repayMethod === 'momo' && styles.methodBtnActive]}
                    >
                      <Smartphone size={18} color={repayMethod === 'momo' ? "#10b981" : "#7d8a84"} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.methodTitle, repayMethod === 'momo' && { color: '#10b981' }]}>Mobile Money</Text>
                        <Text style={styles.methodSub}>Instant Payout</Text>
                      </View>
                      {repayMethod === 'momo' && <CheckCircle2 size={16} color="#10b981" />}
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
  container: { flex: 1, backgroundColor: "#080c0a" },
  scrollContent: { paddingTop: 60, paddingBottom: 120 },
  headerBtn: { marginLeft: 16, height: 44, width: 44, borderRadius: 14, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  limitCard: { padding: 32, borderRadius: 32, marginBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  activeLoanCard: { padding: 24, borderRadius: 28, marginBottom: 32, backgroundColor: '#0f1714', borderWidth: 1, borderColor: '#10b98140' },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  activeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  activeTag: { color: '#10b981', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  remainingDays: { color: '#f59e0b', fontSize: 12, fontWeight: 'bold' },
  activeAmount: { color: 'white', fontFamily: 'Display-Bold', fontSize: 36 },
  activeSub: { color: '#7d8a84', fontSize: 12, marginTop: 4 },
  activeDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: '#7d8a84', fontSize: 11, fontWeight: 'bold' },
  premiumRepayBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  repayBtnText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  limitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  limitLabel: { color: 'rgba(255,255,255,0.5)', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  limitAmount: { color: 'white', fontFamily: 'Display-Bold', fontSize: 32, marginTop: 4 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100 },
  scoreText: { color: '#f59e0b', fontSize: 10, fontWeight: 'bold' },
  progressContainer: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 16 },
  progressBar: { height: '100%', backgroundColor: '#10b981', borderRadius: 2 },
  limitHint: { color: '#7d8a84', fontSize: 11, lineHeight: 18 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginLeft: 8 },
  sectionTitle: { color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' },
  formCard: { padding: 24, backgroundColor: '#0f1714', borderRadius: 28 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: '#7d8a84', fontSize: 10, fontWeight: '900', marginBottom: 12, letterSpacing: 2 },
  input: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 18, borderRadius: 16, color: '#fff', fontSize: 24, fontWeight: 'bold', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', fontFamily: 'Display-Bold' },
  estimateBox: { backgroundColor: 'rgba(16,185,129,0.05)', padding: 20, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(16,185,129,0.1)' },
  estimateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  estimateLabel: { color: '#7d8a84', fontSize: 12, fontWeight: '600' },
  estimateValue: { color: '#fcfcfc', fontSize: 13, fontWeight: 'bold' },
  totalValue: { color: '#10b981', fontSize: 18, fontFamily: 'Display-Bold' },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingHorizontal: 4 },
  termsText: { color: '#7d8a84', fontSize: 11, flex: 1 },
  mainBtnPremium: {
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10
  },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mainBtnText: { color: '#000', fontFamily: 'Display-Bold', fontSize: 14, letterSpacing: 1 },
  statusBox: { padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  statusError: { backgroundColor: '#ef444410', borderColor: '#ef444430' },
  statusSuccess: { backgroundColor: '#10b98110', borderColor: '#10b98130' },
  statusText: { fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  historyCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, marginBottom: 12, backgroundColor: '#0f1714', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  historyPurpose: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  historyDate: { color: '#7d8a84', fontSize: 11, marginTop: 4 },
  historyAmount: { color: 'white', fontFamily: 'Display-Bold', fontSize: 16, marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 9, fontWeight: '900' },
  emptyState: { alignItems: 'center', paddingVertical: 40, opacity: 0.5 },
  emptyText: { color: '#7d8a84', fontSize: 13, marginTop: 12, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end', padding: 16 },
  modalContent: { padding: 32, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { color: 'white', fontFamily: 'Display-Bold', fontSize: 24 },
  methodBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'transparent' },
  methodBtnActive: { borderColor: '#10b98130', backgroundColor: 'rgba(16,185,129,0.05)' },
  methodTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  methodSub: { color: '#7d8a84', fontSize: 11, marginTop: 2 }
});
