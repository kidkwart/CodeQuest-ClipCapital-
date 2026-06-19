import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, Modal, RefreshControl, FlatList } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Lucide from "lucide-react-native";
import { useInvoices, useCreateInvoice } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useTheme } from "@/context/theme-context";
import { LinearGradient } from "expo-linear-gradient";

export default function InvoicesScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { data: invoices, isLoading, refetch } = useInvoices();
  const createInvoice = useCreateInvoice();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, unit_price: "" }]);

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: "" }]);

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleCreate = async () => {
    if (!customerName || items.some(i => !i.description || !i.unit_price)) {
        Alert.alert("Missing Data", "Please fill in all required fields.");
        return;
    }

    try {
      await createInvoice.mutateAsync({
        customer_name: customerName,
        customer_phone: customerPhone,
        items: items.map(i => ({
            description: i.description,
            quantity: i.quantity,
            unit_price: parseFloat(i.unit_price as string)
        }))
      });
      setShowCreateModal(false);
      resetForm();
      Alert.alert("Success", "Invoice created and income logged.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setItems([{ description: "", quantity: 1, unit_price: "" }]);
  };

  const calculateTotal = () => {
    return items.reduce((sum, i) => sum + (i.quantity * (parseFloat(i.unit_price as string) || 0)), 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Lucide.ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="Invoices" subtitle="Professional Billing" />

          <Card style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: colors.primary + '20' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                    <Text style={[styles.label, { color: colors.textMuted }]}>TOTAL BILLING</Text>
                    <Text style={[styles.value, { color: colors.text }]}>GH₵ {invoices?.reduce((s, i) => s + Number(i.total_amount), 0).toLocaleString() || "0"}</Text>
                </View>
                <BouncyTap onPress={() => setShowCreateModal(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                    <Lucide.FilePlus2 size={20} color="#000" />
                </BouncyTap>
            </View>
          </Card>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Recent Invoices</Text>
            {(!invoices || invoices.length === 0) ? (
                <View style={styles.emptyState}>
                    <Lucide.FileText size={48} color={colors.textDim} opacity={0.3} />
                    <Text style={{ color: colors.textDim, marginTop: 12 }}>No invoices generated yet.</Text>
                </View>
            ) : (
                invoices.map((inv) => (
                    <Card key={inv.id} style={[styles.invoiceCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                        <View style={styles.invoiceHeader}>
                            <View>
                                <Text style={[styles.customerName, { color: colors.text }]}>{inv.customer_name}</Text>
                                <Text style={[styles.invoiceDate, { color: colors.textDim }]}>{new Date(inv.created_at).toLocaleDateString()}</Text>
                            </View>
                            <Text style={[styles.invoiceAmount, { color: colors.primary }]}>GH₵ {inv.total_amount.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                            <Text style={[styles.badgeText, { color: colors.primary }]}>PAID</Text>
                        </View>
                    </Card>
                ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={styles.modalTop}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>New Invoice</Text>
                  <TouchableOpacity onPress={() => setShowCreateModal(false)}><Lucide.X color={colors.text} /></TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
                  <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>CUSTOMER NAME</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder="e.g. John Doe"
                        placeholderTextColor={colors.textDim}
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textMuted }]}>CUSTOMER PHONE (OPTIONAL)</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                        keyboardType="phone-pad"
                        placeholder="024..."
                        placeholderTextColor={colors.textDim}
                      />
                  </View>

                  <Text style={[styles.inputLabel, { color: colors.textMuted, marginBottom: 16 }]}>LINE ITEMS</Text>
                  {items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                          <TextInput
                            style={[styles.input, { flex: 2, backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
                            placeholder="Description"
                            placeholderTextColor={colors.textDim}
                            value={item.description}
                            onChangeText={(t) => updateItem(idx, 'description', t)}
                          />
                          <TextInput
                            style={[styles.input, { flex: 1, backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
                            placeholder="Price"
                            placeholderTextColor={colors.textDim}
                            keyboardType="numeric"
                            value={item.unit_price}
                            onChangeText={(t) => updateItem(idx, 'unit_price', t)}
                          />
                      </View>
                  ))}

                  <TouchableOpacity onPress={addItem} style={{ alignSelf: 'flex-start', marginBottom: 32 }}>
                      <Text style={{ color: colors.primary, fontWeight: 'bold' }}>+ Add Item</Text>
                  </TouchableOpacity>

                  <View style={[styles.totalFooter, { borderTopColor: colors.border }]}>
                      <Text style={{ color: colors.textDim }}>Grand Total</Text>
                      <Text style={{ color: colors.text, fontSize: 24, fontFamily: 'Display-Bold' }}>GH₵ {calculateTotal().toLocaleString()}</Text>
                  </View>

                  <Button title="Generate & Log Sale" onPress={handleCreate} loading={createInvoice.isPending} />
              </ScrollView>
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 100, paddingBottom: 40 },
  headerBtn: { height: 44, width: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginLeft: 24 },
  summaryCard: { padding: 24, borderRadius: 28, borderWidth: 1, marginBottom: 32 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  value: { fontFamily: 'Display-Bold', fontSize: 32 },
  addBtn: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 },
  emptyState: { paddingVertical: 60, alignItems: 'center' },
  invoiceCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  customerName: { fontWeight: 'bold', fontSize: 16 },
  invoiceDate: { fontSize: 11, marginTop: 2 },
  invoiceAmount: { fontFamily: 'Display-Bold', fontSize: 16 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 8, fontWeight: 'bold' },
  modalContainer: { flex: 1 },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  input: { height: 56, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1 },
  itemRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  totalFooter: { paddingTop: 20, marginTop: 20, marginBottom: 32, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});
