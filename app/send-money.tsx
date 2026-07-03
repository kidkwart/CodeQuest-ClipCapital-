import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import * as Lucide from "lucide-react-native";
import { useProfile, useTransferFunds } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { useTheme } from "@/context/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import { BouncyTap } from "@/components/native/bouncy-tap";

export default function SendMoneyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const recipientId = params.recipientId as string;
  const name = params.name as string;
  const business = params.business as string;

  const { data: myProfile } = useProfile();
  const transfer = useTransferFunds();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleTransfer = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to send.");
      return;
    }

    if (myProfile && (myProfile.wallet_balance || 0) < amt) {
      Alert.alert("Insufficient Balance", "You do not have enough funds in your wallet.");
      return;
    }

    if (recipientId === myProfile?.id) {
        Alert.alert("Error", "You cannot send money to yourself.");
        return;
    }

    Alert.alert(
      "Confirm Transfer",
      `Are you sure you want to send GH₵ ${amt} to ${business || name || 'this user'}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await transfer.mutateAsync({
                recipient_id: recipientId,
                amount: amt,
                note: note || `Transfer to ${business || name || 'User'}`
              });
              Alert.alert("Success", "Funds transferred successfully!", [
                { text: "OK", onPress: () => router.replace("/(tabs)") }
              ]);
            } catch (e: any) {
              Alert.alert("Transfer Failed", e.message || "An error occurred during the transfer.");
            }
          }
        }
      ]
    );
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 100 }}>
          <Card style={{ padding: 24, alignItems: 'center', marginBottom: 24, backgroundColor: colors.cardBg, borderColor: colors.border }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Lucide.User size={32} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold' }}>{business || name || "Recipient"}</Text>
            <Text style={{ color: colors.textDim, fontSize: 14 }}>{business ? name : "ClipCapital User"}</Text>
          </Card>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.textDim, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 }}>AMOUNT TO SEND</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 70, backgroundColor: colors.surfaceElevated, borderRadius: 20, paddingHorizontal: 20, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.textDim, fontSize: 24, fontWeight: 'bold', marginRight: 10 }}>GH₵</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textDim}
                keyboardType="decimal-pad"
                style={{ flex: 1, color: colors.text, fontSize: 32, fontWeight: 'bold' }}
                autoFocus
              />
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8, textAlign: 'right' }}>
              Balance: GH₵ {myProfile?.wallet_balance?.toLocaleString() || "0.00"}
            </Text>
          </View>

          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: colors.textDim, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 }}>REASON (OPTIONAL)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What's this for?"
              placeholderTextColor={colors.textDim}
              style={{ backgroundColor: colors.surfaceElevated, borderRadius: 16, padding: 16, color: colors.text, borderWidth: 1, borderColor: colors.border }}
            />
          </View>

          <BouncyTap onPress={handleTransfer} disabled={transfer.isPending}>
            <LinearGradient
              colors={[colors.primary, colors.primary + 'cc']}
              style={{ height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
            >
              {transfer.isPending ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 16 }}>SEND FUNDS</Text>
              )}
            </LinearGradient>
          </BouncyTap>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtn: { height: 44, width: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginLeft: 24 },
});
