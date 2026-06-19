import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, Modal, RefreshControl } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Lucide from "lucide-react-native";
import { useSavingsGoals, useCreateSavingsGoal, useDepositToVault, useProfile } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useTheme } from "@/context/theme-context";
import { LinearGradient } from "expo-linear-gradient";

export default function VaultScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: goals, isLoading, refetch } = useSavingsGoals();
  const { data: profile } = useProfile();
  const createGoal = useCreateSavingsGoal();
  const deposit = useDepositToVault();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({ name: "", target: "" });
  const [depositAmt, setDepositAmt] = useState("");

  const handleCreate = async () => {
    if (!newGoal.name || !newGoal.target) return;
    try {
      await createGoal.mutateAsync({
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target)
      });
      setShowAddModal(false);
      setNewGoal({ name: "", target: "" });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleDeposit = async () => {
    if (!showDepositModal || !depositAmt) return;
    try {
      await deposit.mutateAsync({
        goal_id: showDepositModal,
        amount: parseFloat(depositAmt)
      });
      setShowDepositModal(null);
      setDepositAmt("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Lucide.ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="The Vault" subtitle="Strategic Capital Reserve" />

          <Card style={[styles.balanceCard, { backgroundColor: colors.cardBg, borderColor: colors.primary + '20' }]}>
             <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>AVAILABLE TO LOCK</Text>
             <Text style={[styles.balanceValue, { color: colors.text }]}>GH₵ {profile?.wallet_balance?.toLocaleString() || "0"}</Text>
             <Text style={[styles.balanceDesc, { color: colors.textDim }]}>Transfer funds from your wallet into specific business goals.</Text>
          </Card>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Goals</Text>
            <BouncyTap onPress={() => setShowAddModal(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                <Lucide.Plus size={16} color="#000" strokeWidth={3} />
            </BouncyTap>
          </View>

          {(!goals || goals.length === 0) ? (
            <View style={styles.emptyState}>
               <Lucide.ShieldCheck size={48} color={colors.textDim} opacity={0.3} />
               <Text style={[styles.emptyText, { color: colors.textDim }]}>No active savings goals.</Text>
               <Text style={[styles.emptySub, { color: colors.textDim }]}>Start building your capital reserve today.</Text>
            </View>
          ) : (
            goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              return (
                <Card key={goal.id} style={[styles.goalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <View style={styles.goalHeader}>
                    <View>
                      <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                      <Text style={[styles.goalTarget, { color: colors.textMuted }]}>Target: GH₵ {goal.target_amount.toLocaleString()}</Text>
                    </View>
                    <BouncyTap onPress={() => setShowDepositModal(goal.id)} style={[styles.depositBtn, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 10 }}>DEPOSIT</Text>
                    </BouncyTap>
                  </View>

                  <View style={styles.progressContainer}>
                     <View style={[styles.progressBase, { backgroundColor: colors.surfaceElevated }]}>
                        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${Math.min(progress, 100)}%` }]} />
                     </View>
                     <Text style={[styles.progressText, { color: colors.primary }]}>{Math.round(progress)}%</Text>
                  </View>

                  <Text style={[styles.currentAmt, { color: colors.text }]}>GH₵ {goal.current_amount.toLocaleString()} saved</Text>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>New Savings Goal</Text>
                    <TouchableOpacity onPress={() => setShowAddModal(false)}><Lucide.X color={colors.textDim} /></TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>GOAL NAME</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                        placeholder="e.g. New Hair Clipper"
                        placeholderTextColor={colors.textDim}
                        value={newGoal.name}
                        onChangeText={t => setNewGoal({...newGoal, name: t})}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>TARGET AMOUNT (GH₵)</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                        placeholder="0.00"
                        placeholderTextColor={colors.textDim}
                        keyboardType="numeric"
                        value={newGoal.target}
                        onChangeText={t => setNewGoal({...newGoal, target: t})}
                    />
                </View>
                <Button title="Create Goal" onPress={handleCreate} loading={createGoal.isPending} />
            </View>
        </View>
      </Modal>

      {/* Deposit Modal */}
      <Modal visible={!!showDepositModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Deposit to Vault</Text>
                    <TouchableOpacity onPress={() => setShowDepositModal(null)}><Lucide.X color={colors.textDim} /></TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>AMOUNT TO LOCK (GH₵)</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                        placeholder="0.00"
                        placeholderTextColor={colors.textDim}
                        keyboardType="numeric"
                        value={depositAmt}
                        onChangeText={setDepositAmt}
                        autoFocus
                    />
                </View>
                <Button title="Confirm Deposit" onPress={handleDeposit} loading={deposit.isPending} />
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 100, paddingBottom: 40 },
  backButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginLeft: 24, marginBottom: 12, borderWidth: 1 },
  balanceCard: { padding: 24, marginBottom: 32, borderRadius: 24, borderWidth: 1 },
  balanceLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  balanceValue: { fontFamily: 'Display-Bold', fontSize: 32 },
  balanceDesc: { fontSize: 12, marginTop: 12, lineHeight: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontFamily: 'Display-Bold', fontSize: 20 },
  addBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyState: { paddingVertical: 60, alignItems: 'center', opacity: 0.6 },
  emptyText: { fontFamily: 'Display-Bold', fontSize: 18, marginTop: 16 },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  goalCard: { padding: 20, marginBottom: 16, borderRadius: 20, borderWidth: 1 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  goalName: { fontWeight: 'bold', fontSize: 16 },
  goalTarget: { fontSize: 12, marginTop: 2 },
  depositBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  progressBase: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%' },
  progressText: { fontSize: 12, fontWeight: '900', width: 40, textAlign: 'right' },
  currentAmt: { fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalContent: { padding: 32, borderRadius: 32, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  input: { height: 60, borderRadius: 16, paddingHorizontal: 20, fontSize: 18, fontWeight: 'bold', borderWidth: 1 }
});
