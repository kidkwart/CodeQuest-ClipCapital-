import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, StyleSheet, ActivityIndicator, Modal, Alert, Keyboard, KeyboardAvoidingView, Platform, Vibration, Dimensions, TouchableWithoutFeedback, Image, FlatList, ImageBackground } from "react-native";
import { useMyGroups, useAllSusuGroups, useJoinGroup, useCreateGroup, useProfile } from "@/lib/app-queries";
import { Plus, X, Info, Users, Search, ArrowRight, Sparkles } from "lucide-react-native";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "@/context/language-context";
import { BlurView } from 'expo-blur';
import { KenteBackground } from "@/components/native/effects/kente-pattern";
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  Extrapolate
} from "react-native-reanimated";
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get("window");

// --- Community Node Particle for Background ---
function CommunityNode({ delay = 0 }: { delay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0);

  const startX = useState(() => (Math.random() * width) - width / 2)[0];
  const startY = useState(() => (Math.random() * 400) - 200)[0];
  const driftX = useState(() => (Math.random() * 60) - 30)[0];
  const driftY = useState(() => (Math.random() * 60) - 30)[0];

  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withSequence(withTiming(0.15, { duration: 2000 }), withTiming(0, { duration: 2000 })),
      -1, false
    ));
    translateY.value = withDelay(delay, withRepeat(
      withTiming(driftY, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      -1, true
    ));
    translateX.value = withDelay(delay, withRepeat(
      withTiming(driftX, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      -1, true
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(withTiming(1, { duration: 2000 }), withTiming(0.5, { duration: 2000 })),
      -1, true
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value }
    ],
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginTop: startY,
    marginLeft: startX,
  }));

  return (
    <Animated.View style={animatedStyle}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', opacity: 0.4 }} />
    </Animated.View>
  );
}

