import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Platform } from "react-native";
import { useProfile, useTransactionHistory, useUpdateProfile } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowUpRight, ArrowDownLeft, Plus, Landmark, History, Wallet as WalletIcon, Eye, EyeOff, ShieldCheck, ChevronRight } from "lucide-react-native";
import { useRouter, Stack } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useTheme } from "@/context/theme-context";

export default function WalletScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { data: profile, isLoading, refetch } = useProfile();
  const { data: history } = useTransactionHistory();
  const updateProfile = useUpdateProfile();

  const isPrivate = profile?.privacy_mode_enabled ?? false;

  const togglePrivacy = async () => {
    try {
      await updateProfile.mutateAsync({ privacy_mode_enabled: !isPrivate });
    } catch (e) {
      console.error(e);
    }
  };

  // Filter only wallet-affecting transactions
  const walletTransactions = history?.slice(0, 8) || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor={colors.primary} onRefresh={refetch} progressViewOffset={Platform.OS === 'ios' ? 110 : 0} />}
      >
        <View style={{ paddingHorizontal: 24 }}>

          <View style={styles.header}>
            <View>
              <Text style={[styles.headerSubtitle, { color: colors.primary }]}>ACCOUNT CENTER</Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Oxygen Wallet</Text>
            </View>
            <TouchableOpacity onPress={togglePrivacy} style={[styles.privacyBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              {isPrivate ? <EyeOff size={20} color={colors.primary} /> : <Eye size={20} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>

          {/* Premium Balance Card */}
          <LinearGradient
            colors={['#10b981', '#064e3b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainBalanceCard}
          >
            <View style={styles.cardPattern} />
            <View style={{ zIndex: 1 }}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                <ShieldCheck size={16} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={[styles.balanceAmount, isPrivate && { letterSpacing: 4 }]}>
                {isPrivate ? "••••••••" : `GH₵ ${profile?.wallet_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.verifiedBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.verifiedText}>ENCRYPTED VAULT</Text>
                </View>
                <Text style={styles.accountType}>PREMIUM ACCOUNT</Text>
              </View>
            </View>
          </LinearGradient>

          {/* High-End Action Buttons */}
          <View style={styles.actionRow}>
            <BouncyTap onPress={() => router.push("/topup")} style={{ flex: 1 }}>
              <LinearGradient
                colors={['#10b981', '#064e3b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionBtnPremium}
              >
                <View style={styles.actionIconBg}>
                   <Plus size={18} color="#10b981" strokeWidth={3} />
                </View>
                <Text style={styles.actionBtnTextPremium}>ADD FUNDS</Text>
              </LinearGradient>
            </BouncyTap>

            <BouncyTap onPress={() => router.push("/withdraw")} style={{ flex: 1 }}>
              <View style={[styles.actionBtnInstitutional, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={[styles.actionIconBg, { backgroundColor: colors.surfaceElevated }]}>
                   <Landmark size={18} color={colors.textMuted} />
                </View>
                <Text style={[styles.actionBtnTextInstitutional, { color: colors.textMuted }]}>WITHDRAW</Text>
              </View>
            </BouncyTap>
          </View>

          {/* Quick Stats / Info */}
          <View style={[styles.statsGrid, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Monthly Flow</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>+ GH₵ 1,240</Text>
            </View>
            <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Trust Score</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>Elite</Text>
            </View>
          </View>

          {/* Transaction Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push("/history")} style={styles.seeAllBtn}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Card style={[styles.transactionCard, { backgroundColor: colors.cardBg }]}>
            {walletTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <History size={40} color={colors.textDim} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions found</Text>
              </View>
            ) : (
              walletTransactions.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={[styles.transactionItem, idx === walletTransactions.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[styles.iconBox, { backgroundColor: item.amount > 0 ? `${colors.primary}10` : colors.surfaceElevated, borderColor: colors.border }]}>
                      {item.amount > 0 ? <ArrowUpRight size={18} color={colors.primary} /> : <ArrowDownLeft size={18} color={colors.textMuted} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={[styles.transactionTitle, { color: colors.text }]}>{item.note || item.title}</Text>
                      <Text style={[styles.transactionDate, { color: colors.textDim }]}>{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                  </View>
                  <Text style={[styles.transactionAmount, { color: item.amount > 0 ? colors.primary : colors.text }]}>
                    {item.amount > 0 ? '+' : ''}{isPrivate ? "•••" : item.amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </Card>

          <View style={styles.securityNote}>
             <ShieldCheck size={14} color={colors.textDim} />
             <Text style={[styles.securityText, { color: colors.textDim }]}>Secured by ClipCapital Institutional Grade Encryption</Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c0a' },
  scrollContent: { paddingBottom: 120, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingHorizontal: 4 },
  headerSubtitle: { color: '#10b981', fontWeight: '900', fontSize: 10, letterSpacing: 3, marginBottom: 6 },
  headerTitle: { fontFamily: 'Display-Bold', color: 'white', fontSize: 32 },
  privacyBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  mainBalanceCard: { height: 200, borderRadius: 28, padding: 28, justifyContent: 'center', marginBottom: 32, overflow: 'hidden', shadowColor: '#10b981', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 },
  cardPattern: { position: 'absolute', right: -50, top: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.03)', transform: [{ scale: 1.5 }] },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  balanceAmount: { color: 'white', fontFamily: 'Display-Bold', fontSize: 36, marginBottom: 24 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  verifiedText: { color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  accountType: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  actionRow: { flexDirection: 'row', gap: 14, marginBottom: 32 },
  actionBtnPremium: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  actionBtnTextPremium: { fontFamily: 'Display-Bold', fontSize: 11, color: 'white', letterSpacing: 1 },
  actionBtnInstitutional: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#0f1714',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12
  },
  actionBtnTextInstitutional: { fontFamily: 'Display-Bold', fontSize: 11, color: '#7d8a84', letterSpacing: 1 },
  actionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statsGrid: { flexDirection: 'row', backgroundColor: '#0f1714', borderRadius: 20, marginBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  statBox: { flex: 1, padding: 20, alignItems: 'center' },
  statLabel: { color: '#7d8a84', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  statValue: { color: 'white', fontFamily: 'Display-Bold', fontSize: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 8 },
  sectionTitle: { fontFamily: 'Display-Bold', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAll: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },
  transactionCard: { padding: 8, backgroundColor: '#0f1714', borderRadius: 24 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  transactionTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  transactionDate: { color: '#405045', fontSize: 11, marginTop: 2 },
  transactionAmount: { fontFamily: 'Display-Bold', fontSize: 15, marginLeft: 12 },
  emptyState: { alignItems: 'center', padding: 40, opacity: 0.5 },
  emptyText: { color: '#7d8a84', marginTop: 12, fontSize: 13, fontStyle: 'italic' },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40, opacity: 0.4 },
  securityText: { color: '#7d8a84', fontSize: 9, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' }
});
