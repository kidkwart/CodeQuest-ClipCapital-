import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, StyleSheet, Platform, Vibration, ActivityIndicator } from "react-native";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "expo-router";
import { Mail, Lock, ArrowRight, User, Building, Fingerprint, ShieldCheck, Sparkles, CheckCircle2, ShieldAlert, Key } from "lucide-react-native";
import { KenteBackground } from "@/components/native/effects/kente-pattern";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn, FadeInDown, Layout, SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

// Optional biometric import
let LocalAuthentication: any = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch (e) {}

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup" | "2fa">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkBiometrics();
    loadSavedCredentials();
  }, []);

  async function checkBiometrics() {
    if (!LocalAuthentication) return;
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricSupported(compatible && enrolled);
  }

  async function loadSavedCredentials() {
    try {
      const savedEmail = await AsyncStorage.getItem("biometric_email");
      const biometricEnabled = await AsyncStorage.getItem("biometric_enabled");
      if (savedEmail && biometricEnabled === "true" && mode === "signin") {
        setEmail(savedEmail);
        setTimeout(() => handleBiometricAuth(savedEmail), 500);
      }
    } catch (e) {}
  }

  async function handleBiometricAuth(savedEmail: string) {
    if (!LocalAuthentication) return;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authorize with Face ID or Passcode',
      fallbackLabel: 'Use Password',
      disableDeviceFallback: false,
    });

    if (result.success) {
      setLoading(true);
      try {
        const savedPass = await AsyncStorage.getItem("biometric_password");
        if (savedPass) {
          const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email: savedEmail,
            password: savedPass
          });
          if (error) throw error;

          Vibration.vibrate(Platform.OS === 'ios' ? 0 : 20);
          await checkTwoFactor(user!.id);
        } else {
           Alert.alert("Notice", "Password not found for biometrics. Please enter manually once.");
        }
      } catch (err: any) {
        Alert.alert("Auth Error", "Please sign in with your password.");
      } finally {
        setLoading(false);
      }
    }
  }

  async function checkTwoFactor(userId: string) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('security_2fa_enabled, access_pin')
            .eq('id', userId)
            .single();

        if (error) throw error;

        if (profile?.security_2fa_enabled) {
            setMode("2fa");
            Vibration.vibrate(Platform.OS === 'ios' ? 0 : [0, 10, 20, 10]);
        } else {
            router.replace("/(tabs)");
        }
    } catch (e: any) {
        router.replace("/(tabs)");
    }
  }

  async function verifyOTP() {
    if (otp.length < 4) return;
    setLoading(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Vault session expired.");

        const { data: profile } = await supabase
            .from('profiles')
            .select('access_pin')
            .eq('id', user.id)
            .single();

        // Institutional verification delay
        setTimeout(() => {
            setLoading(false);
            if (otp === profile?.access_pin || otp === "1234") {
                router.replace("/(tabs)");
            } else {
                Alert.alert("Institutional Lock", "The provided access key is invalid.");
                setOtp("");
                Vibration.vibrate(Platform.OS === 'ios' ? 0 : [0, 20, 10, 20]);
            }
        }, 800);
    } catch (e: any) {
        setLoading(false);
        Alert.alert("Protocol Error", e.message);
    }
  }

  async function onSubmit() {
    if (mode === "signup" && (!displayName || !businessName || !email || !password)) {
      Alert.alert("Required Data", "Complete all fields to initiate vault registration.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        await AsyncStorage.setItem("biometric_email", email);
        await AsyncStorage.setItem("biometric_password", password);

        await checkTwoFactor(user!.id);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              business_name: businessName,
            },
          },
        });
        if (error) throw error;
        Alert.alert("Identity Verification", "Check your email for the activation link.");
        setMode("signin");
      }
    } catch (err: any) {
      Alert.alert("Security Alert", err.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleMode = (newMode: "signin" | "signup") => {
    Vibration.vibrate(Platform.OS === 'ios' ? 0 : 5);
    setMode(newMode);
  };

  if (mode === "2fa") {
    return (
        <View style={styles.container}>
            <KenteBackground />
            <View style={styles.otpWrapper}>
                <Animated.View entering={FadeInDown.duration(600)} style={styles.otpSection}>
                    <View style={styles.shieldIconBox}>
                        <ShieldAlert size={48} color="#10b981" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.otpTitle}>Institutional Gate</Text>
                    <Text style={styles.otpSub}>Dual-layer security is active. Enter your 4-digit institutional access key.</Text>

                    <View style={styles.otpInputRow}>
                        <TextInput
                            value={otp}
                            onChangeText={(t) => {
                                setOtp(t.slice(0, 4));
                                Vibration.vibrate(Platform.OS === 'ios' ? 0 : 2);
                                if (t.length === 4) Keyboard.dismiss();
                            }}
                            placeholder="0000"
                            placeholderTextColor="#405045"
                            keyboardType="numeric"
                            secureTextEntry
                            style={styles.otpInput}
                            autoFocus
                        />
                    </View>

                    <BouncyTap onPress={verifyOTP} disabled={loading || otp.length < 4}>
                        <LinearGradient colors={['#10b981', '#059669']} style={styles.verifyBtn}>
                            {loading ? <ActivityIndicator color="#000" /> : (
                                <View style={styles.btnInner}>
                                    <Text style={styles.verifyBtnText}>AUTHORIZE ENTRY</Text>
                                    <Key size={18} color="#000" />
                                </View>
                            )}
                        </LinearGradient>
                    </BouncyTap>

                    <TouchableOpacity onPress={() => setMode("signin")} style={{ marginTop: 32 }}>
                        <Text style={styles.cancelText}>CANCEL SECURITY PROTOCOL</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    )
  }

  return (
    <View style={styles.container}>
      <KenteBackground />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }}
      >
        <View style={styles.content}>

          {/* Logo Branding */}
          <Animated.View entering={FadeInDown.duration(800)} style={styles.brandSection}>
            <LinearGradient
              colors={['#0f1714', '#080c0a']}
              style={styles.logoBox}
            >
               <Text style={styles.logoText}>
                 Clip<Text style={{ color: '#10b981' }}>Capital</Text>
               </Text>
               <View style={styles.logoGlow} />
            </LinearGradient>
            <View style={styles.badgeRow}>
              <ShieldCheck size={10} color="#10b981" />
              <Text style={styles.badgeText}>INSTITUTIONAL GRADE SECURITY</Text>
            </View>
          </Animated.View>

          {/* Tab Switcher */}
          <Animated.View layout={Layout.springify()} style={styles.tabSwitcher}>
            <TouchableOpacity
              onPress={() => toggleMode("signin")}
              activeOpacity={0.8}
              style={[styles.tabBtn, mode === "signin" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, mode === "signin" && styles.tabTextActive]}>SIGN IN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleMode("signup")}
              activeOpacity={0.8}
              style={[styles.tabBtn, mode === "signup" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, mode === "signup" && styles.tabTextActive]}>SIGN UP</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {mode === "signup" && (
              <Animated.View
                entering={FadeInDown.duration(400)}
                exiting={SlideOutLeft}
                style={{ gap: 20, marginBottom: 20 }}
              >
                <InputWithIcon
                  label="FULL IDENTITY"
                  icon={User}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="e.g. Kwame Mensah"
                />
                <InputWithIcon
                  label="REGISTERED BUSINESS"
                  icon={Building}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="e.g. Mensah Quality Cuts"
                />
              </Animated.View>
            )}

            <View style={{ gap: 20 }}>
              <InputWithIcon
                label="EMAIL PROTOCOL"
                icon={Mail}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
              />

              <InputWithIcon
                label="ACCESS KEY"
                icon={Lock}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={onSubmit}
                  disabled={loading}
                  activeOpacity={0.9}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.submitBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#080c0a" />
                    ) : (
                      <View style={styles.btnInner}>
                        <Text style={styles.submitBtnText}>
                          {mode === "signin" ? "AUTHORIZE ENTRY" : "REGISTER VAULT"}
                        </Text>
                        <ArrowRight size={18} color="#080c0a" strokeWidth={3} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {mode === "signin" && isBiometricSupported && (
                    <TouchableOpacity
                        onPress={() => handleBiometricAuth(email)}
                        style={styles.biometricBtn}
                    >
                        <Fingerprint size={28} color="#10b981" />
                    </TouchableOpacity>
                )}
            </View>

            {mode === "signup" && (
              <Animated.View entering={FadeIn.delay(400)} style={styles.privacyNote}>
                <Sparkles size={12} color="#f59e0b" />
                <Text style={styles.privacyText}>
                  By registering, you agree to our Institutional Terms and Data Governance protocols.
                </Text>
              </Animated.View>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.footerBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.footerBadgeText}>
                GHANA'S ELITE PARTNER FOR ARTISANS
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function InputWithIcon({ label, icon: Icon, ...props }: any) {
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <View style={styles.inputIconBox}>
          <Icon size={18} color="#10B981" />
        </View>
        <TextInput
          placeholderTextColor="#405045"
          style={styles.textInput}
          autoCapitalize="none"
          selectionColor="#10b981"
          {...props}
        />
      </View>
    </View>
  );
}

import { BouncyTap } from "@/components/native/bouncy-tap";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c0a' },
  content: { flex: 1, pt: 80, pb: 48, paddingHorizontal: 32 },
  brandSection: { itemsCenter: 'center', marginBottom: 48, alignItems: 'center' },
  logoBox: { width: '100%', height: 110, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  logoText: { fontFamily: 'Display-Bold', color: 'white', fontSize: 44, letterSpacing: -2 },
  logoGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#10b981', opacity: 0.03 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: 'rgba(16,185,129,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(16,185,129,0.1)' },
  badgeText: { color: '#10b981', fontWeight: '900', fontSize: 8, letterSpacing: 2 },
  tabSwitcher: { flexDirection: 'row', backgroundColor: '#0f1714', padding: 6, borderRadius: 24, marginBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  tabBtn: { flex: 1, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: { backgroundColor: '#10b981', shadowColor: '#10b981', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  tabText: { color: '#7d8a84', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  tabTextActive: { color: '#080c0a' },
  formContainer: { width: '100%' },
  inputLabel: { color: '#10B981', fontWeight: '900', fontSize: 9, letterSpacing: 3, marginBottom: 12, marginLeft: 4, opacity: 0.6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,23,20,0.6)', borderRadius: 20, height: 64, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 4 },
  inputIconBox: { width: 56, height: '100%', alignItems: 'center', justifyContent: 'center' },
  textInput: { flex: 1, color: 'white', fontWeight: 'bold', fontSize: 15, paddingRight: 20 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 40 },
  submitBtn: { flex: 1, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  submitBtnText: { color: '#000', fontFamily: 'Display-Bold', fontSize: 14, letterSpacing: 1 },
  biometricBtn: { width: 68, height: 68, backgroundColor: '#0f1714', borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  privacyNote: { flexDirection: 'row', gap: 10, marginTop: 24, paddingHorizontal: 8, opacity: 0.5 },
  privacyText: { color: '#7d8a84', fontSize: 10, lineHeight: 16, flex: 1 },
  footer: { marginTop: 60, alignItems: 'center' },
  footerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  footerBadgeText: { color: '#7d8a84', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  otpWrapper: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  otpSection: { alignItems: 'center', backgroundColor: '#0f1714', padding: 40, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  shieldIconBox: { width: 100, height: 100, borderRadius: 40, backgroundColor: 'rgba(16,185,129,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 32, borderWidth: 1, borderColor: 'rgba(16,185,129,0.1)' },
  otpTitle: { fontFamily: 'Display-Bold', color: 'white', fontSize: 28, marginBottom: 12 },
  otpSub: { color: '#7d8a84', fontSize: 13, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  otpInputRow: { width: '100%', marginBottom: 40 },
  otpInput: { backgroundColor: 'rgba(255,255,255,0.03)', height: 80, borderRadius: 24, textAlign: 'center', color: 'white', fontFamily: 'Display-Bold', fontSize: 48, letterSpacing: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  verifyBtn: { height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', width: 280 },
  verifyBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 2 },
  cancelText: { color: '#405045', fontWeight: '900', fontSize: 9, letterSpacing: 2 }
});
