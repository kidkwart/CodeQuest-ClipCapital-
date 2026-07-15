import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, StyleSheet, ActivityIndicator, Modal, Alert, Keyboard, KeyboardAvoidingView, Platform, Vibration, Dimensions, TouchableWithoutFeedback, FlatList } from "react-native";
import { useMyGroups, useAllSusuGroups, useJoinGroup, useCreateGroup, useProfile } from "@/lib/app-queries";
import { Plus, ChevronRight, X, Info, Users, Search, ArrowRight, Sparkles, BarChart3, ShieldCheck } from "lucide-react-native";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "@/context/language-context";
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KenteBackground } from "@/components/native/effects/kente-pattern";
import { AnimatedNumber } from "@/components/native/animated-number";
import Animated, {
  FadeInDown,
  FadeInRight,
  Layout,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function SusuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const { data: profile } = useProfile();
  const myGroups = useMyGroups();
  const allGroups = useAllSusuGroups();
  const join = useJoinGroup();
  const create = useCreateGroup();

  const [invite, setInvite] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newFrequency, setNewFrequency] = useState("Weekly");

  const isPrivate = profile?.privacy_mode_enabled ?? false;
  const isDark = theme === 'dark';

  const totalContributed = useMemo(() => {
    return (myGroups.data ?? []).reduce((sum, g) => sum + (g.contribution || 0), 0);
  }, [myGroups.data]);

  const handleJoin = async (code?: string, groupId?: string) => {
    const targetCode = code || invite;
    if (!targetCode.trim()) return Alert.alert(t.sync_error, "Please enter a valid join code.");

    try {
      setJoiningId(groupId || "manual");
      Vibration.vibrate(Platform.OS === 'ios' ? 1 : 10);

      // Auto-capitalize for consistency
      const id = await join.mutateAsync(targetCode.trim().toUpperCase());

      if (id) {
        router.push(`/susu/${id}`);
      } else {
        await myGroups.refetch();
        Alert.alert("Joined", "You have successfully joined the circle.");
      }
    } catch (e: any) {
      // If already a member, just navigate if we have the ID
      if (e.message.toLowerCase().includes("already a member") && groupId) {
        router.push(`/susu/${groupId}`);
        return;
      }

      Alert.alert("Protocol Error", e.message);
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newAmount) return Alert.alert("Error", "Fill all fields");
    try {
      const id = await create.mutateAsync({ name: newName.trim(), contribution: parseFloat(newAmount), frequency: newFrequency });
      setShowCreateModal(false);
      router.push(`/susu/${id}`);
    } catch (e: any) {
      Alert.alert("Error", t.failed_create);
    }
  };

  const myGroupIds = new Set((myGroups.data ?? []).map((g) => g.id));
  const availableGroups = (allGroups.data ?? []).filter((g) => !myGroupIds.has(g.id));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KenteBackground />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
            <RefreshControl
                refreshing={myGroups.isRefetching}
                tintColor={colors.primary}
                onRefresh={() => myGroups.refetch()}
                progressViewOffset={insets.top + 20}
            />
        }
      >
        <View style={{ paddingHorizontal: 24 }}>

          <View style={styles.header}>
            <View style={styles.supHeaderRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.supHeaderText, { color: colors.primary }]}>{t.community_protocol}</Text>
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t.susu_circles}</Text>
          </View>

          {/* PROTOCOL SUMMARY (CLEAN) */}
          <Animated.View entering={FadeInDown.delay(200)} style={[styles.summaryBox, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
              <View style={styles.summaryRow}>
                  <View style={{ flex: 1 }}>
                      <Text style={[styles.summaryLabel, { color: colors.textDim }]}>{t.total_liquidity}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                          <Text style={{ color: colors.primary, fontSize: 14, fontFamily: 'Display-Bold', marginRight: 4 }}>GH₵</Text>
                          <AnimatedNumber
                              value={isPrivate ? 0 : totalContributed}
                              style={{ color: colors.text, fontSize: 32, fontFamily: 'Display-Bold' }}
                          />
                      </View>
                  </View>
                  <BarChart3 size={24} color={colors.primary} />
              </View>
          </Animated.View>

          {/* QUICK ACTION ROW (CLEAN) */}
          <View style={styles.actionRow}>
              <BouncyTap style={{ flex: 1 }} onPress={() => setShowCreateModal(true)}>
                  <View style={[styles.simpleActionBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '08' }]}>
                      <Plus size={20} color={colors.primary} strokeWidth={3} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>{t.create.toUpperCase()}</Text>
                  </View>
              </BouncyTap>

              <View style={[styles.simpleJoinBox, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
                  <TextInput
                      value={invite}
                      onChangeText={setInvite}
                      placeholder="JOIN CODE"
                      placeholderTextColor={colors.textDim}
                      style={[styles.miniInput, { color: colors.text }]}
                      autoCapitalize="characters"
                  />
                  <TouchableOpacity onPress={() => handleJoin()} style={[styles.goBtn, { backgroundColor: colors.primary }]}>
                      <ArrowRight size={16} color="#000" strokeWidth={3} />
                  </TouchableOpacity>
              </View>
          </View>

          {/* Membership List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: colors.textDim }]}>{t.your_memberships.toUpperCase()}</Text>
            </View>

            {myGroups.isLoading ? (
                <ActivityIndicator color={colors.primary} />
            ) : myGroups.data?.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Text style={[styles.emptyText, { color: colors.textDim }]}>{t.no_groups}</Text>
              </View>
            ) : (
              myGroups.data?.map((g, idx) => (
                <BouncyTap key={g.id} onPress={() => router.push(`/susu/${g.id}`)} style={{ marginBottom: 12 }}>
                  <View style={[styles.itemRow, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
                      <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontFamily: 'Display-Bold', fontSize: 14 }}>{g.name.toUpperCase()}</Text>
                          <Text style={{ color: colors.textDim, fontSize: 9, fontFamily: 'Display-Bold', opacity: 0.6 }}>{g.frequency.toUpperCase()} • {g.members_count} {t.members}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: colors.primary, fontFamily: 'Display-Bold', fontSize: 16 }}>{isPrivate ? "••••" : `GH₵ ${g.contribution}`}</Text>
                          <Text style={{ color: colors.textDim, fontSize: 7, fontFamily: 'Display-Bold', opacity: 0.5 }}>{t.per_cycle.toUpperCase()}</Text>
                      </View>
                  </View>
                </BouncyTap>
              ))
            )}
          </View>

          {/* Explore Public Circles */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: colors.textDim }]}>{t.explore_circles.toUpperCase()}</Text>
            </View>

            {availableGroups.map((g) => (
                <BouncyTap key={g.id} onPress={() => handleJoin(g.invite_code, g.id)} style={{ marginBottom: 12 }}>
                    <View style={[styles.itemRow, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontFamily: 'Display-Bold', fontSize: 14 }}>{g.name.toUpperCase()}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <Text style={{ color: colors.primary, fontSize: 10, fontFamily: 'Display-Bold' }}>GH₵ {g.contribution}</Text>
                                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textDim, opacity: 0.3 }} />
                                <Text style={{ color: colors.textDim, fontSize: 10, fontFamily: 'Display-Bold', opacity: 0.7 }}>{g.frequency.toUpperCase()}</Text>
                            </View>
                        </View>
                        <ChevronRight size={16} color={colors.textDim} />
                    </View>
                </BouncyTap>
            ))}
          </View>

          <View style={styles.footerBadge}>
             <ShieldCheck size={12} color={colors.textDim} />
             <Text style={{ color: colors.textDim, fontSize: 8, fontFamily: 'Display-Bold', letterSpacing: 1 }}>{t.secured_by}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
              <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={[styles.modalContent, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t.new_circle}</Text>
                  <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                    <X color={colors.textDim} size={24} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t.circle_name}</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                    placeholder={t.circle_name_placeholder}
                    placeholderTextColor={colors.textDim}
                    value={newName}
                    onChangeText={setNewName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t.contribution_amount}</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                    value={newAmount}
                    onChangeText={setNewAmount}
                  />
                </View>

                <BouncyTap onPress={handleCreate} disabled={create.isPending}>
                   <LinearGradient colors={[colors.primary, "#059669"]} style={styles.createBtnModal}>
                      {create.isPending ? <ActivityIndicator color="#000" /> : <Text style={styles.createBtnTextModal}>{t.create.toUpperCase()}</Text>}
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
  header: { marginBottom: 24, paddingHorizontal: 4 },
  supHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  supHeaderText: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1.5, opacity: 0.8 },
  headerTitle: { fontFamily: 'Display-Bold', fontSize: 30, letterSpacing: -0.5 },
  summaryBox: { padding: 24, borderRadius: 28, borderWidth: 1, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 2, marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  simpleActionBtn: { flex: 1, height: 56, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnText: { fontFamily: 'Display-Bold', fontSize: 11, letterSpacing: 1 },
  simpleJoinBox: { flex: 1.5, height: 56, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  miniInput: { flex: 1, fontFamily: 'Display-Bold', fontSize: 12, letterSpacing: 1 },
  goBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 32 },
  sectionHeader: { marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 2, opacity: 0.6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1, gap: 12 },
  emptyBox: { padding: 40, borderRadius: 28, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center' },
  emptyText: { fontFamily: 'Display-Bold', fontSize: 10, textAlign: 'center', lineHeight: 18 },
  footerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', marginTop: 20, opacity: 0.4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end', padding: 16 },
  modalContent: { padding: 32, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontFamily: 'Display-Bold', fontSize: 24 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
  modalInput: { height: 60, borderRadius: 18, paddingHorizontal: 20, fontFamily: 'Display-Bold', fontSize: 16, borderWidth: 1 },
  createBtnModal: { height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  createBtnTextModal: { color: '#000', fontFamily: 'Display-Bold', fontSize: 14, letterSpacing: 1 }
});
