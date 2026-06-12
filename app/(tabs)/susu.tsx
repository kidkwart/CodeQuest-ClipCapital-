import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, StyleSheet } from "react-native";
import { useMyGroups, useAllSusuGroups, useJoinGroup } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { Users, Wallet, Plus, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function Susu() {
  const router = useRouter();
  const myGroups = useMyGroups();
  const allGroups = useAllSusuGroups();
  const join = useJoinGroup();
  const [invite, setInvite] = useState("");

  const myGroupIds = new Set((myGroups.data ?? []).map((g) => g.id));
  const availableGroups = (allGroups.data ?? []).filter((g) => !myGroupIds.has(g.id));

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 60 }}
        refreshControl={<RefreshControl refreshing={myGroups.isLoading} tintColor="#10B981" />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="Susu Circles" subtitle="Community Capital" />

          {/* Join Private Section */}
          <Card glass style={{ marginBottom: 40 }}>
            <Text style={{ color: '#f59e0b', fontWeight: '900', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Join Private Circle</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TextInput
                value={invite}
                onChangeText={setInvite}
                placeholder="Enter Code"
                placeholderTextColor="#405045"
                style={{ flex: 1, height: 56, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 20, color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                maxLength={8}
              />
              <TouchableOpacity
                onPress={() => join.mutateAsync(invite)}
                style={{ height: 56, width: 56, backgroundColor: '#f59e0b', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </Card>

          {/* My Active Groups */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24, marginLeft: 8 }}>Your Memberships</Text>
            {myGroups.data?.map((g) => (
              <TouchableOpacity key={g.id} onPress={() => router.push(`/susu/${g.id}`)} activeOpacity={0.8}>
                <Card style={{ marginBottom: 16, padding: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', marginRight: 16 }}>
                      <Users size={24} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 18 }}>{g.name}</Text>
                      <Text style={{ color: '#7d8a84', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 }}>{g.frequency} · {g.members_count} Members</Text>
                    </View>
                    <View style={{ alignItems: 'end' }}>
                      <Text style={{ fontFamily: 'Display-Bold', color: '#10B981', fontSize: 20 }}>GH₵ {g.contribution}</Text>
                      <ChevronRight size={16} color="#405045" style={{ marginTop: 4 }} />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          {/* Explore Circles */}
          <View>
            <Text style={{ color: 'rgba(252,252,252,0.3)', fontWeight: '900', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24, marginLeft: 8 }}>Public Circles</Text>
            {availableGroups.map((g) => (
              <Card key={g.id} style={{ marginBottom: 16, padding: 20, backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 14 }}>{g.name}</Text>
                    <Text style={{ color: '#7d8a84', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginTop: 2 }}>Pot: GH₵ {g.pot}</Text>
                  </View>
                  <Button title="Join" size="sm" variant="outline" onPress={() => join.mutateAsync(g.invite_code)} style={{ height: 36, paddingHorizontal: 16 }} />
                </View>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
