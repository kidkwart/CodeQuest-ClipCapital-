import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet, Modal, Alert, Share } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useGroup, useGroupMembers, useGroupContributions, useRecordContribution, useProfile, useLeaveGroup } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, Users, Check, Clock, ShieldCheck, Wallet, TrendingUp, X, Copy, Zap, AlertCircle, Share2, Crown, Plus, LogOut, Info } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from "@/context/theme-context";

export default function GroupDetails() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { data: profile } = useProfile();

  const id = Array.isArray(groupId) ? groupId[0] : groupId;

  const group = useGroup(id as string);
  const members = useGroupMembers(id as string);
  const contributions = useGroupContributions(id as string);
  const record = useRecordContribution();
  const leave = useLeaveGroup();

  const [showPayModal, setShowPayModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const isPrivate = profile?.privacy_mode_enabled ?? false;

  if (group.isError) {
    return (
      <View style={styles.loaderContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <Text style={{ color: 'white', marginTop: 16, fontSize: 18, fontWeight: 'bold' }}>Oops! Load Failed</Text>
        <Text style={{ color: '#7d8a84', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>
            {(group.error as any)?.message || "Could not find this circle."}
        </Text>
        <Button
          title="Go Back"
          variant="outline"
          style={{ marginTop: 24, width: 200 }}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/susu")}
        />
      </View>
    );
  }

  if (group.isLoading || !group.data) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ color: '#7d8a84', marginTop: 12, fontWeight: 'bold' }}>Syncing with Vault...</Text>
        <TouchableOpacity
          style={{ marginTop: 40 }}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/susu")}
        >
            <Text style={{ color: '#10b981', fontSize: 12, fontWeight: 'bold' }}>CANCEL & GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const g = group.data;
  const currentCycle = g?.cycle_index || 1;
  const contribution = g?.contribution || 0;
  const memberCount = g?.members_count || 1;
  const frequency = g?.frequency || "Periodic";
  const isOwner = profile?.id === g.owner_id;

  const hasPaidCurrent = contributions.data?.some(c => c.user_id === profile?.id && c.cycle_index === currentCycle);

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

  const copyInvite = async () => {
    if (!g?.invite_code) return;
    await Clipboard.setStringAsync(g.invite_code);
    Alert.alert("Copied", "Invite code copied!");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/susu")}
            style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={shareInvite} style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
             <Share2 size={20} color={colors.primary} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={group.isRefetching} onRefresh={() => group.refetch()} tintColor={colors.primary} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
             {isOwner && <Crown size={14} color={colors.gold} fill={colors.gold} />}
             <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase' }}>{frequency} Savings</Text>
          </View>
          <Text style={{ fontFamily: 'Display-Bold', color: colors.text, fontSize: 32, marginBottom: 32 }}>{g?.name || "Circle"}</Text>

          {/* Pot Status */}
          <Card style={[styles.potCard, { backgroundColor: colors.primary }]}>
            <View style={{ zIndex: 2 }}>
              <Text style={[styles.potLabel, { color: 'rgba(255,255,255,0.7)' }]}>ACCUMULATED POT</Text>
              <Text style={[styles.potValue, { color: 'white' }]}>{isPrivate ? "••••••" : `GH₵ ${(g?.pot || 0).toLocaleString()}`}</Text>

              <View style={styles.potFooter}>
                <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                   <Clock size={12} color="#fff" />
                   <Text style={styles.tagText}>Round #{currentCycle}</Text>
                </View>
                <Text style={styles.potSub}>Round Goal: {isPrivate ? "••••" : `GH₵ ${(contribution * memberCount).toLocaleString()}`}</Text>
              </View>
            </View>
            <Wallet size={160} color="white" style={styles.potIcon} />
          </Card>

          {/* Your Status / CTA */}
          <View style={styles.section}>
            <Card style={[styles.statusCard, { backgroundColor: colors.cardBg, borderColor: colors.border }, hasPaidCurrent && { borderColor: colors.primary + '40' }]}>
               <View style={styles.statusRow}>
                  <View style={styles.statusInfo}>
                     <Text style={[styles.statusLabel, { color: colors.textDim }]}>{hasPaidCurrent ? "Your Contribution" : "Next Payment"}</Text>
                     <Text style={[styles.statusValue, { color: colors.text }]}>{isPrivate ? "••••" : `GH₵ ${contribution}`}</Text>
                  </View>
                  {hasPaidCurrent ? (
                    <View style={[styles.paidBadge, { backgroundColor: colors.primary + '10' }]}>
                       <Check size={16} color={colors.primary} />
                       <Text style={[styles.paidText, { color: colors.primary }]}>PAID</Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setShowPayModal(true)} activeOpacity={0.8}>
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.premiumPayBtn}
                      >
                        <Text style={styles.premiumPayBtnText}>PAY NOW</Text>
                        <Zap size={14} color="#000" fill="#000" />
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
               </View>
            </Card>
          </View>

          {/* Members List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Users size={14} color={colors.primary} />
               <Text style={[styles.sectionTitle, { color: colors.textDim }]}>Partners ({memberCount})</Text>
            </View>
            <Card style={{ padding: 8, backgroundColor: colors.cardBg, borderColor: colors.border }}>
               {members.data?.map((m: any, idx: number) => {
                 const hasPaid = contributions.data?.some(c => c.user_id === m.user_id && c.cycle_index === currentCycle);
                 const isMe = m.user_id === profile?.id;
                 const isTheWinner = m.payout_order === currentCycle;

                 return (
                   <View key={m.id} style={[styles.memberRow, { borderBottomColor: colors.border }, idx === (members.data?.length || 0) - 1 && { borderBottomWidth: 0 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                         <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }, isTheWinner && { borderColor: colors.gold, borderWidth: 2 }]}>
                            <Text style={[styles.avatarText, { color: colors.text }]}>{m.profiles?.display_name?.charAt(0) || "?"}</Text>
                            {isTheWinner && <View style={[styles.crownMini, { backgroundColor: colors.gold }]}><Crown size={8} color="white" fill="white" /></View>}
                         </View>
                         <View>
                            <Text style={[styles.memberName, { color: colors.text }, isMe && { color: colors.primary }]}>
                                {m.profiles?.display_name || "Unknown"} {isMe ? "(You)" : ""}
                            </Text>
                            <Text style={[styles.memberSub, { color: colors.textDim }]}>Order: #{m.payout_order}</Text>
                         </View>
                      </View>
                      {hasPaid ? (
                        <View style={[styles.checkCircle, { borderColor: colors.primary + '30' }]}>
                           <Check size={12} color={colors.primary} />
                        </View>
                      ) : (
                        <View style={[styles.checkCircle, { borderColor: colors.border }]} />
                      )}
                   </View>
                 );
               })}
               <TouchableOpacity onPress={shareInvite} style={styles.addMemberBtn}>
                  <Plus size={16} color={colors.textDim} />
                  <Text style={[styles.addMemberText, { color: colors.textDim }]}>Invite Partner</Text>
               </TouchableOpacity>
            </Card>
          </View>

          {/* History */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>Recent Activity</Text>
            {contributions.data && contributions.data.length > 0 ? (
                contributions.data.slice(0, 5).map((c: any) => (
                    <View key={c.id} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                       <View style={styles.historyLeft}>
                          <View style={[styles.historyIcon, { backgroundColor: colors.surfaceElevated }]}>
                             <Zap size={14} color={colors.textDim} />
                          </View>
                          <View>
                             <Text style={[styles.historyUser, { color: colors.text }]}>{c.momo_provider || "Wallet"}</Text>
                             <Text style={[styles.historyDate, { color: colors.textDim }]}>{new Date(c.created_at).toLocaleDateString()}</Text>
                          </View>
                       </View>
                       <Text style={[styles.historyAmount, { color: colors.primary }]}>+ {isPrivate ? "•••" : `GH₵ ${c.amount}`}</Text>
                    </View>
                ))
            ) : (
                <Text style={{ color: colors.textDim, fontSize: 13, textAlign: 'center', marginTop: 10 }}>No activity yet.</Text>
            )}
          </View>

          {/* Exit Group - Now more prominent */}
          <View style={{ marginTop: 20, marginBottom: 40 }}>
              <Card style={{ backgroundColor: colors.destructive + '05', borderColor: colors.destructive + '15' }}>
                <TouchableOpacity
                    style={styles.exitBtnContainer}
                    onPress={() => setShowExitModal(true)}
                >
                    <LogOut size={16} color={colors.destructive} />
                    <Text style={[styles.exitBtnText, { color: colors.destructive }]}>EXIT THIS CIRCLE</Text>
                </TouchableOpacity>
              </Card>
          </View>
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={showPayModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
           <Animated.View entering={FadeInDown} style={{ width: '100%' }}>
             <Card style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                   <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Payment</Text>
                   <TouchableOpacity onPress={() => setShowPayModal(false)}>
                      <X color={colors.textDim} />
                   </TouchableOpacity>
                </View>
                <Text style={[styles.modalDesc, { color: colors.textMuted }]}>Contribute GH₵ {contribution} to the "{g?.name}" pot.</Text>

                <View style={[styles.paymentMethod, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                   <View style={[styles.methodIcon, { backgroundColor: colors.primary + '10' }]}>
                      <Wallet size={20} color={colors.primary} />
                   </View>
                   <View>
                      <Text style={[styles.methodTitle, { color: colors.text }]}>Oxygen Wallet</Text>
                      <Text style={[styles.methodSub, { color: colors.textMuted }]}>Available: GH₵ {profile?.wallet_balance?.toLocaleString()}</Text>
                   </View>
                </View>

                <Button
                  title="Confirm & Pay"
                  size="lg"
                  onPress={handlePay}
                  loading={record.isPending}
                />
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
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={20} color={colors.destructive} />
                      <Text style={[styles.modalTitle, { color: colors.destructive }]}>Exit Circle</Text>
                   </View>
                   <TouchableOpacity onPress={() => setShowExitModal(false)}>
                      <X color={colors.textDim} />
                   </TouchableOpacity>
                </View>

                <View style={[styles.penaltyWarning, { backgroundColor: colors.gold + '10', borderColor: colors.gold + '20' }]}>
                   <Info size={16} color={colors.gold} />
                   <Text style={[styles.penaltyText, { color: colors.gold }]}>An exit penalty of <Text style={{ fontWeight: 'bold', color: colors.text }}>GH₵ 100.00</Text> will be deducted from your wallet.</Text>
                </View>

                <Text style={[styles.modalDesc, { color: colors.textMuted }]}>Are you sure you want to leave <Text style={{ color: colors.text, fontWeight: 'bold' }}>{g?.name}</Text>? This action is permanent.</Text>

                <Button
                  title="Pay Penalty & Exit"
                  variant="destructive"
                  size="lg"
                  onPress={handleLeave}
                  loading={leave.isPending}
                />

                <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setShowExitModal(false)}>
                    <Text style={{ color: colors.textDim, fontSize: 12, fontWeight: 'bold' }}>STAY IN CIRCLE</Text>
                </TouchableOpacity>
             </Card>
           </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c0a' },
  loaderContainer: { flex: 1, backgroundColor: '#080c0a', alignItems: 'center', justifyContent: 'center', padding: 40 },
  scrollContent: { paddingTop: 100, paddingBottom: 150 },
  headerBtn: { marginLeft: 16, marginRight: 16, height: 44, width: 44, borderRadius: 14, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginLeft: 8 },
  sectionTitle: { color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' },
  potCard: { backgroundColor: '#10b981', padding: 24, borderRadius: 32, overflow: 'hidden', marginBottom: 10 },
  potLabel: { color: 'rgba(255,255,255,0.7)', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  potValue: { fontFamily: 'Display-Bold', color: 'white', fontSize: 36, marginTop: 4 },
  potFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  tagText: { color: "#fff", fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  potSub: { color: 'white', fontSize: 11, fontWeight: '600', opacity: 0.8 },
  potIcon: { position: 'absolute', right: -40, bottom: -40, opacity: 0.15, transform: [{ rotate: '-15deg' }] },
  statusCard: { padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusInfo: { gap: 4 },
  statusLabel: { color: '#7d8a84', fontSize: 11, fontWeight: 'bold' },
  statusValue: { color: 'white', fontFamily: 'Display-Bold', fontSize: 20 },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  paidText: { color: '#10b981', fontWeight: '900', fontSize: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: 'bold' },
  memberName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  memberSub: { color: '#7d8a84', fontSize: 10 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#10b98130', alignItems: 'center', justifyContent: 'center' },
  addMemberBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, opacity: 0.6 },
  addMemberText: { color: '#7d8a84', fontWeight: 'bold', fontSize: 13 },
  crownMini: { position: 'absolute', top: -8, right: -8, backgroundColor: '#f59e0b', padding: 4, borderRadius: 100 },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  historyUser: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  historyDate: { color: '#405045', fontSize: 10 },
  historyAmount: { color: '#10b981', fontWeight: 'bold', fontSize: 14 },
  exitBtnContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20 },
  exitBtnText: { color: '#ef4444', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  modalContent: { padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: 'white', fontFamily: 'Display-Bold', fontSize: 20 },
  modalDesc: { color: '#7d8a84', fontSize: 14, marginBottom: 24, lineHeight: 20 },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  methodIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center' },
  methodTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  methodSub: { color: '#7d8a84', fontSize: 11 },
  penaltyWarning: { flexDirection: 'row', gap: 12, backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  penaltyText: { color: '#f59e0b', fontSize: 12, flex: 1, lineHeight: 18 },
  premiumPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  premiumPayBtnText: {
    color: '#000',
    fontFamily: 'Display-Bold',
    fontSize: 11,
    letterSpacing: 1,
  }
});