export default function SusuScreen() {
  const router = useRouter();
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
  const [modalStatus, setModalStatus] = useState({ text: "", type: "" });

  const isPrivate = profile?.privacy_mode_enabled ?? false;
  const isDark = theme === 'dark';

  const SUSU_INFO_SLIDES = [
    {
      id: "1",
      title: t.info_title_1,
      desc: t.info_desc_1,
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?q=80&w=1000&auto=format&fit=crop",
    },
    {
      id: "2",
      title: t.info_title_2,
      desc: t.info_desc_2,
      image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=1000&auto=format&fit=crop",
    },
    {
      id: "3",
      title: t.info_title_3,
      desc: t.info_desc_3,
      image: "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?q=80&w=1000&auto=format&fit=crop",
    },
    {
      id: "4",
      title: t.info_title_4,
      desc: t.info_desc_4,
      image: "https://images.unsplash.com/photo-1518458082568-d95c6503a5af?q=80&w=1000&auto=format&fit=crop",
    },
    {
      id: "5",
      title: t.info_title_5,
      desc: t.info_desc_5,
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop",
    }
  ];

  // 3D Tilt values for Action Row
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      rotateX.value = interpolate(event.y, [-height / 2, height / 2], [10, -10], Extrapolate.CLAMP);
      rotateY.value = interpolate(event.x, [-width / 2, width / 2], [-10, 10], Extrapolate.CLAMP);
    })
    .onEnd(() => {
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
    });

  const animatedActionStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const handleJoin = async (code?: string, groupId?: string) => {
    const targetCode = code || invite;
    if (!targetCode.trim()) {
      Alert.alert("Error", "Please enter an invite code.");
      return;
    }
    try {
      setJoiningId(groupId || "manual");
      const id = await join.mutateAsync(targetCode.trim());
      Vibration.vibrate(Platform.OS === 'ios' ? 1 : 10);
      setInvite("");
      if (id) router.push(`/susu/${id}`);
      else myGroups.refetch();
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
      const groupId = await create.mutateAsync({ name: newName.trim(), contribution: amount, frequency: newFrequency });
      setModalStatus({ text: t.success_redirect, type: "success" });
      Vibration.vibrate(Platform.OS === 'ios' ? 1 : 10);
      setTimeout(() => {
        setShowCreateModal(false);
        setNewName("");
        setNewAmount("");
        router.push(`/susu/${groupId}`);
      }, 1500);
    } catch (e: any) {
      setModalStatus({ text: t.failed_create, type: "error" });
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={myGroups.isLoading} tintColor={colors.primary} onRefresh={() => myGroups.refetch()} progressViewOffset={Platform.OS === 'ios' ? 110 : 0} />}
      >
        <View style={{ paddingHorizontal: 20 }}>

          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <View>
              <View style={styles.supHeaderRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.supHeaderText, { color: colors.primary }]}>{t.community_protocol} v1.8</Text>
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{t.susu_circles}</Text>
            </View>
          </Animated.View>

          {/* SWIPPABLE INFORMATION CAROUSEL WITH IMAGES */}
          <View style={styles.carouselContainer}>
            <FlatList
              data={SUSU_INFO_SLIDES}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.carouselSlide}>
                  <ImageBackground
                    source={{ uri: item.image }}
                    style={[styles.carouselCard, { borderColor: colors.border }]}
                    imageStyle={{ borderRadius: 28 }}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.85)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.carouselTextContent}>
                        <View style={[styles.infoBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Sparkles size={10} color={colors.primary} />
                            <Text style={[styles.infoBadgeText, { color: colors.primary }]}>{t.protocol_info || "INFO"}</Text>
                        </View>
                        <Text style={[styles.carouselTitle, { color: '#fff' }]}>{item.title}</Text>
                        <Text style={[styles.carouselDesc, { color: 'rgba(255,255,255,0.8)' }]}>{item.desc}</Text>
                    </View>
                  </ImageBackground>
                </View>
              )}
            />
          </View>

          {/* Action Row with 3D Tilt */}
          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.actionRow, animatedActionStyle]}>
                {/* Floating Node background for Action area */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <CommunityNode key={i} delay={i * 400} />
                    ))}
                </View>

                <BouncyTap style={{ flex: 1 }} onPress={() => setShowCreateModal(true)}>
                <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.actionCard, { borderColor: colors.border }]}>
                    <View style={[styles.createIconBg, { backgroundColor: colors.primary + '10' }]}>
                        <Plus size={20} color={colors.primary} strokeWidth={3} />
                    </View>
                    <Text style={[styles.actionTitleLabel, { color: colors.textDim }]}>{t.create.toUpperCase()}</Text>
                    <Text style={[styles.actionSubLabel, { color: colors.text }]}>{t.new_circle.toUpperCase()}</Text>
                </BlurView>
                </BouncyTap>

                <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={[styles.actionCard, { flex: 1.4, borderColor: colors.border }]}>
                    <Text style={[styles.actionTitleLabel, { color: colors.textDim }]}>{t.secure_join.toUpperCase()}</Text>
                    <View style={[styles.joinInputWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
                        <TextInput
                            value={invite}
                            onChangeText={setInvite}
                            placeholder={t.code}
                            placeholderTextColor={colors.textDim}
                            style={[styles.joinInput, { color: colors.text }]}
                            autoCapitalize="characters"
                        />
                        <BouncyTap onPress={() => handleJoin()} disabled={joiningId === "manual"} hitSlop={8}>
                            <LinearGradient
                            colors={[colors.primary, "#059669"]}
                            style={styles.joinBtnSmall}
                            >
                            {joiningId === "manual" ? <ActivityIndicator size="small" color="#000" /> : <ArrowRight size={16} color="#000" strokeWidth={3} />}
                            </LinearGradient>
                        </BouncyTap>
                    </View>
                </BlurView>
            </Animated.View>
          </GestureDetector>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Animated.Text entering={FadeInRight.delay(300)} style={[styles.sectionTitle, { color: colors.textDim }]}>{t.your_memberships.toUpperCase()}</Animated.Text>
               <Users size={14} color={colors.textDim} />
            </View>

            {myGroups.data?.length === 0 ? (
              <View style={[styles.emptyCard, { borderColor: colors.border }]}>
                <Info size={40} color={colors.textDim} />
                <Text style={[styles.emptyText, { color: colors.textDim }]}>{t.no_groups}</Text>
              </View>
            ) : (
              myGroups.data?.map((g, idx) => (
                <Animated.View key={g.id} entering={FadeInDown.delay(400 + (idx * 50))}>
                  <BouncyTap onPress={() => router.push(`/susu/${g.id}`)} style={{ marginBottom: 12 }}>
                    <BlurView intensity={isDark ? 15 : 30} tint={isDark ? "dark" : "light"} style={[styles.membershipCard, { borderColor: colors.border }]}>
                        <View style={[styles.groupIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <Users size={20} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontFamily: 'Display-Bold', fontSize: 14 }}>{g.name.toUpperCase()}</Text>
                            <Text style={{ color: colors.textDim, fontSize: 9, fontFamily: 'Display-Bold', opacity: 0.6, letterSpacing: 1 }}>{g.frequency.toUpperCase()} • {g.members_count} {t.members}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: colors.primary, fontFamily: 'Display-Bold', fontSize: 16 }}>{isPrivate ? "••••" : `GH₵ ${g.contribution}`}</Text>
                            <Text style={{ color: colors.textDim, fontSize: 7, fontFamily: 'Display-Bold', opacity: 0.5, letterSpacing: 1 }}>{t.per_cycle}</Text>
                        </View>
                    </BlurView>
                  </BouncyTap>
                </Animated.View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Animated.Text entering={FadeInRight.delay(500)} style={[styles.sectionTitle, { color: colors.textDim }]}>{t.explore_circles.toUpperCase()}</Animated.Text>
               <Search size={14} color={colors.textDim} />
            </View>

            {availableGroups.length === 0 ? (
              <Text style={[styles.subText, { color: colors.textDim }]}>{t.no_public}</Text>
            ) : (
              availableGroups.map((g, idx) => (
                <Animated.View key={g.id} entering={FadeInDown.delay(600 + (idx * 50))}>
                    <BouncyTap onPress={() => handleJoin(g.invite_code, g.id)} style={{ marginBottom: 12 }}>
                        <BlurView intensity={isDark ? 15 : 30} tint={isDark ? "dark" : "light"} style={[styles.membershipCard, { borderColor: colors.border }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: colors.text, fontFamily: 'Display-Bold', fontSize: 14 }}>{g.name.toUpperCase()}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                    <Text style={{ color: colors.primary, fontSize: 10, fontFamily: 'Display-Bold' }}>GH₵ {g.contribution}</Text>
                                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textDim, opacity: 0.3 }} />
                                    <Text style={{ color: colors.textDim, fontSize: 10, fontFamily: 'Display-Bold', opacity: 0.7 }}>{g.frequency.toUpperCase()}</Text>
                                </View>
                            </View>
                            <LinearGradient
                                colors={[colors.primary, "#059669"]}
                                style={styles.exploreJoinBtn}
                            >
                                {joiningId === g.id ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <Text style={styles.exploreJoinText}>{t.join}</Text>
                                )}
                            </LinearGradient>
                        </BlurView>
                    </BouncyTap>
                </Animated.View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
              <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={[styles.modalContent, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)', borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t.new_circle}</Text>
                  <BouncyTap onPress={() => setShowCreateModal(false)}>
                    <X color={colors.textDim} />
                  </BouncyTap>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t.circle_name}</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: colors.text, borderColor: colors.border }]}
                    placeholder={t.circle_name_placeholder}
                    placeholderTextColor={colors.textDim}
                    value={newName}
                    onChangeText={setNewName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t.amount.toUpperCase()} (GH₵)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', color: colors.text, borderColor: colors.border }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                    value={newAmount}
                    onChangeText={setNewAmount}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>{t.freq}</Text>
                  <View style={styles.freqRow}>
                    {[t.daily, t.weekly, t.monthly].map((f) => (
                      <TouchableOpacity
                        key={f}
                        onPress={() => setNewFrequency(f)}
                        style={[styles.freqBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }, newFrequency === f && { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
                      >
                        <Text style={[styles.freqBtnText, { color: colors.textDim }, newFrequency === f && { color: colors.primary }]}>{f.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {modalStatus.text !== "" && (
                  <View style={[styles.statusBox, { borderColor: modalStatus.type === 'success' ? colors.primary + '40' : colors.destructive + '40', backgroundColor: (modalStatus.type === 'success' ? colors.primary : colors.destructive) + '10' }]}>
                    <Text style={[styles.statusText, { color: modalStatus.type === 'success' ? colors.primary : colors.destructive }]}>{modalStatus.text}</Text>
                  </View>
                )}

                <BouncyTap onPress={handleCreate} disabled={create.isPending}>
                   <LinearGradient colors={[colors.primary, "#059669"]} style={styles.createBtnModal}>
                      {create.isPending ? <ActivityIndicator color="#000" /> : <Text style={styles.createBtnTextModal}>{t.create.toUpperCase()} {t.groups.toUpperCase()}</Text>}
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
  scrollContent: { paddingBottom: 140, paddingTop: 40 },
  header: { marginBottom: 24, paddingHorizontal: 4, marginTop: 10 },
  supHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  supHeaderText: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1.5, opacity: 0.8 },
  headerTitle: { fontFamily: 'Display-Bold', fontSize: 30, letterSpacing: -0.5 },
  carouselContainer: { marginBottom: 32, height: 200 },
  carouselSlide: { width: width - 40, marginRight: 0 },
  carouselCard: { height: 200, borderRadius: 28, overflow: 'hidden', borderWidth: 1, backgroundColor: '#000' },
  carouselImage: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  carouselOverlay: { ...StyleSheet.absoluteFillObject },
  carouselTextContent: { position: 'absolute', bottom: 24, left: 24, right: 24 },
  infoBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginBottom: 12 },
  infoBadgeText: { fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 1.5 },
  carouselTitle: { fontFamily: 'Display-Bold', fontSize: 18, letterSpacing: 1, marginBottom: 6 },
  carouselDesc: { fontFamily: 'Display-Bold', fontSize: 13, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  actionCard: { height: 140, borderRadius: 24, padding: 20, justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  createIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionTitleLabel: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1.5 },
  actionSubLabel: { fontFamily: 'Display-Bold', fontSize: 12, marginTop: 2 },
  joinInputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 4, borderWidth: 1, marginTop: 12 },
  joinInput: { flex: 1, height: 40, paddingHorizontal: 12, fontFamily: 'Display-Bold', fontSize: 14 },
  joinBtnSmall: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 1.5 },
  membershipCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, gap: 12, overflow: 'hidden' },
  groupIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  exploreJoinBtn: { paddingHorizontal: 16, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  exploreJoinText: { color: '#000', fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 1 },
  subText: { fontFamily: 'Display-Bold', fontSize: 10, textAlign: 'center', marginTop: 20, opacity: 0.6 },
  emptyCard: { padding: 40, alignItems: 'center', gap: 12, borderRadius: 32, borderWidth: 1, borderStyle: 'dashed' },
  emptyText: { fontFamily: 'Display-Bold', fontSize: 10, textAlign: 'center', letterSpacing: 1, opacity: 0.6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end', padding: 16 },
  modalContent: { padding: 32, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontFamily: 'Display-Bold', fontSize: 24, letterSpacing: -0.5 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
  modalInput: { height: 64, borderRadius: 20, paddingHorizontal: 20, fontFamily: 'Display-Bold', fontSize: 18, borderWidth: 1 },
  freqRow: { flexDirection: 'row', gap: 10 },
  freqBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  freqBtnText: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 1 },
  statusBox: { padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1 },
  statusText: { fontFamily: 'Display-Bold', fontSize: 11, textAlign: 'center', letterSpacing: 1 },
  createBtnModal: { height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  createBtnTextModal: { color: '#000', fontFamily: 'Display-Bold', fontSize: 14, letterSpacing: 1 }
});
