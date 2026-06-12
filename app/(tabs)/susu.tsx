import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, StyleSheet, ActivityIndicator, Modal, Alert, Keyboard, KeyboardAvoidingView, Platform, Vibration } from "react-native";
import { useMyGroups, useAllSusuGroups, useJoinGroup, useCreateGroup, useProfile } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { Users, Plus, ChevronRight, X, Info, ShieldCheck, AlertCircle, CheckCircle2, Search, ArrowRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useTheme } from "@/context/theme-context";

export default function SusuScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { data: profile } = useProfile();
  const myGroups = useMyGroups();
  const allGroups = useAllSusuGroups();
  const join = useJoinGroup();
  const create = useCreateGroup();

  const [invite, setInvite] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Create Group State
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newFrequency, setNewFrequency] = useState("Weekly");
  const [modalStatus, setModalStatus] = useState({ text: "", type: "" });

  const isPrivate = profile?.privacy_mode_enabled ?? false;

  const handleJoin = async (code?: string, groupId?: string) => {
    const targetCode = code || invite;
    if (!targetCode.trim()) {
      Alert.alert("Error", "Please enter an invite code.");
      return;
    }

    try {
      setJoiningId(groupId || "manual");
      const id = await join.mutateAsync(targetCode.trim());
      Vibration.vibrate(Platform.OS === 'ios' ? 0 : 20);
      setInvite("");
      if (id) {
        router.push(`/susu/${id}`);
      } else {
        myGroups.refetch();
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not join group.");
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreate = async () => {
    setModalStatus({ text: "", type: "" });
    if (!newName.trim() || !newAmount) {
      setModalStatus({ text: "Please fill all fields.", type: "error" });
      return;
    }

    const amount = parseFloat(newAmount.replace(/[^0-9.]/g, ''));
    try {
      const groupId = await create.mutateAsync({
        name: newName.trim(),
        contribution: amount,
        frequency: newFrequency
      });

      setModalStatus({ text: "Success! Redirecting...", type: "success" });
      Vibration.vibrate(Platform.OS === 'ios' ? 0 : 20);
      setTimeout(() => {
        setShowCreateModal(false);
        setNewName("");
        setNewAmount("");
        router.push(`/susu/${groupId}`);
      }, 1500);
    } catch (e: any) {
      setModalStatus({ text: e.message || "Failed to create circle.", type: "error" });
    }
  };

  const myGroupIds = new Set((myGroups.data ?? []).map((g) => g.id));
  const availableGroups = (allGroups.data ?? []).filter((g) => !myGroupIds.has(g.id));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={myGroups.isLoading} tintColor={colors.primary} onRefresh={() => myGroups.refetch()} progressViewOffset={Platform.OS === 'ios' ? 110 : 0} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="Susu Circles" subtitle="Community Capital" />

          {/* Quick Actions */}
          <View style={styles.actionRow}>
            <BouncyTap style={{ flex: 1 }} onPress={() => setShowCreateModal(true)}>
              <LinearGradient
                colors={theme === 'dark' ? ['#10b981', '#064e3b'] : ['#10b981', '#059669']}
                style={styles.createCard}
              >
                <View style={styles.createIconBg}>
                  <Plus size={20} color="#10b981" strokeWidth={3} />
                </View>
                <Text style={styles.createTitle}>CREATE</Text>
                <Text style={styles.createSub}>NEW CIRCLE</Text>
              </LinearGradient>
            </BouncyTap>

            <View style={[styles.joinCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
               <Text style={[styles.joinLabel, { color: colors.textMuted }]}>SECURE JOIN</Text>
               <View style={[styles.joinInputWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <TextInput
                    value={invite}
                    onChangeText={setInvite}
                    placeholder="CODE"
                    placeholderTextColor={colors.textDim}
                    style={[styles.joinInput, { color: colors.text }]}
                    autoCapitalize="characters"
                  />
                  <BouncyTap onPress={() => handleJoin()} disabled={joiningId === "manual"}>
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      style={styles.joinBtnSmall}
                    >
                      {joiningId === "manual" ? <ActivityIndicator size="small" color="#000" /> : <ArrowRight size={16} color="#000" strokeWidth={3} />}
                    </LinearGradient>
                  </BouncyTap>
               </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Users size={14} color={colors.primary} />
               <Text style={[styles.sectionTitle, { color: colors.textDim }]}>Your Memberships</Text>
            </View>
            {myGroups.data?.length === 0 ? (
              <Card style={[styles.emptyCard, { borderColor: colors.border }]}>
                <Info size={32} color={colors.textDim} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>You haven't joined any circles yet. Start or join a circle to grow your liquidity.</Text>
              </Card>
            ) : (
              myGroups.data?.map((g) => (
                <TouchableOpacity key={g.id} onPress={() => router.push(`/susu/${g.id}`)} activeOpacity={0.8} style={{ marginBottom: 12 }}>
                  <Card style={[styles.groupCard, { backgroundColor: colors.cardBg }]}>
                    <View style={styles.groupInfo}>
                      <View style={[styles.groupIconBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }]}><Users size={20} color={colors.primary} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.groupName, { color: colors.text }]}>{g.name}</Text>
                        <Text style={[styles.groupSub, { color: colors.textMuted }]}>{g.frequency} • {g.members_count} Members</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.groupAmount, { color: colors.primary }]}>{isPrivate ? "••••" : `GH₵ ${g.contribution}`}</Text>
                        <Text style={[styles.groupUnit, { color: colors.textDim }]}>PER CYCLE</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Search size={14} color={colors.primary} />
               <Text style={[styles.sectionTitle, { color: colors.textDim }]}>Explore Circles</Text>
            </View>
            {availableGroups.length === 0 ? (
              <Text style={[styles.subText, { color: colors.textDim }]}>No public circles available at this time.</Text>
            ) : (
              availableGroups.map((g) => (
                <Card key={g.id} style={[styles.exploreCard, { backgroundColor: colors.surfaceElevated }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.exploreName, { color: colors.text }]}>{g.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Text style={[styles.exploreSub, { color: colors.textMuted }]}>GH₵ {g.contribution}</Text>
                        <View style={[styles.dot, { backgroundColor: colors.textDim }]} />
                        <Text style={[styles.exploreSub, { color: colors.textMuted }]}>{g.frequency}</Text>
                    </View>
                  </View>
                  <BouncyTap onPress={() => handleJoin(g.invite_code, g.id)}>
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      style={styles.exploreJoinBtn}
                    >
                      {joiningId === g.id ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text style={styles.exploreJoinText}>JOIN</Text>
                      )}
                    </LinearGradient>
                  </BouncyTap>
                </Card>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <Card style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>New Susu Circle</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Circle Name</Text>
                <TextInput style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]} placeholder="e.g. Market Women Savings" placeholderTextColor={colors.textDim} value={newName} onChangeText={setNewName} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Contribution Amount (GH₵)</Text>
                <TextInput style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]} placeholder="0.00" placeholderTextColor={colors.textDim} keyboardType="numeric" value={newAmount} onChangeText={setNewAmount} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Frequency</Text>
                <View style={styles.freqRow}>
                  {["Daily", "Weekly", "Monthly"].map((f) => (
                    <TouchableOpacity key={f} onPress={() => setNewFrequency(f)} style={[styles.freqBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, newFrequency === f && { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                      <Text style={[styles.freqBtnText, { color: colors.textMuted }, newFrequency === f && { color: colors.primary }]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {modalStatus.text !== "" && (
                <View style={[styles.statusBox, modalStatus.type === 'success' ? styles.statusSuccess : styles.statusError]}>
                  <Text style={[styles.statusText, { color: modalStatus.type === 'success' ? '#10b981' : '#ef4444' }]}>{modalStatus.text}</Text>
                </View>
              )}

              <BouncyTap onPress={handleCreate} disabled={create.isPending}>
                 <LinearGradient colors={['#10b981', '#059669']} style={styles.createBtnModal}>
                    {create.isPending ? <ActivityIndicator color="#000" /> : <Text style={styles.createBtnTextModal}>CREATE CIRCLE</Text>}
                 </LinearGradient>
              </BouncyTap>
            </Card>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c0a' },
  scrollContent: { paddingBottom: 140, paddingTop: 60 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  createCard: { flex: 1, borderRadius: 24, padding: 20, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.1)' },
  createIconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  createTitle: { color: 'white', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  createSub: { color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: 12, marginTop: 2 },
  joinCard: { flex: 1.4, backgroundColor: '#0f1714', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'center' },
  joinLabel: { color: '#7d8a84', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  joinInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  joinInput: { flex: 1, height: 44, paddingHorizontal: 12, color: 'white', fontSize: 16, fontWeight: 'bold' },
  joinBtnSmall: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginLeft: 8 },
  sectionTitle: { color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' },
  groupCard: { padding: 18, backgroundColor: '#0f1714' },
  groupInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  groupIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.1)' },
  groupName: { color: 'white', fontFamily: 'Display-Bold', fontSize: 16 },
  groupSub: { color: '#7d8a84', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 },
  groupAmount: { color: '#10B981', fontFamily: 'Display-Bold', fontSize: 18 },
  groupUnit: { color: '#405045', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  exploreCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 18, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24 },
  exploreName: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  exploreSub: { color: '#7d8a84', fontSize: 11, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#405045', marginHorizontal: 4 },
  exploreJoinBtn: { paddingHorizontal: 20, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  exploreJoinText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  subText: { color: '#405045', textAlign: 'center', marginTop: 20, fontSize: 13, fontStyle: 'italic' },
  emptyCard: { alignItems: 'center', gap: 12, padding: 40, backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 32 },
  emptyText: { color: '#7d8a84', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end', padding: 16 },
  modalContent: { padding: 32, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { color: 'white', fontFamily: 'Display-Bold', fontSize: 24 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { color: '#7d8a84', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, marginLeft: 4 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.03)', height: 64, borderRadius: 20, paddingHorizontal: 20, color: 'white', fontSize: 18, fontWeight: 'bold', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  freqRow: { flexDirection: 'row', gap: 10 },
  freqBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  freqBtnActive: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
  freqBtnText: { color: '#7d8a84', fontSize: 12, fontWeight: 'bold' },
  freqBtnTextActive: { color: '#10b981' },
  statusBox: { padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1 },
  statusError: { backgroundColor: '#ef444410', borderColor: '#ef444430' },
  statusSuccess: { backgroundColor: '#10b98110', borderColor: '#10b98130' },
  statusText: { fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  createBtnModal: { height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  createBtnTextModal: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});
