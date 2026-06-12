import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useGroup, useGroupMembers, useGroupContributions, useRecordContribution } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, Users, Check, Clock, ShieldCheck, Wallet, ChevronRight, TrendingUp } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function GroupDetails() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  const group = useGroup(groupId as string);
  const members = useGroupMembers(groupId as string);
  const [amount, setAmount] = useState("");

  if (group.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#080c0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  const currentCycle = group.data?.cycle_index || 1;

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={group.isLoading} tintColor="#10B981" />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title={group.data?.name || "Susu Circle"} subtitle="Live Payout Track" />

          {/* Elite Rotation Track */}
          <View style={{ marginBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, marginLeft: 8 }}>
               <TrendingUp size={16} color="#10B981" />
               <Text style={{ color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase' }}>Rotation Order</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
              <View style={{ flexDirection: 'row', gap: 16, paddingBottom: 20 }}>
                {members.data?.sort((a,b) => a.payout_order - b.payout_order).map((m: any, idx: number) => {
                  const isCurrent = m.payout_order === currentCycle;
                  const isPassed = m.payout_order < currentCycle;

                  return (
                    <Animated.View
                      key={m.id}
                      layout={Layout.springify()}
                      entering={FadeInRight.delay(idx * 100)}
                      style={[styles.trackNode, isCurrent && styles.activeNode]}
                    >
                      <View style={[styles.nodeIcon, (isCurrent || isPassed) && { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                        {isPassed ? <Check size={14} color="#10b981" /> : <Text style={[styles.nodeIdx, isCurrent && { color: '#10b981' }]}>{m.payout_order}</Text>}
                      </View>
                      <Text numberOfLines={1} style={[styles.nodeName, isCurrent && { color: 'white' }]}>
                        {m.profiles?.display_name?.split(' ')[0]}
                      </Text>
                      {isCurrent && (
                        <LinearGradient
                          colors={['#10b981', '#064e3b']}
                          style={styles.currentBadge}
                        >
                          <Text style={styles.currentBadgeText}>PAYOUT</Text>
                        </LinearGradient>
                      )}
                    </Animated.View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Pot Card */}
          <Card style={{ backgroundColor: '#10b981', marginBottom: 40, padding: 32, height: 180, overflow: 'hidden', borderRadius: 40 }}>
            <View style={{ flex: 1, justifyContent: 'space-between', zIndex: 10 }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 4 }}>Accumulated Pot</Text>
                <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 48, letterSpacing: -2, marginTop: 4 }}>GH₵ {group.data?.pot || 0}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={12} color="white" />
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>{group.data?.frequency} Cycle</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>#{currentCycle} IN LINE</Text>
                </View>
              </View>
            </View>
            <Wallet size={200} color="white" style={{ position: 'absolute', right: -60, bottom: -60, opacity: 0.15, transform: [{ rotate: '-15deg' }] }} />
          </Card>

          {/* Contribution Action */}
          <View style={{ marginBottom: 48 }}>
            <Text style={styles.sectionLabel}>Next Payment</Text>
            <Card glass style={{ borderColor: 'rgba(16,185,129,0.2)', padding: 32 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                 <View>
                   <Text style={{ color: 'white', fontFamily: 'Display-Bold', fontSize: 24 }}>GH₵ {group.data?.contribution}</Text>
                   <Text style={{ color: '#7d8a84', fontSize: 11, marginTop: 4, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Due for Cycle #{currentCycle}</Text>
                 </View>
                 <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
                    <ShieldCheck size={28} color="#10b981" />
                 </View>
              </View>
              <Button
                title="Deposit via MoMo"
                onPress={() => alert("Initializing Secure Payment...")}
              />
            </Card>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    marginLeft: 16,
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: '#0f1714',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  sectionLabel: {
    color: 'rgba(252,252,252,0.3)',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 20,
    marginLeft: 8
  },
  trackNode: {
    width: 110,
    alignItems: 'center',
    padding: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'relative'
  },
  activeNode: {
    backgroundColor: 'rgba(16,185,129,0.05)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  nodeIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  nodeIdx: {
    color: 'rgba(252,252,252,0.3)',
    fontFamily: 'Display-Bold',
    fontSize: 14
  },
  nodeName: {
    color: 'rgba(252,252,252,0.4)',
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center'
  },
  currentBadge: {
    position: 'absolute',
    bottom: -10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: '#080c0a',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
