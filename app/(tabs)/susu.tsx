import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { useMyGroups, useAllSusuGroups, useJoinGroup } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { Users, Wallet, Search, Plus, ChevronRight } from "lucide-react-native";
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
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 140, paddingTop: 60 }}
      refreshControl={<RefreshControl refreshing={myGroups.isLoading} tintColor="#10B981" />}
    >
      <View className="px-6">
        <PremiumHeader title="Susu Circles" subtitle="Community Capital" />

        {/* Private Invite - Glass Card */}
        <Card glass className="mb-10">
          <Text className="text-gold font-black text-[10px] uppercase tracking-[0.3em] mb-4">Join Private Circle</Text>
          <View className="flex-row gap-3">
            <TextInput
              value={invite}
              onChangeText={setInvite}
              placeholder="Enter Code"
              placeholderTextColor="#405045"
              className="flex-1 bg-white/5 h-14 rounded-2xl px-5 text-white font-bold tracking-widest text-lg border border-white/5"
              maxLength={8}
            />
            <TouchableOpacity
              onPress={() => join.mutateAsync(invite)}
              className="bg-gold h-14 w-14 rounded-2xl items-center justify-center shadow-lg"
            >
              <Plus size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Active Groups Section */}
        <View className="mb-10">
          <Text className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mb-6 ml-1">Your Memberships</Text>
          {myGroups.data?.map((g) => (
            <TouchableOpacity key={g.id} onPress={() => router.push(`/susu/${g.id}`)} activeOpacity={0.8}>
              <Card className="mb-4 flex-row items-center border-emerald-500/20">
                <View className="h-14 w-14 rounded-[20px] bg-emerald-500/10 items-center justify-center border border-emerald-500/20 mr-4">
                  <Users size={24} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-lg tracking-tight">{g.name}</Text>
                  <Text className="text-muted-foreground text-[10px] uppercase font-black">{g.frequency} · {g.members_count} Members</Text>
                </View>
                <View className="items-end">
                  <Text style={{ fontFamily: 'Display-Bold' }} className="text-primary text-xl">GH₵ {g.contribution}</Text>
                  <ChevronRight size={16} color="#405045" />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Explore Section */}
        <View>
          <Text className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mb-6 ml-1">Public Circles</Text>
          {availableGroups.map((g) => (
            <Card key={g.id} className="mb-4 flex-row items-center bg-white/5">
              <View className="flex-1">
                <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-sm">{g.name}</Text>
                <Text className="text-muted-foreground text-[9px] uppercase font-bold mt-1">Pot: GH₵ {g.pot}</Text>
              </View>
              <Button title="Join" size="sm" variant="outline" onPress={() => join.mutateAsync(g.invite_code)} />
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
