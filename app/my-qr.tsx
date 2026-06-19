import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Share } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Lucide from "lucide-react-native";
import QRCode from 'react-native-qrcode-svg';
import { useProfile } from "@/lib/app-queries";
import { PremiumHeader } from "@/components/native/premium-header";
import { useTheme } from "@/context/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import { BouncyTap } from "@/components/native/bouncy-tap";

export default function MyQRScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { data: profile } = useProfile();

  const qrValue = JSON.stringify({
    type: 'payment',
    userId: profile?.id,
    name: profile?.display_name,
    business: profile?.business_name
  });

  const onShare = async () => {
    try {
      await Share.share({
        message: `Pay ${profile?.business_name || profile?.display_name} on ClipCapital: ${profile?.id}`,
      });
    } catch (error) {
      console.log(error.message);
    }
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

      <View style={{ paddingHorizontal: 24, paddingTop: 100 }}>
        <PremiumHeader title="Merchant QR" subtitle="Receive Payments Instantly" />

        <View style={styles.qrContainer}>
          <LinearGradient
            colors={theme === 'dark' ? ['#0f1714', '#080c0a'] : ['#ffffff', '#f8fafc']}
            style={[styles.qrWrapper, { borderColor: colors.primary + '30' }]}
          >
            <View style={styles.qrBorder}>
                <QRCode
                    value={qrValue}
                    size={220}
                    color={colors.primary}
                    backgroundColor="transparent"
                />
            </View>

            <View style={{ marginTop: 24, alignItems: 'center' }}>
                <Text style={[styles.businessName, { color: colors.text }]}>{profile?.business_name || profile?.display_name}</Text>
                <Text style={[styles.businessHandle, { color: colors.primary }]}>@{profile?.username || 'artisan'}</Text>
            </View>
          </LinearGradient>
        </View>

        <Text style={[styles.hintText, { color: colors.textDim }]}>
            Customers can scan this code to pay you directly from their ClipCapital app. All payments are instantly credited to your vault.
        </Text>

        <BouncyTap onPress={onShare} style={{ marginTop: 32 }}>
            <LinearGradient
                colors={[colors.primary, colors.primary + 'cc']}
                style={styles.shareBtn}
            >
                <Lucide.Share2 size={20} color="#000" />
                <Text style={styles.shareBtnText}>SHARE QR CODE</Text>
            </LinearGradient>
        </BouncyTap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtn: { height: 44, width: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginLeft: 24 },
  qrContainer: { alignItems: 'center', marginTop: 40 },
  qrWrapper: { padding: 40, borderRadius: 40, borderWidth: 1, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  qrBorder: { padding: 12, backgroundColor: '#fff', borderRadius: 20 },
  businessName: { fontFamily: 'Display-Bold', fontSize: 22, textAlign: 'center' },
  businessHandle: { fontWeight: '900', fontSize: 10, letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' },
  hintText: { textAlign: 'center', marginTop: 32, fontSize: 13, lineHeight: 20, paddingHorizontal: 20 },
  shareBtn: { height: 64, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  shareBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1 }
});
