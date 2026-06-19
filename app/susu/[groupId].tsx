import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useGroup, useGroupMembers, useGroupContributions, useRecordContribution } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, Users, Check, Clock, ShieldCheck } from "lucide-react-native";

export default function GroupDetails() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  const group = useGroup(groupId as string);
  const members = useGroupMembers(groupId as string);
  const contributions = useGroupContributions(groupId as string);

  const [amount, setAmount] = useState("");

  if (group.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#080c0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16, height: 40, width: 40, borderRadius: 12, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
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
          <PremiumHeader title={group.data?.name || "Susu Circle"} subtitle="Collective Savings" />

          {/* Pot Information Card */}
          <Card style={{ backgroundColor: '#10b981', marginBottom: 40, padding: 28, height: 160, overflow: 'hidden' }}>
            <View style={{ flex: 1, justifyContent: 'space-between', zIndex: 10 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 4 }}>Total Group Pot</Text>
              <View>
                <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 40, letterSpacing: -2 }}>GH₵ {group.data?.pot || 0}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>{group.data?.frequency} Rotation</Text>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 }}>
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>CYCLE {group.data?.cycle_index}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Contribution Action */}
          <View style={{ marginBottom: 48 }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Make Contribution</Text>
            <Card glass style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
              <Input
                label="Amount (GH₵)"
                value={amount}
                onChangeText={setAmount}
                placeholder={String(group.data?.contribution || "0.00")}
                keyboardType="numeric"
                containerClassName="mb-6"
              />
              <Button
                title="Pay via MoMo"
                onPress={() => alert("Payment UI would open here")}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, opacity: 0.6 }}>
                <ShieldCheck size={14} color="#10b981" />
                <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Secured by ClipCapital</Text>
              </View>
            </Card>
          </View>

          {/* Members List */}
          <View style={{ marginBottom: 48 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, marginLeft: 8 }}>
               <Users size={18} color="#10B981" />
               <Text style={{ color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase' }}>Circle Members</Text>
            </View>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {members.data?.map((m: any, idx: number) => (
                <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: idx !== members.data!.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#10b981', fontWeight: 'bold' }}>{idx + 1}</Text>
                    </View>
                    <View>
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>{m.profiles?.display_name || "Member"}</Text>
                      {m.has_received && <Text style={{ color: '#10b981', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginTop: 2 }}>Received Payout</Text>}
                    </View>
                  </View>
                  {m.has_received ? <Check size={16} color="#10b981" /> : <Clock size={16} color="#405045" />}
                </View>
              ))}
            </Card>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
