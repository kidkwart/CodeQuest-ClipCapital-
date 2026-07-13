import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  Vibration,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Pressable,
  Image,
} from "react-native";
import { BlurView } from 'expo-blur';
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "expo-router";
import * as Linking from 'expo-linking';
import {
  Mail,
  Lock,
  User,
  Building,
  ShieldCheck,
  Unlock,
  Sun,
  Moon,
  Globe,
} from "lucide-react-native";
import { KenteBackground } from "@/components/native/effects/kente-pattern";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/theme-context";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useLanguage } from "@/context/language-context";

const { width, height } = Dimensions.get("window");
const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

const BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop";
const GOOGLE_LOGO = "https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png";

/**
 * Reusable Input Component with Icon and Label
 */
const InputField = ({ label, icon: Icon, colors, isDark, ...props }: any) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: isFocused ? colors.primary : 'rgba(255,255,255,0.7)' }]}>
        {label}
      </Text>
      <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={[
        styles.inputWrapper,
        {
            borderColor: isFocused ? colors.primary : 'rgba(255,255,255,0.15)',
            borderWidth: 1,
            overflow: 'hidden'
        }
      ]}>
        <View style={styles.inputIconBox}>
          <Icon size={20} color={isFocused ? colors.primary : 'rgba(255,255,255,0.5)'} />
        </View>
        <TextInput
          {...props}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={[styles.textInput, { color: isDark ? '#fff' : '#000' }]}
        />
      </BlurView>
    </View>
  );
};

const ThemeToggle = ({ theme, onToggle, colors }: any) => {
  const translateX = useSharedValue(theme === 'dark' ? 0 : 32);

  useEffect(() => {
    translateX.value = withSpring(theme === 'dark' ? 0 : 32, { damping: 15 });
  }, [theme]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable onPress={onToggle} style={styles.themeToggleContainer}>
      <BlurView intensity={30} tint="dark" style={styles.themeTogglePill}>
        <Animated.View style={[styles.themeToggleThumb, animatedStyle, { backgroundColor: colors.primary }]} />
        <View style={styles.themeToggleIcons}>
          <Moon size={16} color={theme === 'dark' ? '#000' : '#fff'} />
          <Sun size={16} color={theme === 'light' ? '#000' : '#fff'} />
        </View>
      </BlurView>
    </Pressable>
  );
};

