import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet, Modal, Alert, Share, Platform, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useGroup, useGroupMembers, useGroupContributions, useRecordContribution, useProfile, useLeaveGroup } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { ArrowLeft, Users, Check, Clock, Wallet, X, Zap, AlertCircle, Share2, Crown, Plus, LogOut, Info, ChevronRight, BarChart3, TrendingUp, ShieldCheck } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "@/context/language-context";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KenteBackground } from "@/components/native/effects/kente-pattern";
import { Button } from "@/components/native/button";
import { AnimatedNumber } from "@/components/native/animated-number";
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get("window");

export default function GroupDetails() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const { data: profile } = useProfile();

  const id = Array.isArray(groupId) ? groupId[0] : groupId;

  const groupQuery = useGroup(id as string);
  const membersQuery = useGroupMembers(id as string);
  const contributionsQuery = useGroupContributions(id as string);
  const record = useRecordContribution();
  const leave = useLeaveGroup();

  const [showPayModal, setShowPayModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const isPrivate = profile?.privacy_mode_enabled ?? false;
  const isDark = theme === 'dark';

  if (groupQuery.isError) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <AlertCircle size={48} color={colors.destructive} />
        <Text style={{ color: colors.text, marginTop: 16, fontSize: 18, fontWeight: 'bold' }}>Oops! Load Failed</Text>
        <BouncyTap
          style={[styles.returnBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/susu")}
        >
            <Text style={{ color: colors.text }}>Go Back</Text>
        </BouncyTap>
      </View>
    );
  }

  if (groupQuery.isLoading || !groupQuery.data) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textDim, marginTop: 12, fontWeight: 'bold' }}>Syncing Vault...</Text>
      </View>
    );
  }

  const g = groupQuery.data;
  const currentCycle = g?.cycle_index || 1;
  const contribution = g?.contribution || 0;
  const membersData = membersQuery.data || [];
  const memberCount = membersData.length;
  const frequency = g?.frequency || "Periodic";
  const isOwner = profile?.id === g.owner_id;

  const hasPaidCurrent = contributionsQuery.data?.some(c => c.user_id === profile?.id && c.cycle_index === currentCycle);
  const currentWinner = membersData.find(m => m.payout_order === currentCycle);

  const handlePay = async () => {
    if (!g?.id) return;
    try {
      await record.mutateAsync({
        group_id: g.id,
        amount: contribution,
        cycle_index: currentCycle,
        momo_provider: "Wallet",
        momo_reference: "INTERNAL-" + Date.now(),
        status: "paid"
      });
      setShowPayModal(false);
      Alert.alert("Success", "Contribution recorded!");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Payment failed.");
    }
  };

  const handleLeave = async () => {
    if (!g?.id) return;
    try {
      await leave.mutateAsync(g.id);
      setShowExitModal(false);
      Alert.alert("Success", "You have exited the circle.");
      router.replace("/(tabs)/susu");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not exit circle.");
    }
  };

  const shareInvite = async () => {
    if (!g?.invite_code) return;
    try {
      await Share.share({
        message: `Join my Susu circle "${g.name}" on ClipCapital! Use code: ${g.invite_code}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KenteBackground />
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <BouncyTap
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/susu")}
            style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}
          >
            <ArrowLeft size={20} color={colors.text} />
          </BouncyTap>
        ),
        headerRight: () => (
          <BouncyTap onPress={shareInvite} style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}>
             <Share2 size={20} color={colors.primary} />
          </BouncyTap>
        )
      }} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
        refreshControl={<RefreshControl refreshing={groupQuery.isRefetching} onRefresh={() => groupQuery.refetch()} tintColor={colors.primary} />}
      >
        <View style={{ paddingHorizontal: 20 }}>

          {/* 1. Header with Metadata */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.headerSection}>
            <View style={styles.row}>
               <View style={[styles.badge, { backgroundColor: colors.gold + '10' }]}>
                  <ShieldCheck size={10} color={colors.gold} />
                  <Text style={[styles.badgeText, { color: colors.gold }]}>{frequency.toUpperCase()} PROTOCOL</Text>
               </View>
               {isOwner && <Crown size={14} color={colors.gold} fill={colors.gold} />}
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{g?.name || "Circle"}</Text>
          </Animated.View>

          {/* 2. DEDICATED ROUND STATUS (NEW - VERY OBVIOUS) */}
          <Animated.View entering={FadeInDown.delay(100)} style={[styles.roundStatusContainer, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
             <View style={styles.roundInfo}>
                <Text style={[styles.roundLabel, { color: colors.primary }]}>CURRENT ROUND</Text>
                <Text style={[styles.roundNumber, { color: colors.text }]}>#{currentCycle}</Text>
             </View>
             <View style={styles.roundDivider} />
             <View style={styles.roundTarget}>
                <Text style={[styles.roundLabel, { color: colors.textDim }]}>PAYOUT TARGET</Text>
                <Text style={[styles.roundWinner, { color: colors.text }]} numberOfLines={1}>
                    {currentWinner?.profiles?.display_name || "PENDING"}
                </Text>
             </View>
          </Animated.View>

          {/* 3. Institutional Summary Row */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.summaryGrid}>
             <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.summaryTile, { borderColor: colors.border }]}>
                <Text style={[styles.tileLabel, { color: colors.textDim }]}>ACCUMULATED POT</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                   <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'Display-Bold', marginRight: 4 }}>GH₵</Text>
                   <AnimatedNumber value={isPrivate ? 0 : (g?.pot || 0)} style={{ color: colors.text, fontSize: 24, fontFamily: 'Display-Bold' }} />
                </View>
             </BlurView>

             <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[styles.summaryTile, { borderColor: colors.border }]}>
                <Text style={[styles.tileLabel, { color: colors.textDim }]}>ROUND GOAL</Text>
                <Text style={[styles.tileValue, { color: colors.text }]}>GH₵ {(contribution * memberCount).toLocaleString()}</Text>
             </BlurView>
          </Animated.View>

          {/* 4. Contribution Status */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.paymentSection}>
             <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.paymentCard, { borderColor: hasPaidCurrent ? colors.primary + '40' : colors.border }]}>
                <View style={styles.paymentRow}>
                   <View>
                      <Text style={[styles.paymentLabel, { color: colors.textDim }]}>{hasPaidCurrent ? "VERIFIED DEPOSIT" : "DUE CONTRIBUTION"}</Text>
                      <Text style={[styles.paymentAmount, { color: colors.text }]}>GH₵ {contribution.toLocaleString()}</Text>
                   </View>
                   {hasPaidCurrent ? (
                     <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Check size={18} color={colors.primary} strokeWidth={3} />
                        <Text style={[styles.verifiedText, { color: colors.primary }]}>PAID</Text>
                     </View>
                   ) : (
                     <BouncyTap onPress={() => setShowPayModal(true)}>
                        <LinearGradient colors={[colors.primary, "#059669"]} style={styles.payBtn}>
                           <Text style={styles.payBtnText}>SEND</Text>
                           <Zap size={14} color="#000" fill="#000" />
                        </LinearGradient>
                     </BouncyTap>
                   )}
                </View>
             </BlurView>
          </Animated.View>

          {/* 5. Partners Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <View style={styles.row}>
                  <Users size={14} color={colors.textDim} />
                  <Text style={[styles.sectionTitle, { color: colors.textDim }]}>PARTNERS ({memberCount})</Text>
               </View>
               <BouncyTap onPress={shareInvite}>
                  <Text style={{ color: colors.primary, fontSize: 10, fontFamily: 'Display-Bold' }}>INVITE +</Text>
               </BouncyTap>
            </View>

            <View style={[styles.listContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
               {membersData.map((m: any, idx: number) => {
                 const hasPaid = contributionsQuery.data?.some(c => c.user_id === m.user_id && c.cycle_index === currentCycle);
                 const isWinner = m.payout_order === currentCycle;

                 return (
                   <View key={m.id} style={[styles.memberRow, { borderBottomColor: colors.border }, idx === membersData.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={styles.row}>
                         <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }, isWinner && { borderColor: colors.gold, borderWidth: 2 }]}>
                            <Text style={[styles.avatarText, { color: colors.text }]}>{m.profiles?.display_name?.charAt(0) || "?"}</Text>
                            {isWinner && <View style={[styles.crownMini, { backgroundColor: colors.gold }]}><Crown size={8} color="white" fill="white" /></View>}
                         </View>
                         <View>
                            <Text style={[styles.memberName, { color: colors.text }]}>{m.profiles?.display_name}</Text>
                            <Text style={[styles.memberSub, { color: colors.textDim }]}>PAYOUT ORDER: #{m.payout_order}</Text>
                         </View>
                      </View>
                      <View style={styles.row}>
                          {isWinner && (
                              <View style={[styles.payoutBadge, { backgroundColor: colors.gold + '20' }]}>
                                  <Text style={{ color: colors.gold, fontSize: 8, fontFamily: 'Display-Bold' }}>PAYOUT</Text>
                              </View>
                          )}
                          {hasPaid ? <Check size={18} color={colors.primary} strokeWidth={2.5} /> : <Clock size={16} color={colors.textDim} opacity={0.3} />}
                      </View>
                   </View>
                 );
               })}
            </View>
          </View>

          {/* 6. Recent Activity */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim, marginBottom: 12 }]}>VAULT LOGS</Text>
            {contributionsQuery.data && contributionsQuery.data.length > 0 ? (
                contributionsQuery.data.slice(0, 3).map((c: any) => (
                    <View key={c.id} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                       <View style={styles.row}>
                          <View style={[styles.historyIcon, { backgroundColor: colors.surfaceElevated }]}>
                             <TrendingUp size={12} color={colors.primary} />
                          </View>
                          <View>
                             <Text style={[styles.historyLabel, { color: colors.text }]}>Contribution</Text>
                             <Text style={[styles.historyDate, { color: colors.textDim }]}>{new Date(c.created_at).toLocaleDateString()}</Text>
                          </View>
                       </View>
                       <Text style={[styles.historyAmount, { color: colors.primary }]}>+ GH₵ {c.amount}</Text>
                    </View>
                ))
            ) : (
                <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center' }}>No logs detected.</Text>
            )}
          </View>

          {/* 7. Exit Button */}
          <BouncyTap style={{ marginTop: 20, marginBottom: 60 }} onPress={() => setShowExitModal(true)}>
             <View style={[styles.exitBtn, { borderColor: colors.destructive + '30', backgroundColor: colors.destructive + '05' }]}>
                <LogOut size={16} color={colors.destructive} />
                <Text style={[styles.exitBtnText, { color: colors.destructive }]}>EXIT CIRCLE</Text>
             </View>
          </BouncyTap>

        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={showPayModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
           <Animated.View entering={FadeInDown} style={{ width: '100%' }}>
             <Card style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                   <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Deposit</Text>
                   <TouchableOpacity onPress={() => setShowPayModal(false)}><X size={24} color={colors.textDim} /></TouchableOpacity>
                </View>
                <View style={[styles.paymentMethod, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                   <Wallet size={20} color={colors.primary} />
                   <View>
                      <Text style={[styles.methodTitle, { color: colors.text }]}>Oxygen Wallet</Text>
                      <Text style={[styles.methodSub, { color: colors.textMuted }]}>GH₵ {profile?.wallet_balance?.toLocaleString()}</Text>
                   </View>
                </View>
                <Button title="Confirm & Transmit" onPress={handlePay} loading={record.isPending} />
             </Card>
           </Animated.View>
        </View>
      </Modal>

      {/* Exit Modal */}
      <Modal visible={showExitModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
           <Animated.View entering={FadeInDown} style={{ width: '100%' }}>
             <Card style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                   <Text style={[styles.modalTitle, { color: colors.destructive }]}>Exit Protocol</Text>
                   <TouchableOpacity onPress={() => setShowExitModal(false)}><X size={24} color={colors.textDim} /></TouchableOpacity>
                </View>
                <View style={[styles.warningBox, { backgroundColor: colors.gold + '10', borderColor: colors.gold + '20' }]}>
                   <Info size={16} color={colors.gold} />
                   <Text style={[styles.warningText, { color: colors.gold }]}>Exit requires a GH₵ 100.00 penalty deduction.</Text>
                </View>
                <Button title="Authorize Exit" variant="destructive" onPress={handleLeave} loading={leave.isPending} />
             </Card>
           </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  scrollContent: { paddingBottom: 80 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerSection: { marginBottom: 24 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  badgeText: { fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 1.5 },
  headerTitle: { fontFamily: 'Display-Bold', fontSize: 32, marginTop: 8 },
  roundStatusContainer: { flexDirection: 'row', padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 24, alignItems: 'center' },
  roundInfo: { flex: 1 },
  roundLabel: { fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 1.5, marginBottom: 4 },
  roundNumber: { fontFamily: 'Display-Bold', fontSize: 28 },
  roundDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20 },
  roundTarget: { flex: 2 },
  roundWinner: { fontFamily: 'Display-Bold', fontSize: 18, marginTop: 2 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryTile: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  tileLabel: { fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 1 },
  tileValue: { fontFamily: 'Display-Bold', fontSize: 16, marginTop: 4 },
  paymentSection: { marginBottom: 32 },
  paymentCard: { padding: 20, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentLabel: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1 },
  paymentAmount: { fontFamily: 'Display-Bold', fontSize: 24, marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  verifiedText: { fontFamily: 'Display-Bold', fontSize: 12, fontWeight: '900' },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  payBtnText: { color: '#000', fontFamily: 'Display-Bold', fontSize: 12, fontWeight: '900' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 2 },
  listContainer: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Display-Bold', fontSize: 14 },
  memberName: { fontFamily: 'Display-Bold', fontSize: 14 },
  memberSub: { fontFamily: 'Display-Bold', fontSize: 8, opacity: 0.5, marginTop: 2 },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  historyIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  historyLabel: { fontFamily: 'Display-Bold', fontSize: 13 },
  historyDate: { fontFamily: 'Display-Bold', fontSize: 9, opacity: 0.5 },
  historyAmount: { fontFamily: 'Display-Bold', fontSize: 14 },
  exitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 60, borderRadius: 20, borderWidth: 1 },
  exitBtnText: { fontFamily: 'Display-Bold', fontSize: 11, letterSpacing: 1.5, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end', padding: 20 },
  modalContent: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Display-Bold', fontSize: 20 },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1 },
  methodTitle: { fontFamily: 'Display-Bold', fontSize: 14 },
  methodSub: { fontSize: 11, opacity: 0.6 },
  warningBox: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1 },
  warningText: { fontSize: 12, flex: 1, lineHeight: 18 },
  returnBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginTop: 24 },
  crownMini: { position: 'absolute', top: -6, right: -6, padding: 3, borderRadius: 100 },
  payoutBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }
});
