import React from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTransactionHistory } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, ShoppingBag, Wallet, Banknote, Clock } from "lucide-react-native";

export default function HistoryScreen() {
  const router = useRouter();
  const { data: history, isLoading, refetch } = useTransactionHistory();

  const getIcon = (type: string, amount: number) => {
    if (type === "order") return <ShoppingBag size={18} color="#f59e0b" />;
    if (type.startsWith("susu")) return <Wallet size={18} color="#10b981" />;
    if (type.startsWith("loan")) return <Banknote size={18} color="#10b981" />;
    return amount > 0 ? <ArrowUpRight size={18} color="#10b981" /> : <ArrowDownLeft size={18} color="#ef4444" />;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginLeft: 16, h: 40, w: 40, borderRadius: 12, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor="#10B981" onRefresh={refetch} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="History" subtitle="Financial Audit" />

          {isLoading ? (
            <View style={{ py: 80, alignItems: 'center' }}><Text style={{ color: '#10b981', fontWeight: '900', letterSpacing: 2 }}>ANALYZING RECORDS...</Text></View>
          ) : (history ?? []).length === 0 ? (
            <View style={{ py: 80, alignItems: 'center', opacity: 0.3, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 40 }}>
               <Clock size={48} color="#405045" />
               <Text style={{ color: 'white', fontWeight: 'bold', mt: 16, fontStyle: 'italic' }}>Clean ledger</Text>
            </View>
          ) : (
            <View style={{ paddingBottom: 40 }}>
              {history?.map((t, idx) => (
                <View key={`${t.type}-${t.id}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24, borderBottomWidth: idx !== history!.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 18, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                      {getIcon(t.type, t.amount)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>{t.title}</Text>
                      <Text style={{ color: '#7d8a84', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', mt: 4, letterSpacing: 1 }}>
                        {new Date(t.date).toLocaleDateString()} · {t.status || 'COMPLETED'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontFamily: 'Display-Bold', fontSize: 16, color: t.amount > 0 ? '#10b981' : '#ef4444' }}>
                    {t.amount > 0 ? '+' : '-'} {Math.abs(t.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
