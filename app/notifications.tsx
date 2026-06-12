import React from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { Bell, ArrowLeft, CheckCircle2, Info, AlertTriangle, Clock, Inbox } from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { LinearGradient } from "expo-linear-gradient";

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <BouncyTap
            onPress={() => router.back()}
            style={styles.headerBtn}
          >
            <ArrowLeft size={20} color="#FFF" />
          </BouncyTap>
        ),
        headerRight: () => unreadCount > 0 ? (
          <BouncyTap
            onPress={() => markAllRead.mutate()}
            style={styles.sweepBtn}
          >
            <Text style={styles.sweepBtnText}>SWEEP ALL</Text>
          </BouncyTap>
        ) : null
      }} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor="#10B981" onRefresh={refetch} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="Alert Center" subtitle="Real-time Updates" />

          {isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color="#10b981" />
              <Text style={styles.loaderText}>SYNCING PROTOCOL...</Text>
            </View>
          ) : (notifications ?? []).length === 0 ? (
            <Animated.View entering={FadeInDown} style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Inbox size={40} color="#405045" />
              </View>
              <Text style={styles.emptyTitle}>Secure & Clear</Text>
              <Text style={styles.emptySubtitle}>ALL SYSTEM LOGS ARE CURRENTLY UP TO DATE.</Text>
            </Animated.View>
          ) : (
            <View style={{ paddingBottom: 60 }}>
              {notifications?.map((n, idx) => (
                <Animated.View
                  key={n.id}
                  entering={FadeInDown.delay(idx * 50)}
                  exiting={FadeOut}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => !n.read && markRead.mutate(n.id)}
                    style={styles.cardWrapper}
                  >
                    <Card style={[styles.notifCard, n.read && styles.notifCardRead]}>
                      <View style={[styles.typeIconBox, { backgroundColor: n.type === 'alert' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }]}>
                        {n.type === 'alert' ? <AlertTriangle size={20} color="#ef4444" /> : <Info size={20} color="#10b981" />}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.notifHeader}>
                          <Text style={[styles.notifTitle, n.read && styles.notifTitleRead]} numberOfLines={1}>{n.title}</Text>
                          {!n.read && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={[styles.notifBody, n.read && styles.notifBodyRead]} numberOfLines={2}>{n.body}</Text>

                        <View style={styles.notifFooter}>
                          <Clock size={10} color="#405045" />
                          <Text style={styles.timeText}>
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c0a' },
  scrollContent: { paddingTop: 100, paddingBottom: 40 },
  headerBtn: { marginLeft: 16, height: 44, width: 44, borderRadius: 14, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  sweepBtn: { marginRight: 16, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.1)' },
  sweepBtnText: { color: '#10b981', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  loader: { paddingVertical: 80, alignItems: 'center', gap: 16 },
  loaderText: { color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  emptyState: { paddingVertical: 100, alignItems: 'center', opacity: 0.5 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 24 },
  emptyTitle: { color: 'white', fontFamily: 'Display-Bold', fontSize: 22, marginBottom: 8 },
  emptySubtitle: { color: '#7d8a84', fontSize: 9, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  cardWrapper: { marginBottom: 12 },
  notifCard: { padding: 20, flexDirection: 'row', gap: 16, backgroundColor: '#0f1714' },
  notifCardRead: { opacity: 0.4, backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.02)' },
  typeIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  notifTitle: { color: 'white', fontWeight: 'bold', fontSize: 14, flex: 1, marginRight: 8 },
  notifTitleRead: { fontWeight: '600' },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', shadowColor: '#10b981', shadowOpacity: 0.5, shadowRadius: 4 },
  notifBody: { color: '#b2baac', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  notifBodyRead: { color: '#7d8a84' },
  notifFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { color: '#405045', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }
});
