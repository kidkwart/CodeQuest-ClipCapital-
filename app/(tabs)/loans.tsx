import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Keyboard, Switch, RefreshControl, Modal, TouchableWithoutFeedback, Dimensions } from "react-native";
import { useProfile, useLoans, useApplyLoan, useClipScore, useRecordRepayment, useSystemSettings } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { Landmark, Zap, AlertCircle, CheckCircle2, Calendar, Info, ArrowLeft, Clock, CreditCard, Wallet, X, ArrowRight, Smartphone, ChevronRight, ShieldCheck, TrendingUp, History } from "lucide-react-native";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { Paystack } from 'react-native-paystack-webview';
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "@/context/language-context";
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KenteBackground } from "@/components/native/effects/kente-pattern";
import { AnimatedNumber } from "@/components/native/animated-number";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeIn,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  withSpring,
  interpolate,
  Extrapolate
} from "react-native-reanimated";
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get("window");

// --- Ambient Credit Particle ---
function LoanParticle({ delay = 0 }: { delay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);

  const startX = useMemo(() => (Math.random() * width) - width / 2, []);
  const startY = useMemo(() => (Math.random() * 400) - 200, []);

  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withSequence(withTiming(0.1, { duration: 2000 }), withTiming(0, { duration: 2000 })),
      -1, false
    ));
    translateY.value = withDelay(delay, withRepeat(
      withTiming(-100, { duration: 10000, easing: Easing.linear }),
      -1, false
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(withTiming(1, { duration: 2000 }), withTiming(0.5, { duration: 2000 })),
      -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: startY,
    marginLeft: startX,
  }));

  return (
    <Animated.View style={style}>
      <TrendingUp size={12} color="#10b981" opacity={0.4} />
    </Animated.View>
  );
}

