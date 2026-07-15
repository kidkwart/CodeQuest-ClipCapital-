import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import { supabase } from "@/integrations/supabase/client";
import { useRouter, Stack } from "expo-router";
import { Lock, CheckCircle2, ArrowRight } from "lucide-react-native";
import { KenteBackground } from "@/components/native/effects/kente-pattern";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/theme-context";

export default function ResetPassword() {
  const { colors, theme } = useTheme();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUpdatePassword() {
    if (!password || password.length < 6) {
      Alert.alert("Security", "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      Alert.alert(
        "Vault Secured",
        "Your access key has been updated successfully.",
        [{ text: "Continue to Login", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (err: any) {
      Alert.alert("Update Failed", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KenteBackground />

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(800)} style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>New Access Key</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Secure your institutional vault with a new high-strength password.
          </Text>
        </Animated.View>

        <View style={styles.formContainer}>
          <View style={{ gap: 20 }}>
            <View>
              <Text style={[styles.inputLabel, { color: colors.primary }]}>NEW PASSWORD</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={styles.inputIconBox}>
                  <Lock size={18} color={colors.primary} />
                </View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textDim}
                  secureTextEntry
                  style={[styles.textInput, { color: colors.text }]}
                  selectionColor={colors.primary}
                />
              </View>
            </View>

            <View>
              <Text style={[styles.inputLabel, { color: colors.primary }]}>CONFIRM PASSWORD</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={styles.inputIconBox}>
                  <CheckCircle2 size={18} color={colors.primary} />
                </View>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textDim}
                  secureTextEntry
                  style={[styles.textInput, { color: colors.text }]}
                  selectionColor={colors.primary}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleUpdatePassword}
            disabled={loading}
            activeOpacity={0.9}
            style={{ marginTop: 40 }}
          >
            <LinearGradient
              colors={[colors.primary, theme === 'dark' ? '#059669' : colors.primary + 'cc']}
              style={styles.submitBtn}
            >
              {loading ? (
                <ActivityIndicator color="#080c0a" />
              ) : (
                <View style={styles.btnInner}>
                  <Text style={[styles.submitBtnText, { color: '#000' }]}>UPDATE VAULT ACCESS</Text>
                  <ArrowRight size={18} color="#000" strokeWidth={3} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 32, justifyContent: 'center' },
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
});
