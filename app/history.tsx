import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTransactionHistory, useProfile } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, ShoppingBag, Wallet, Banknote, Clock, Filter, Calendar } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';

export default function HistoryScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: history, isLoading, refetch } = useTransactionHistory();
  const [activeFilter, setActiveFilter] = useState<"all" | "in" | "out">("all");

  const isPrivate = profile?.privacy_mode_enabled ?? false;

  const getIcon = (type: string, amount: number) => {
    if (type === "order") return <ShoppingBag size={18} color="#f59e0b" />;
    if (type.startsWith("susu")) return <Wallet size={18} color="#10b981" />;
    if (type.startsWith("loan")) return <Banknote size={18} color="#10b981" />;
    return amount > 0 ? <ArrowUpRight size={18} color="#10b981" /> : <ArrowDownLeft size={18} color="#ef4444" />;
  };

  const filteredHistory = (history ?? []).filter(t => {
    if (activeFilter === 'in') return t.amount > 0;
    if (activeFilter === 'out') return t.amount < 0;
    return true;
  });

  const totalIn = (history ?? []).filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const totalOut = (history ?? []).filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
          >
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor="#10B981" onRefresh={refetch} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="History" subtitle="Institutional Ledger" />

          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <LinearGradient colors={['#0f1714', '#080c0a']} style={styles.summaryCard}>
               <Text style={styles.summaryLabel}>TOTAL INFLOW</Text>
               <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                  {isPrivate ? "••••••" : `GH₵ ${totalIn.toLocaleString()}`}
               </Text>
            </LinearGradient>
            <LinearGradient colors={['#0f1714', '#080c0a']} style={styles.summaryCard}>
               <Text style={styles.summaryLabel}>TOTAL OUTFLOW</Text>
               <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                  {isPrivate ? "••••••" : `GH₵ ${totalOut.toLocaleString()}`}
               </Text>
            </LinearGradient>
          </View>

          {/* Filters */}
          <View style={styles.filterRow}>
            {(['all', 'in', 'out'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                  {f.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading ? (
            <View style={styles.loaderContainer}>
               <ActivityIndicator color="#10b981" />
               <Text style={styles.loaderText}>RECOVERING RECORDS...</Text>
            </View>
          ) : filteredHistory.length === 0 ? (
            <View style={styles.emptyState}>
               <Clock size={48} color="#405045" />
               <Text style={styles.emptyText}>No records found in this category.</Text>
            </View>
          ) : (
            <View style={{ paddingBottom: 60 }}>
              {filteredHistory.map((t, idx) => (
                <Card key={`${t.type}-${t.id}`} style={styles.transactionCard}>
                  <View style={styles.transactionMain}>
                    <View style={styles.iconBox}>
                      {getIcon(t.type, t.amount)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.transactionTitle} numberOfLines={1}>{t.title}</Text>
                      <View style={styles.transactionSubRow}>
                         <Calendar size={10} color="#405045" />
                         <Text style={styles.transactionDate}>
                           {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                         </Text>
                         <View style={styles.dot} />
                         <Text style={[styles.statusText, t.status === 'pending' && { color: '#f59e0b' }]}>
                            {t.status?.toUpperCase() || 'CONFIRMED'}
                         </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.amountText, { color: t.amount > 0 ? '#10b981' : '#fcfcfc' }]}>
                        {t.amount > 0 ? '+' : '-'} {isPrivate ? "•••" : Math.abs(t.amount).toLocaleString()}
                      </Text>
                      <Text style={styles.currencyText}>GHS</Text>
                    </View>
                  </View>
                </Card>
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
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  summaryCard: { flex: 1, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  summaryLabel: { color: '#7d8a84', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  summaryValue: { fontFamily: 'Display-Bold', fontSize: 16 },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'transparent' },
  filterBtnActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  filterText: { color: '#7d8a84', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  filterTextActive: { color: '#10b981' },
  loaderContainer: { paddingVertical: 80, alignItems: 'center', gap: 16 },
  loaderText: { color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  emptyState: { paddingVertical: 80, alignItems: 'center', opacity: 0.3, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 40 },
  emptyText: { color: 'white', fontWeight: 'bold', marginTop: 16, fontSize: 13, fontStyle: 'italic' },
  transactionCard: { padding: 16, marginBottom: 12, backgroundColor: '#0f1714' },
  transactionMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  transactionTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  transactionSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  transactionDate: { color: '#405045', fontSize: 11, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#405045' },
  statusText: { color: '#7d8a84', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  amountText: { fontFamily: 'Display-Bold', fontSize: 17 },
  currencyText: { color: '#405045', fontSize: 9, fontWeight: '900', marginTop: 2 }
});