export default function Login() {
  const { colors, theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup" | "2fa">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const shakeOffset = useSharedValue(0);
  const segmentTranslateX = useSharedValue(0);
  const bgScale = useSharedValue(1);
  const bgTranslateX = useSharedValue(0);
  const logoTranslateY = useSharedValue(0);

  useEffect(() => {
    // 1. Floating Logo Animation
    logoTranslateY.value = withRepeat(
      withSequence(withTiming(-10, { duration: 2000 }), withTiming(0, { duration: 2000 })),
      -1,
      true
    );

    // 2. Slow Background Ken Burns Effect
    bgScale.value = withRepeat(
      withTiming(1.15, { duration: 20000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    bgTranslateX.value = withRepeat(
      withTiming(-15, { duration: 15000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgScale.value }, { translateX: bgTranslateX.value }],
  }));

  useEffect(() => {
    const containerWidth = width - 48;
    const tabWidth = (containerWidth - 8) / 2;
    segmentTranslateX.value = withSpring(mode === "signin" ? 0 : tabWidth, { damping: 15 });
  }, [mode]);

  const segmentPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: segmentTranslateX.value }],
  }));

  const triggerErrorShake = () => {
    shakeOffset.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    Vibration.vibrate(100);
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const navigateToDashboard = () => {
    setIsSuccess(true);
    Vibration.vibrate(100);
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 1200);
  };

  /**
   * Aesthetic Placeholder for Google Sign-In
   */
  async function handleGoogleSignIn() {
    Vibration.vibrate(50);
    Alert.alert(
      "Institutional Upgrade",
      "Google Authentication is currently undergoing specialized security verification for the Ghanaian market. Please utilize the Secure Email Protocol for entry.",
      [{ text: "UNDERSTOOD", style: "default" }]
    );
  }

  async function onSubmit() {
    if (mode === "signup" && (!fullName || !businessName || !email || !password)) {
      triggerErrorShake();
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigateToDashboard();
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: fullName,
              username: fullName.toLowerCase().replace(/\s/g, '_'),
              business_name: businessName,
            },
          },
        });
        if (error) throw error;

        // Ensure entry in profiles table
        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                display_name: fullName,
                business_name: businessName,
                updated_at: new Date().toISOString(),
            });
        }

        Alert.alert("Success", "Account created! Please check your email for authorization.");
        setMode("signin");
      }
    } catch (err: any) {
      triggerErrorShake();
      Alert.alert("Access Denied", err.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleMode = (newMode: "signin" | "signup") => {
    Vibration.vibrate(Platform.OS === 'ios' ? 1 : 5);
    setMode(newMode);
  };

  const isDark = theme === 'dark';

  if (isSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
        <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center' }}>
           <Unlock size={80} color="#000" />
           <Text style={styles.successText}>WELCOME BACK</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* BACKGROUND IMAGE WITH ANIMATION */}
        <AnimatedImageBackground
          source={{ uri: BACKGROUND_IMAGE }}
          style={[StyleSheet.absoluteFill, animatedBackgroundStyle]}
          resizeMode="cover"
        />

        {/* GRADIENT OVERLAY */}
        <LinearGradient
          colors={isDark
            ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']
            : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.85)']}
          style={StyleSheet.absoluteFill}
        />

        {/* EMERALD TINT */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary, opacity: isDark ? 0.12 : 0.05 }]} />

        <KenteBackground />

        {/* Improved Theme Toggle */}
        <ThemeToggle theme={theme} onToggle={() => { Vibration.vibrate(10); toggleTheme(); }} colors={colors} />

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.content}>

            {/* 1. Logo Section */}
            <Animated.View entering={FadeInDown.duration(800).delay(200)} style={[styles.brandSection, animatedLogoStyle]}>
              <BlurView intensity={30} tint="dark" style={styles.logoBox}>
                <Text style={[styles.logoText, { color: '#fff' }]}>
                  Clip<Text style={{ color: colors.primary }}>Capital</Text>
                </Text>
                <View style={[styles.logoGlow, { backgroundColor: colors.primary }]} />
              </BlurView>
              <Animated.View entering={FadeIn.delay(400)} style={[styles.badgeRow, { backgroundColor: 'rgba(46, 204, 113, 0.15)', borderColor: 'rgba(46, 204, 113, 0.3)' }]}>
                <ShieldCheck size={12} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>INSTITUTIONAL GRADE SECURITY</Text>
              </Animated.View>
            </Animated.View>

            {/* 2. Segmented Control */}
            <Animated.View entering={FadeIn.delay(500)} style={styles.tabContainer}>
              <Animated.View style={[styles.segmentPill, segmentPillStyle, { backgroundColor: colors.primary }]} />
              <TouchableOpacity
                onPress={() => toggleMode("signin")}
                style={styles.tabBtn}
              >
                <Text style={[styles.tabText, { color: mode === "signin" ? "#000" : colors.text }]}>SIGN IN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleMode("signup")}
                style={styles.tabBtn}
              >
                <Text style={[styles.tabText, { color: mode === "signup" ? "#000" : colors.text }]}>SIGN UP</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* 3. Form */}
            <View style={styles.formContainer}>
              {mode === "signup" && (
                <Animated.View entering={FadeInDown.duration(400)} exiting={SlideOutLeft} style={{ gap: 16, marginBottom: 16 }}>
                  <InputField label={t.auth_identity} icon={User} placeholder="Enter your name" value={fullName} onChangeText={setFullName} colors={colors} isDark={isDark} />
                  <InputField label="REGISTERED BUSINESS" icon={Building} placeholder="Enter your business name" value={businessName} onChangeText={setBusinessName} colors={colors} isDark={isDark} />
                </Animated.View>
              )}

              <View style={{ gap: 16 }}>
                <InputField
                    label="EMAIL PROTOCOL"
                    icon={Mail}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    colors={colors}
                    isDark={isDark}
                />

                <Animated.View style={shakeStyle}>
                  <InputField
                    icon={Lock}
                    label="PASSWORD"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="••••••••"
                    colors={colors}
                    isDark={isDark}
                    delay={900}
                  />
                </Animated.View>
              </View>

              {mode === "signin" && (
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/forgot-password")}
                  style={{ alignSelf: 'center', marginTop: 20 }}
                >
                  <Text style={{ color: colors.primary, fontSize: 12, fontFamily: 'Display-Bold', opacity: 0.9 }}>FORGOT PASSWORD?</Text>
                </TouchableOpacity>
              )}

              {/* 4. Action Button */}
              <View style={{ marginTop: 32 }}>
                <BouncyTap style={styles.submitBtnContainer} containerStyle={{ flex: 1 }}>
                  <TouchableOpacity
                      onPress={onSubmit}
                      style={[styles.submitBtn, styles.shadowGlow, { backgroundColor: colors.primary }]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Text style={styles.submitBtnText}>
                        {mode === "signin" ? "LOG IN" : "SIGN UP"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </BouncyTap>
              </View>

              <View style={{ marginTop: 12 }}>
                <BouncyTap onPress={handleGoogleSignIn} style={styles.googleBtnContainer} containerStyle={{ flex: 1 }}>
                  <BlurView intensity={20} tint="dark" style={styles.googleButton}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Image source={{ uri: GOOGLE_LOGO }} style={styles.googleIcon} />
                      <Text style={styles.googleButtonText}>Sign in with Google</Text>
                    </View>
                  </BlurView>
                </BouncyTap>
              </View>
            </View>

            <Animated.View entering={FadeIn.delay(1300)} style={styles.footer}>
              <View style={[styles.footerBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', borderColor: colors.border }]}>
                <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.footerBadgeText, { color: colors.textDim }]}>
                  GHANA'S ELITE PARTNER FOR ARTISANS
                </Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingVertical: 60 },
  brandSection: { marginBottom: 40, alignItems: 'center' },
  logoBox: { width: '85%', height: 110, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1 },
  logoGlow: { position: 'absolute', width: '100%', height: '100%', borderRadius: 28, opacity: 0.15 },
  logoText: { fontSize: 44, fontFamily: 'Display-Bold', letterSpacing: -2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1 },
  badgeText: { fontSize: 8, fontFamily: 'Display-Bold', letterSpacing: 1 },
  tabContainer: { flexDirection: 'row', padding: 4, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.3)', marginBottom: 32, position: 'relative' },
  segmentPill: { position: 'absolute', top: 4, left: 4, bottom: 4, width: (width - 48 - 8) / 2, borderRadius: 12 },
  tabBtn: { flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 12, fontFamily: 'Display-Bold', letterSpacing: 1 },
  formContainer: { width: '100%' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 10, fontFamily: 'Display-Bold', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 64, borderRadius: 15, paddingHorizontal: 12 },
  inputIconBox: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 16, fontFamily: 'Display-Bold' },
  buttonWrapper: { width: '100%', alignItems: 'center' },
  submitBtnContainer: { width: '100%', height: 60 },
  submitBtn: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center', width: '100%' },
  shadowGlow: {
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  submitBtnText: { color: '#000', fontFamily: 'Display-Bold', fontSize: 15, letterSpacing: 1 },
  successText: { color: '#000', fontFamily: 'Display-Bold', fontSize: 24, marginTop: 20 },
  footer: { marginTop: 50, alignItems: 'center' },
  footerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 100, borderWidth: 1 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  footerBadgeText: { fontSize: 8, fontFamily: 'Display-Bold', letterSpacing: 1.5 },
  themeToggleContainer: { position: 'absolute', top: 60, right: 24, zIndex: 100 },
  themeTogglePill: {
    width: 64,
    height: 32,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  themeToggleThumb: {
    position: 'absolute',
    width: 28,
    height: 26,
    borderRadius: 14,
    left: 2,
  },
  themeToggleIcons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    zIndex: 1
  },
  googleBtnContainer: { width: '100%', height: 60 },
  googleButton: {
    flex: 1,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden'
  },
  googleIcon: { width: 24, height: 24, marginRight: 12 },
  googleButtonText: { fontSize: 15, color: "#fff", fontFamily: 'Display-Bold' },
});
