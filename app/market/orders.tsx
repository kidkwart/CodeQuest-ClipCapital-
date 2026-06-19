import React from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useMyOrders } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, ShoppingBag, Package } from "lucide-react-native";
import { useTheme } from "@/context/theme-context";

export default function MyOrdersScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { data: orders, isLoading, refetch } = useMyOrders();

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed': return colors.primary;
      case 'pending': return colors.gold;
      case 'shipped': return '#3b82f6';
      case 'cancelled': return colors.destructive;
      default: return colors.textDim;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor={colors.primary} onRefresh={refetch} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="My Orders" subtitle="Purchase Records" />

          {isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loaderText, { color: colors.primary }]}>RETRIEVING SHIPMENTS...</Text>
            </View>
          ) : (orders ?? []).length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingBag size={48} color={colors.textDim} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No orders found.</Text>
              <TouchableOpacity onPress={() => router.push("/market")} style={[styles.browseBtn, { backgroundColor: colors.primary }]}>
                 <Text style={[styles.browseBtnText, { color: '#000' }]}>START SHOPPING</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingBottom: 40 }}>
              {orders?.map((order) => (
                <Card key={order.id} style={[styles.orderCard, { backgroundColor: colors.cardBg }]}>
                  <View style={styles.orderHeader}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Package size={16} color={colors.primary} />
                        <Text style={[styles.orderId, { color: colors.text }]}>ORDER #{order.id.slice(0, 8).toUpperCase()}</Text>
                     </View>
                     <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status.toUpperCase()}</Text>
                     </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.itemsList}>
                     {(order as any).order_items?.map((item: any) => (
                        <View key={item.id} style={styles.itemRow}>
                           <Text style={[styles.itemName, { color: colors.textMuted }]} numberOfLines={1}>
                              {item.products?.name || "Premium Item"}
                           </Text>
                           <Text style={[styles.itemQty, { color: colors.primary }]}>x{item.qty}</Text>
                        </View>
                     ))}
                  </View>

                  <View style={[styles.footer, { borderTopColor: colors.border }]}>
                     <View>
                        <Text style={[styles.totalLabel, { color: colors.textDim }]}>TOTAL AMOUNT</Text>
                        <Text style={[styles.totalValue, { color: colors.text }]}>GH₵ {Number(order.total).toLocaleString()}</Text>
                     </View>
                     <Text style={[styles.orderDate, { color: colors.textDim }]}>{new Date(order.created_at).toLocaleDateString('en-GB')}</Text>
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
  container: { flex: 1 },
  scrollContent: { paddingTop: 100, paddingBottom: 40 },
  headerBtn: { height: 44, width: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  loader: { paddingVertical: 80, alignItems: 'center', gap: 16 },
  loaderText: { fontWeight: '900', letterSpacing: 2, fontSize: 10 },
  emptyState: { paddingVertical: 80, alignItems: 'center', opacity: 0.5 },
  emptyText: { fontWeight: 'bold', marginTop: 16, fontSize: 16 },
  browseBtn: { marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  browseBtnText: { fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  orderCard: { padding: 20, marginBottom: 16 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderId: { fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  divider: { height: 1, marginBottom: 16 },
  itemsList: { gap: 10, marginBottom: 20 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 13, flex: 1 },
  itemQty: { fontSize: 12, fontWeight: 'bold', marginLeft: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, borderTopWidth: 1 },
  totalLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  totalValue: { fontFamily: 'Display-Bold', fontSize: 18 },
  orderDate: { fontSize: 10, fontWeight: '600' }
});
