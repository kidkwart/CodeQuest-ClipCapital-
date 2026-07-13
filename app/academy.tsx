import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, RefreshControl } from "react-native";
import { Stack, useRouter } from "expo-router";
import { BouncyTap } from "@/components/native/bouncy-tap";
import * as Lucide from "lucide-react-native";
import { useAcademyContent, useAcademyProgress, useCompleteLesson } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "@/context/language-context";

export default function AcademyScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const { t } = useLanguage();
  const { data: content, isLoading: loadingContent, refetch, error } = useAcademyContent();
  const { data: progress, isLoading: loadingProgress } = useAcademyProgress();
  const completeLesson = useCompleteLesson();

  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  const handleComplete = async (id: string) => {
    try {
      await completeLesson.mutateAsync(id);
      setSelectedLesson(null);
      Alert.alert(t.knowledge_unlocked, t.knowledge_unlocked_desc);
    } catch (e: any) {
      Alert.alert("Error", "You may have already completed this lesson.");
    }
  };

  if (loadingContent || loadingProgress) {
    return (
      <View style={[styles.container, { justifyContent: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <BouncyTap onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}>
            <Lucide.ArrowLeft size={20} color={colors.text} />
          </BouncyTap>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 12, marginRight: 20 }}>
            <BouncyTap onPress={() => router.push("/support")} style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}>
              <Lucide.HelpCircle size={20} color={colors.primary} />
            </BouncyTap>
          </View>
        )
      }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loadingContent} onRefresh={refetch} tintColor={colors.primary} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title={t.academy} subtitle={t.biz_growth} />

          <View style={styles.statsRow}>
            <Card style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{progress?.length || 0}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t.completed}</Text>
            </Card>
            <Card style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.gold }]}>{(progress?.length || 0) * 5}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t.points}</Text>
            </Card>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t.available_modules}</Text>

          {(!content || content.length === 0) ? (
            <View style={styles.emptyState}>
              <Lucide.BookOpen size={48} color={colors.textDim} />
              <Text style={{ color: colors.text, marginTop: 16, textAlign: 'center', opacity: 0.7 }}>
                {error ? t.connection_issue : t.no_lessons_available}
              </Text>
            </View>
          ) : (
            content.map((lesson) => {
              const isDone = progress?.includes(lesson.id);
              return (
                <BouncyTap key={lesson.id} onPress={() => setSelectedLesson(lesson)}>
                  <Card style={[styles.lessonCard, { backgroundColor: colors.cardBg, borderColor: isDone ? colors.primary + '40' : colors.border }]}>
                    <View style={styles.lessonInfo}>
                      <View style={[styles.iconBox, { backgroundColor: isDone ? colors.primary + '10' : colors.surfaceElevated }]}>
                         {isDone ? <Lucide.CheckCircle2 size={20} color={colors.primary} /> : <Lucide.BookOpen size={20} color={colors.textMuted} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
                        <Text style={[styles.lessonMeta, { color: colors.textDim }]}>{lesson.category} • {lesson.estimated_time}m read</Text>
                      </View>
                      {isDone ? null : <Lucide.ChevronRight size={16} color={colors.textDim} />}
                    </View>
                  </Card>
                </BouncyTap>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={!!selectedLesson} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedLesson(null)}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={styles.modalTop}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t.learning_module}</Text>
                  <TouchableOpacity onPress={() => setSelectedLesson(null)}><Lucide.X color={colors.text} /></TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
                  <Text style={[styles.contentCategory, { color: colors.primary }]}>{selectedLesson?.category?.toUpperCase()}</Text>
                  <Text style={[styles.contentTitle, { color: colors.text }]}>{selectedLesson?.title}</Text>

                  <View style={[styles.contentBody, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      <Text style={[styles.contentText, { color: colors.text }]}>{selectedLesson?.content}</Text>
                  </View>

                  <View style={styles.rewardBox}>
                      <Lucide.Trophy size={20} color={colors.gold} />
                      <Text style={{ color: colors.text, fontWeight: 'bold' }}>{t.reward}: +{selectedLesson?.score_reward} ClipScore Points</Text>
                  </View>

                  {!progress?.includes(selectedLesson?.id) && (
                    <Button
                        title={t.complete_lesson}
                        onPress={() => handleComplete(selectedLesson.id)}
                        loading={completeLesson.isPending}
                    />
                  )}
              </ScrollView>
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 100, paddingBottom: 40 },
  headerBtn: { height: 44, width: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statBox: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 20 },
  statValue: { fontSize: 24, fontFamily: 'Display-Bold' },
  statLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 },
  lessonCard: { padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  lessonInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lessonTitle: { fontWeight: 'bold', fontSize: 15 },
  lessonMeta: { fontSize: 12, marginTop: 2 },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  modalContainer: { flex: 1 },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  contentCategory: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  contentTitle: { fontFamily: 'Display-Bold', fontSize: 28, marginBottom: 24 },
  contentBody: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 32 },
  contentText: { fontSize: 16, lineHeight: 26 },
  rewardBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32, justifyContent: 'center' }
});