export default function LoansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const { data: profile } = useProfile();
  const loansQuery = useLoans();
  const loans = loansQuery.data;
  const { settings } = useSystemSettings();
  const { score } = useClipScore();
  const applyLoan = useApplyLoan();
  const recordRepayment = useRecordRepayment();

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Repayment State
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState<"wallet" | "momo">("wallet");
  const [showPaystack, setShowPaystack] = useState(false);

  const isPrivate = profile?.privacy_mode_enabled ?? false;
  const isDark = theme === 'dark';
  const PAYSTACK_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_824b3afe0f0c6cdd1bc0e053adb97f56499796a3";

  // Active Card Pulse
  const cardScale = useSharedValue(1);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    cardScale.value = withRepeat(
      withSequence(withTiming(1.01, { duration: 2500, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 2500 })),
      -1, true
    );
    progressWidth.value = withDelay(500, withSpring(100, { damping: 12 }));
  }, []);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      rotateX.value = interpolate(event.y, [-height / 2, height / 2], [5, -5], Extrapolate.CLAMP);
      rotateY.value = interpolate(event.x, [-width / 2, width / 2], [-5, 5], Extrapolate.CLAMP);
    })
    .onEnd(() => {
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { scale: cardScale.value }
    ]
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`
  }));

  // 1. Fixed Multiplier (10x Score)
  const currentScore = score || 100;
  const maxLoan = currentScore * 10;
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
      loansQuery.refetch();
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
      loansQuery.refetch();
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
      case 'repaying': return colors.primary;
      case 'pending': return '#f59e0b';
      case 'rejected': return colors.destructive;
      case 'completed':
      case 'paid': return '#3b82f6';
      default: return colors.textDim;
    }
  };

  if (loansQuery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KenteBackground />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 10 }).map((_, i) => (
          <LoanParticle key={i} delay={i * 800} />
        ))}
      </View>

      {/* Paystack Layer */}
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
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={loansQuery.isRefetching} onRefresh={() => loansQuery.refetch()} tintColor={colors.primary} progressViewOffset={insets.top + 20} />}
        >
          <View style={{ paddingHorizontal: 20 }}>

            <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.header}>
              <View>
                <View style={styles.supHeaderRow}>
                  <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.supHeaderText, { color: colors.primary }]}>{t.capital_protocol} v2.1</Text>
                </View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t.institutional_credit}</Text>
              </View>
            </Animated.View>

            {/* ACTIVE LOAN CARD / LIMIT CARD with 3D Tilt */}
            <GestureDetector gesture={gesture}>
               <Animated.View entering={FadeInDown.delay(200)} style={animatedCardStyle}>
                  {currentActiveLoan ? (
                     <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.activeLoanCard, { borderColor: colors.primary + '40' }]}>
                        <View style={styles.activeHeader}>
                           <View style={styles.activeLabelRow}>
                              <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
                              <Text style={[styles.activeTag, { color: colors.primary }]}>{t.active_loan_facility}</Text>
                           </View>
                           <Text style={[styles.remainingDays, { color: colors.gold }]}>
                              {getRemainingDays(currentActiveLoan.disbursed_at, currentActiveLoan.duration_days || 30)} {t.days_left}
                           </Text>
                        </View>

                        <View style={{ height: 50, justifyContent: 'center' }}>
                            {isPrivate ? (
                                <Text style={[styles.activeAmount, { color: colors.text, letterSpacing: 8 }]}>••••••</Text>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                    <Text style={{ color: colors.textDim, fontSize: 18, fontFamily: 'Display-Bold', marginRight: 8 }}>GH₵</Text>
                                    <AnimatedNumber
                                        value={currentActiveLoan.balance || 0}
                                        style={[styles.activeAmount, { color: colors.text, marginBottom: 0 }]}
                                    />
                                </View>
                            )}
                        </View>
                        <Text style={[styles.activeSub, { color: colors.textDim }]}>{t.remaining_balance}</Text>

                        <View style={[styles.activeDetails, { borderTopColor: colors.border }]}>
                           <View style={styles.detailItem}>
                              <Clock size={12} color={colors.textDim} />
                              <Text style={[styles.detailText, { color: colors.textDim }]}>{t.due}: {new Date(new Date(currentActiveLoan.disbursed_at || Date.now()).getTime() + (currentActiveLoan.duration_days || 30) * 86400000).toLocaleDateString('en-GB')}</Text>
                           </View>
                           <BouncyTap onPress={() => setShowRepayModal(true)}>
                              <LinearGradient
                                colors={[colors.primary, "#059669"]}
                                style={styles.premiumRepayBtn}
                              >
                                 <Text style={styles.repayBtnText}>{t.repay_now}</Text>
                              </LinearGradient>
                           </BouncyTap>
                        </View>
                     </BlurView>
                  ) : (
                     <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.limitCard, { borderColor: colors.border }]}>
                        <View style={styles.limitHeader}>
                        <View>
                           <Text style={[styles.limitLabel, { color: colors.textDim }]}>{t.available_credit}</Text>
                           <View style={{ height: 44, justifyContent: 'center' }}>
                                {isPrivate ? (
                                    <Text style={[styles.limitAmount, { color: colors.text, letterSpacing: 8 }]}>••••••</Text>
                                ) : (
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                        <Text style={{ color: colors.textDim, fontSize: 16, fontFamily: 'Display-Bold', marginRight: 6 }}>GH₵</Text>
                                        <AnimatedNumber
                                            value={maxLoan}
                                            style={[styles.limitAmount, { color: colors.text, marginBottom: 0 }]}
                                        />
                                    </View>
                                )}
                           </View>
                        </View>
                        <View style={[styles.scoreBadge, { backgroundColor: colors.gold + '15' }]}>
                           <Zap size={12} color={colors.gold} fill={colors.gold} />
                           <Text style={[styles.scoreText, { color: colors.gold }]}>{currentScore} {t.score}</Text>
                        </View>
                        </View>
                        <View style={[styles.progressContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                           <Animated.View style={[styles.progressBar, { backgroundColor: colors.primary }, animatedProgressStyle]} />
                        </View>
                        <Text style={[styles.limitHint, { color: colors.textDim }]}>{t.boost_clipscore_hint}</Text>
                     </BlurView>
                  )}
               </Animated.View>
            </GestureDetector>

            {/* Application Section */}
            {!currentActiveLoan && (
               <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
               <Animated.Text entering={FadeInRight.delay(400)} style={[styles.sectionTitle, { color: colors.textDim }]}>{t.request_credit}</Animated.Text>
               <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.formCard, { borderColor: colors.border }]}>
                 <View style={styles.inputGroup}>
                   <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t.amount} (GH₵)</Text>
                   <TextInput
                    style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: colors.text, borderColor: colors.border }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                 </View>
                 <View style={styles.inputGroup}>
                   <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t.purpose}</Text>
                   <TextInput
                    style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: colors.text, borderColor: colors.border, fontSize: 16 }]}
                    placeholder={t.business_loc_placeholder}
                    placeholderTextColor={colors.textDim}
                    value={purpose}
                    onChangeText={setPurpose}
                  />
                 </View>

                 {parsedAmount > 0 && (
                   <Animated.View entering={FadeIn.duration(400)} style={[styles.estimateBox, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '15' }]}>
                     <View style={styles.estimateRow}>
                       <Text style={[styles.estimateLabel, { color: colors.textDim }]}>{t.interest} ({rawRate}%)</Text>
                       <Text style={[styles.estimateValue, { color: colors.text }]}>+ GH₵ {interestAmount.toLocaleString()}</Text>
                     </View>
                     <View style={styles.estimateRow}>
                       <Text style={[styles.estimateLabel, { color: colors.textDim }]}>{t.total_repay}</Text>
                       <Text style={[styles.totalValue, { color: colors.primary }]}>GH₵ {totalRepayable.toLocaleString()}</Text>
                     </View>
                   </Animated.View>
                 )}

                 <View style={styles.termsRow}>
                    <Switch value={agreed} onValueChange={setAgreed} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
                    <Text style={[styles.termsText, { color: colors.textDim, marginLeft: 8, fontSize: 11 }]}>{t.agree_terms}</Text>
                 </View>

                 {statusMessage.text !== "" && (
                   <Animated.View entering={FadeIn.duration(300)} style={[styles.statusBox, { borderColor: statusMessage.type === 'success' ? colors.primary + '40' : colors.destructive + '40', backgroundColor: (statusMessage.type === 'success' ? colors.primary : colors.destructive) + '10' }]}>
                     <Text style={[styles.statusText, { color: statusMessage.type === 'success' ? colors.primary : colors.destructive }]}>{statusMessage.text.toUpperCase()}</Text>
                   </Animated.View>
                 )}

                <BouncyTap
                  onPress={handleApply}
                  disabled={isSubmitting || applyLoan.isPending}
                  style={{ marginTop: 12 }}
                >
                   <LinearGradient
                     colors={[colors.primary, "#059669"]}
                     style={styles.mainBtnPremium}
                   >
                     {isSubmitting ? (
                       <ActivityIndicator color="#000" />
                     ) : (
                       <View style={styles.btnContent}>
                         <Text style={styles.mainBtnText}>{t.submit_app}</Text>
                         <ChevronRight size={18} color="#000" strokeWidth={3} />
                       </View>
                     )}
                   </LinearGradient>
                </BouncyTap>
               </BlurView>
             </Animated.View>
            )}

            {/* History */}
            <View style={[styles.section, { marginBottom: 60 }]}>
              <View style={styles.sectionHeader}>
                <Animated.Text entering={FadeInRight.delay(400)} style={[styles.sectionTitle, { color: colors.textDim }]}>{t.credit_history}</Animated.Text>
              </View>
              {(!loans || loans.length === 0) ? (
                <Animated.View entering={FadeInDown.delay(500)}>
                  <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.emptyCard, { borderColor: colors.border }]}>
                    <History size={40} color={colors.textDim} />
                    <Text style={[styles.emptyText, { color: colors.textDim }]}>{t.no_history}</Text>
                  </BlurView>
                </Animated.View>
              ) : (
                loans.map((loan, idx) => (
                  <Animated.View
                    key={loan.id}
                    entering={FadeInDown.delay(500 + (idx * 50))}
                    layout={Layout.springify().damping(15)}
                  >
                      <BlurView intensity={isDark ? 15 : 30} tint={isDark ? "dark" : "light"} style={[styles.activityItem, { borderColor: colors.border, marginBottom: 12 }]}>
                        <View style={[styles.activityIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <TrendingUp size={16} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontFamily: 'Display-Bold', fontSize: 13 }} numberOfLines={1}>{loan.purpose || "Credit Line"}</Text>
                            <Text style={{ color: colors.textDim, fontSize: 10, fontFamily: 'Display-Bold', opacity: 0.6 }}>{new Date(loan.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: colors.text, fontFamily: 'Display-Bold', fontSize: 14 }}>
                                GH₵ {loan.amount?.toLocaleString()}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(loan.status)}20` }]}>
                                <Text style={[styles.statusBadgeText, { color: getStatusColor(loan.status) }]}>{loan.status?.toUpperCase()}</Text>
                            </View>
                        </View>
                      </BlurView>
                  </Animated.View>
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
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: '100%' }}>
              <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={[styles.modalContent, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t.repay_now}</Text>
                  <BouncyTap onPress={() => setShowRepayModal(false)}>
                    <X color={colors.textDim} />
                  </BouncyTap>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t.amount} (GH₵)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: colors.text, borderColor: colors.border }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                    value={repayAmount}
                    onChangeText={setRepayAmount}
                  />
                  <TouchableOpacity
                    style={{ marginTop: 12 }}
                    onPress={() => setRepayAmount(currentActiveLoan?.balance?.toString() || "0")}
                  >
                    <Text style={{ color: colors.primary, fontSize: 10, fontFamily: 'Display-Bold' }}>{t.repay_full_balance} {currentActiveLoan?.balance?.toLocaleString()}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t.funding_source}</Text>
                  <View style={{ gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => setRepayMethod('wallet')}
                      style={[styles.methodBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }, repayMethod === 'wallet' && { borderColor: colors.primary, backgroundColor: colors.primary + '05' }]}
                    >
                      <Wallet size={18} color={repayMethod === 'wallet' ? colors.primary : colors.textDim} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.methodTitle, { color: colors.text, fontFamily: 'Display-Bold' }]}>{t.wallet.toUpperCase()}</Text>
                        <Text style={[styles.methodSub, { color: colors.textDim }]}>{t.available_liquidity}: GH₵ {profile?.wallet_balance?.toLocaleString()}</Text>
                      </View>
                      {repayMethod === 'wallet' && <CheckCircle2 size={16} color={colors.primary} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setRepayMethod('momo')}
                      style={[styles.methodBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }, repayMethod === 'momo' && { borderColor: colors.primary, backgroundColor: colors.primary + '05' }]}
                    >
                      <Smartphone size={18} color={repayMethod === 'momo' ? colors.primary : colors.textDim} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.methodTitle, { color: colors.text, fontFamily: 'Display-Bold' }]}>MOBILE MONEY</Text>
                        <Text style={[styles.methodSub, { color: colors.textDim }]}>INSTANT DEBIT</Text>
                      </View>
                      {repayMethod === 'momo' && <CheckCircle2 size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  </View>
                </View>

                <BouncyTap onPress={handleRepayment} disabled={isSubmitting} style={{ marginTop: 12 }}>
                  <LinearGradient colors={[colors.primary, "#059669"]} style={styles.mainBtnPremium}>
                      {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={styles.mainBtnText}>{t.repay_now}</Text>}
                  </LinearGradient>
                </BouncyTap>
              </BlurView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 140 },
  header: { marginBottom: 32, paddingHorizontal: 4, marginTop: 10 },
  supHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  supHeaderText: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1.5, opacity: 0.8 },
  headerTitle: { fontFamily: 'Display-Bold', fontSize: 30, letterSpacing: -0.5 },
  limitCard: { padding: 24, borderRadius: 28, marginBottom: 32, borderWidth: 1, overflow: 'hidden' },
  activeLoanCard: { padding: 24, borderRadius: 28, marginBottom: 32, borderWidth: 1, overflow: 'hidden' },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  activeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
  activeTag: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1.5 },
  remainingDays: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 1 },
  activeAmount: { fontFamily: 'Display-Bold', fontSize: 36, letterSpacing: -1 },
  activeSub: { fontFamily: 'Display-Bold', fontSize: 9, marginTop: 4, opacity: 0.6, letterSpacing: 1 },
  activeDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 20, borderTopWidth: 1 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 0.5 },
  premiumRepayBtn: { paddingHorizontal: 16, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  repayBtnText: { color: '#000', fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 1 },
  limitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  limitLabel: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 2 },
  limitAmount: { fontFamily: 'Display-Bold', fontSize: 32, marginTop: 4, letterSpacing: -0.5 },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100 },
  scoreText: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1 },
  progressContainer: { height: 4, borderRadius: 2, marginBottom: 16, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 2 },
  limitHint: { fontFamily: 'Display-Bold', fontSize: 10, opacity: 0.6, lineHeight: 16 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 1.5 },
  formCard: { padding: 24, borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 },
  input: { paddingHorizontal: 18, height: 60, borderRadius: 16, fontSize: 22, borderWidth: 1, fontFamily: 'Display-Bold' },
  estimateBox: { padding: 20, borderRadius: 20, marginBottom: 24, borderWidth: 1 },
  estimateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  estimateLabel: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 0.5 },
  estimateValue: { fontFamily: 'Display-Bold', fontSize: 12 },
  totalValue: { fontFamily: 'Display-Bold', fontSize: 16 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  termsText: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 0.5 },
  mainBtnPremium: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mainBtnText: { color: '#000', fontFamily: 'Display-Bold', fontSize: 13, letterSpacing: 1 },
  statusBox: { padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  statusText: { fontFamily: 'Display-Bold', fontSize: 11, textAlign: 'center', letterSpacing: 1 },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 22, borderWidth: 1, gap: 12, overflow: 'hidden' },
  activityIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusBadgeText: { fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 1 },
  emptyCard: { padding: 40, alignItems: 'center', gap: 12, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed' },
  emptyText: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end', padding: 16 },
  modalContent: { padding: 32, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontFamily: 'Display-Bold', fontSize: 24, letterSpacing: -0.5 },
  methodBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 18, borderWidth: 1 },
  methodTitle: { fontSize: 13, letterSpacing: 1 },
  methodSub: { fontFamily: 'Display-Bold', fontSize: 9, opacity: 0.6, marginTop: 2, letterSpacing: 0.5 }
});
