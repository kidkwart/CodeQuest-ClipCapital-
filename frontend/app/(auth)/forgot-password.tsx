import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, Vibration } from "react-native";
import { supabase } from "@/integrations/supabase/client";
import { useRouter, Stack } from "expo-router";
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from "lucide-react-native";
import { KenteBackground } from "@/components/native/effects/kente-pattern";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/theme-context";
import { BouncyTap } from "@/components/native/bouncy-tap";

export default function ForgotPassword() {
  const { colors, theme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleResetPassword() {
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email address to reset your access key.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'clipcapital://reset-password',
      });

      if (error) throw error;

      Alert.alert(
        "Reset Link Sent",
        "If an account exists with this email, you will receive a reset link shortly.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KenteBackground />

      <View style={styles.topNav}>
        <BouncyTap
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </BouncyTap>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(800)} style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Reset Access</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Enter your registered email to receive a secure link to reset your institutional access key.
          </Text>
        </Animated.View>

        <View style={styles.formContainer}>
          <View>
            <Text style={[styles.inputLabel, { color: colors.primary }]}>EMAIL PROTOCOL</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.inputIconBox}>
                <Mail size={18} color={colors.primary} />
              </View>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textDim}
                style={[styles.textInput, { color: colors.text }]}
                autoCapitalize="none"
                keyboardType="email-address"
                selectionColor={colors.primary}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.9}
            style={{ marginTop: 32 }}
          >
            <LinearGradient
              colors={[colors.primary, theme === 'dark' ? '#059669' : colors.primary + 'cc']}
              style={styles.submitBtn}
            >
              {loading ? (
                <ActivityIndicator color="#080c0a" />
              ) : (
                <View style={styles.btnInner}>
                  <Text style={[styles.submitBtnText, { color: '#000' }]}>SEND RESET LINK</Text>
                  <ArrowRight size={18} color="#000" strokeWidth={3} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={[styles.footerBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <ShieldCheck size={12} color={colors.primary} />
            <Text style={[styles.footerBadgeText, { color: colors.textDim }]}>
              SECURE IDENTITY RECOVERY
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: { paddingTop: 60, paddingHorizontal: 24 },
  backButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  content: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  headerSection: { marginBottom: 48 },
  title: { fontFamily: 'Display-Bold', fontSize: 32, marginBottom: 12 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  formContainer: { width: '100%' },
  inputLabel: { fontWeight: '900', fontSize: 9, letterSpacing: 3, marginBottom: 12, marginLeft: 4, opacity: 0.6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, height: 64, borderWidth: 1, paddingHorizontal: 4 },
  inputIconBox: { width: 56, height: '100%', alignItems: 'center', justifyContent: 'center' },
  textInput: { flex: 1, fontWeight: 'bold', fontSize: 15, paddingRight: 20 },
  submitBtn: { height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  submitBtnText: { fontFamily: 'Display-Bold', fontSize: 14, letterSpacing: 1 },
  footer: { marginTop: 60, alignItems: 'center' },
  footerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, borderWidth: 1 },
  footerBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 1.5 }
});
