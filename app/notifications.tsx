import React from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { Bell, ArrowLeft, CheckCircle2, Info, AlertTriangle, Clock } from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { BlurView } from "expo-blur";

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            className="ml-4 h-10 w-10 rounded-xl bg-surface items-center justify-center border border-white/5"
          >
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
        ),
        headerRight: () => unreadCount > 0 ? (
          <TouchableOpacity
            onPress={() => markAllRead.mutate()}
            className="mr-4 px-4 py-2 bg-[#10b981]/10 rounded-full border border-[#10b981]/20"
          >
            <Text className="text-[#10b981] text-[9px] font-black uppercase tracking-[0.2em]">Sweep All</Text>
          </TouchableOpacity>
        ) : null
      }} />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor="#10B981" onRefresh={refetch} />}
      >
        <PremiumHeader title="Alert Center" subtitle="Real-time Updates" />

        {isLoading ? (
          <ActivityIndicator color="#10b981" className="mt-20" />
        ) : (notifications ?? []).length === 0 ? (
          <Animated.View entering={FadeInDown} className="items-center justify-center py-24 opacity-40">
            <View className="h-20 w-20 rounded-[30px] bg-white/5 items-center justify-center border border-white/5 mb-6">
              <Bell size={40} color="#405045" />
            </View>
            <Text className="text-white font-bold text-lg">Inbox Zero</Text>
            <Text className="text-[#7d8a84] text-xs mt-2 tracking-widest uppercase font-black">All quiet on the trade front</Text>
          </Animated.View>
        ) : (
          <View className="pb-20">
            {notifications?.map((n, idx) => (
              <Animated.View
                key={n.id}
                entering={FadeInDown.delay(idx * 50)}
                exiting={FadeOut}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => !n.read && markRead.mutate(n.id)}
                >
                  <Card glass={!n.read} className={cn(
                    "mb-4 p-6 flex-row gap-5",
                    n.read ? "bg-surface/30 opacity-40 grayscale border-white/5" : "border-primary/20 shadow-xl"
                  )}>
                    {/* Activity Type Icon */}
                    <View className={cn(
                      "h-14 w-14 rounded-[22px] items-center justify-center border",
                      n.type === 'alert' ? 'bg-red-500/10 border-red-500/20' : 'bg-primary/10 border-primary/20'
                    )}>
                      {n.type === 'alert' ? <AlertTriangle size={24} color="#ef4444" /> : <Info size={24} color="#10b981" />}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row justify-between items-start mb-2">
                        <Text className="text-white font-bold text-sm flex-1 mr-2 leading-tight">{n.title}</Text>
                        {!n.read && <View className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shadow-lg shadow-emerald-500" />}
                      </View>
                      <Text className="text-[#b2baac] text-[11px] leading-relaxed mb-3" numberOfLines={2}>{n.body}</Text>

                      <View className="flex-row items-center gap-1.5 opacity-50">
                        <Clock size={10} color="#7d8a84" />
                        <Text className="text-[#7d8a84] text-[9px] font-black uppercase tracking-widest">
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
      </ScrollView>
    </View>
  );
}

import { cn } from "@/lib/utils";
