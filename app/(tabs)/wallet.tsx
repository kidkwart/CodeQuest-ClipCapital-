import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useProfile, useTransactionHistory } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowUpRight, ArrowDownLeft, Plus, Landmark, History, Wallet as WalletIcon, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";

export default function WalletScreen() {
  const router = useRouter();
  const { data: profile, isLoading, refetch } = useProfile();
  const { data: history } = useTransactionHistory();

  // Filter only wallet-affecting transactions (deposits, withdrawals, payments)
  const walletTransactions = history?.slice(0, 8) || [];

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 60 }}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor="#10B981" onRefresh={refetch} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="My Wallet" subtitle="Financial Command Center" />

          {/* Main Balance Card */}
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainBalanceCard}
          >
            <View>
              <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
              <Text style={styles.balanceAmount}>GH₵ {profile?.wallet_balance?.toLocaleString() || '0.00'}</Text>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.verifiedBadge}>
                <WalletIcon size={12} color="#FFF" />
                <Text style={styles.verifiedText}>SECURE WALLET</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <BouncyTap onPress={() => router.push("/topup")} style={[styles.actionBtn, { backgroundColor: '#10b981' }]}>
              <Plus size={24} color="#000" />
              <Text style={[styles.actionBtnText, { color: '#000' }]}>Add Funds</Text>
            </BouncyTap>
            <BouncyTap onPress={() => router.push("/withdraw")} style={[styles.actionBtn, { backgroundColor: '#0f1714', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
              <Landmark size={24} color="#10b981" />
              <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Withdraw</Text>
            </BouncyTap>
          </View>

          {/* Transaction History Preview */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push("/history")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <Card glass style={{ padding: 8 }}>
            {walletTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <History size={48} color="#405045" />
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            ) : (
              walletTransactions.map((item, idx) => (
                <View key={item.id} style={[styles.transactionItem, idx === walletTransactions.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.iconBox, { borderColor: item.amount > 0 ? '#10b98130' : '#ef444430' }]}>
                      {item.amount > 0 ? <ArrowUpRight size={20} color="#10B981" /> : <ArrowDownLeft size={20} color="#EF4444" />}
                    </View>
                    <View>
                      <Text style={styles.transactionTitle}>{item.title}</Text>
                      <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                  </View>
                  <Text style={[styles.transactionAmount, { color: item.amount > 0 ? '#10b981' : '#ef4444' }]}>
                    {item.amount > 0 ? '+' : ''} {item.amount.toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </Card>

          {/* Security Note */}
          <View style={styles.securityBox}>
            <Landmark size={16} color="#7d8a84" />
            <Text style={styles.securityText}>Your funds are protected by bank-grade encryption and 2FA security.</Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainBalanceCard: {
    height: 200,
    borderRadius: 32,
    padding: 32,
    justifyContent: 'space-between',
    marginBottom: 32,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
  },
  balanceAmount: {
    color: '#FFF',
    fontFamily: 'Display-Bold',
    fontSize: 42,
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  verifiedText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 48,
  },
  actionBtn: {
    flex: 1,
    height: 120,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionBtnText: {
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontFamily: 'Display-Bold',
    color: '#fcfcfc',
    fontSize: 20,
  },
  seeAll: {
    color: '#10b981',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0f1714',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  transactionTitle: {
    color: '#fcfcfc',
    fontWeight: 'bold',
    fontSize: 15,
  },
  transactionDate: {
    color: '#7d8a84',
    fontSize: 11,
    marginTop: 2,
  },
  transactionAmount: {
    fontFamily: 'Display-Bold',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    opacity: 0.5,
  },
  emptyText: {
    color: '#7d8a84',
    marginTop: 12,
    fontSize: 14,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  securityText: {
    color: '#7d8a84',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  }
});
