import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, ActivityIndicator, Alert, Platform, Modal, Switch, TextInput, Vibration, Image, Share } from "react-native";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUpdateProfile } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { LogOut, User, Bell, Shield, Phone, Building, ChevronRight, Lock, CreditCard, BadgeCheck, Save, Check, UserX, X, Eye, EyeOff, Smartphone, BellRing, Fingerprint, Key, Palette, Camera, HelpCircle, Share2, FileText, Globe, Info, Activity } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useRouter } from "expo-router";
import { ThemeType } from "@/lib/theme";
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "@/context/language-context";
import { LanguageType } from "@/lib/translations";
import { getDeviceSecureID } from "@/lib/security-module";
import { getBatteryLevel, getSystemUptime, getAndroidVersion, showNativeToast } from "@/lib/device-module";

// Optional import for biometrics
let LocalAuthentication: any = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch (e) {}

export default function Settings() {
  const router = useRouter();
  const { colors, theme, toggleTheme } = useTheme();
  const { language, t, setLanguage } = useLanguage();
  const { data: profile, refetch, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [refreshing, setRefreshing] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [pin, setPin] = useState("");
  const [deviceId, setDeviceId] = useState("Fetching...");
  const [batteryLevel, setBatteryLevel] = useState<number | string>("...");
  const [uptime, setUptime] = useState("...");
  const [androidVer, setAndroidVer] = useState("...");

  const [prefs, setPrefs] = useState({
    notifications_enabled: true,
    privacy_mode_enabled: false,
    security_2fa_enabled: false,
    sms_backup_enabled: false,
    biometric_enabled: false,
    theme_preference: "dark" as ThemeType,
  });

  const [payoutData, setPayoutData] = useState({
    bank_name: "",
    account_number: "",
    account_name: "",
  });

  useEffect(() => {
    const loadDeviceInfo = async () => {
      const id = await getDeviceSecureID();
      setDeviceId(id);

      const batt = await getBatteryLevel();
      setBatteryLevel(batt);

      const up = await getSystemUptime();
      setUptime(up);

      const ver = await getAndroidVersion();
      setAndroidVer(ver);
    };
    checkBiometrics();
    loadDeviceInfo();
    if (profile) {
      setPayoutData({
        bank_name: profile.bank_name || "",
        account_number: profile.account_number || "",
        account_name: profile.account_name || "",
      });
      setPin(profile.access_pin || "");
      setPrefs({
        notifications_enabled: profile.notifications_enabled ?? true,
        privacy_mode_enabled: profile.privacy_mode_enabled ?? false,
        security_2fa_enabled: profile.security_2fa_enabled ?? false,
        sms_backup_enabled: profile.sms_backup_enabled ?? false,
        biometric_enabled: profile.biometric_enabled ?? false,
        theme_preference: (profile.theme_preference as ThemeType) || "dark",
      });
    }
  }, [profile]);

  const checkBiometrics = async () => {
    if (!LocalAuthentication) return;
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setIsBiometricSupported(compatible);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleTogglePref = async (key: keyof typeof prefs) => {
    if (key === 'theme_preference') {
      const currentTheme = prefs.theme_preference;
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

      setPrefs(p => ({ ...p, theme_preference: nextTheme }));
      toggleTheme();
      Vibration.vibrate(Platform.OS === 'ios' ? 1 : 10);

      try {
        await updateProfile.mutateAsync({ theme_preference: nextTheme });
      } catch (e: any) {
        Alert.alert("Sync Error", "Theme choice not saved: " + e.message);
      }
      return;
    }

    const newVal = !prefs[key];

    if ((key === 'biometric_enabled' || key === 'security_2fa_enabled') && newVal && LocalAuthentication) {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authorize Security Change',
            fallbackLabel: 'Use Passcode',
        });
        if (!result.success) return;
    }

    setPrefs(p => ({ ...p, [key]: newVal }));
    try {
      await updateProfile.mutateAsync({ [key]: newVal });
    } catch (e: any) {
      alert("Failed to update preference: " + e.message);
    }
  };

  const handleSavePin = async () => {
    if (pin.length !== 4) return Alert.alert("Invalid Key", "Access key must be exactly 4 digits.");
    try {
        await updateProfile.mutateAsync({ access_pin: pin });
        Alert.alert("Success", "Access Key registered.");
    } catch (e: any) {
        alert(e.message);
    }
  };

  const handleSavePayout = async () => {
    try {
      await updateProfile.mutateAsync(payoutData);
      setShowPayoutModal(false);
      alert("Payout details updated.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: 'Join me on ClipCapital, the elite banking protocol for Ghanaian artisans. Secure your capital and grow your business today: https://clipcapital.app/download',
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Confirm Logout",
      "Terminate current session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
          }
        }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    const performDelete = async () => {
      try {
        const { error } = await supabase.rpc('delete_user_account');
        if (error) throw error;
        await supabase.auth.signOut();
        alert("Account successfully purged.");
      } catch (e: any) {
        alert("Action restricted: " + e.message);
      }
    };

    Alert.alert("Institutional Purge", "Permanently delete account?", [
      { text: "Cancel", style: "cancel" },
      { text: "DELETE PERMANENTLY", style: "destructive", onPress: performDelete }
    ]);
  };

  const SettingRow = ({ icon: Icon, label, color = colors.primary, onPress, value }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.settingRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
    >
      <View style={[styles.settingIconBox, { backgroundColor: `${color}15` }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        {value ? <Text style={[styles.settingValueText, { color: colors.textDim }]}>{value}</Text> : null}
      </View>
      <ChevronRight size={14} color={colors.textDim} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor={colors.primary} onRefresh={onRefresh} progressViewOffset={Platform.OS === 'ios' ? 110 : 0} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title={t.settings} subtitle={t.merchant_portal} />

          {/* Profile Overview Card */}
          <BouncyTap onPress={() => router.push("/identity")} style={{ marginBottom: 40 }}>
            <Card style={[styles.statusCard, { backgroundColor: colors.cardBg, borderColor: colors.primary + '30' }]}>
               <View style={styles.statusHeader}>
                    <View style={[styles.avatarBox, { borderColor: colors.primary + '40' }]}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.miniAvatar} />
                        ) : (
                            <User size={20} color={colors.textDim} />
                        )}
                    </View>
                    <BadgeCheck size={18} color={colors.primary} />
               </View>
               <Text style={[styles.identityLabel, { color: colors.textDim }]}>{t.auth_identity}</Text>
               <View style={styles.nameRow}>
                    <Text style={[styles.displayName, { color: colors.text }]}>{profile?.display_name || 'Artisan Account'}</Text>
                    <ChevronRight size={16} color={colors.textDim} />
               </View>
               <Text style={[styles.businessName, { color: colors.textDim }]}>{profile?.business_name || 'Individual Merchant'}</Text>
            </Card>
          </BouncyTap>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>{t.core_config}</Text>

            <SettingRow
              icon={Palette}
              label={t.display_mode}
              color="#3b82f6"
              value={prefs.theme_preference === 'dark' ? "Midnight Emerald" : "Pristine White"}
              onPress={() => handleTogglePref('theme_preference')}
            />

            <SettingRow
              icon={Globe}
              label={t.dialect}
              color="#ec4899"
              value={
                language === 'en' ? 'English (Standard)' :
                language === 'twi' ? 'Twi (Asante)' :
                language === 'ga' ? 'Ga (Accra)' :
                language === 'ewe' ? 'Ewe (Volta)' :
                language === 'zh' ? 'Chinese (Mandarin)' : 'French (Standard)'
              }
              onPress={() => setShowLanguageModal(true)}
            />

            <SettingRow
              icon={Bell}
              label={t.alerts}
              value={prefs.notifications_enabled ? "Active" : "Muted"}
              onPress={() => setShowNotifModal(true)}
            />

            <SettingRow
              icon={Shield}
              label={t.security}
              value={prefs.security_2fa_enabled ? "High Security" : "Standard"}
              onPress={() => setShowSecurityModal(true)}
            />
          </View>

          {/* Business & Growth Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>{t.biz_growth}</Text>

            <SettingRow
              icon={CreditCard}
              label={t.payout_destination || "Payout Destination"}
              color={colors.gold}
              value={profile?.account_number ? `${profile.bank_name} • ${profile.account_number}` : "Not configured"}
              onPress={() => setShowPayoutModal(true)}
            />

            <SettingRow
              icon={Share2}
              label={t.invite}
              color="#8b5cf6"
              value="Expand the community"
              onPress={onShare}
            />
          </View>

          {/* Resources Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>{t.resources}</Text>

            <SettingRow
              icon={HelpCircle}
              label={t.support_center}
              color="#10b981"
              onPress={() => router.push("/support")}
            />

            <SettingRow
              icon={FileText}
              label={t.legal}
              color={colors.textDim}
              onPress={() => Alert.alert("Legal Manifest", "Terms of Service and Privacy Policy v4.2 are synchronized with Ghanaian financial regulations.")}
            />
          </View>

          {/* Technical Info Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>{t.sys_manifest}</Text>
            <View style={[styles.manifestCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={styles.manifestRow}>
                    <Info size={14} color={colors.textDim} />
                    <Text style={[styles.manifestText, { color: colors.textDim }]}>{t.version}</Text>
                    <Text style={[styles.manifestValue, { color: colors.text }]}>v4.2.0-STABLE</Text>
                </View>
                <View style={styles.manifestDivider} />
                <View style={styles.manifestRow}>
                    <Activity size={14} color={colors.primary} />
                    <Text style={[styles.manifestText, { color: colors.textDim }]}>{t.vault_status}</Text>
                    <Text style={[styles.manifestValue, { color: colors.primary }]}>{t.operational}</Text>
                </View>
            </View>
          </View>

          {/* Native Java Diagnostics Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textDim }]}>Native System Diagnostics (JAVA)</Text>

            <SettingRow
              icon={Smartphone}
              label="OS Version"
              value={androidVer}
              color="#f472b6"
              onPress={() => showNativeToast(`Android System: ${androidVer}`)}
            />

            <SettingRow
              icon={Zap}
              label="Battery Health"
              value={`${batteryLevel}%`}
              color="#fbbf24"
              onPress={() => showNativeToast(`Current Battery Level: ${batteryLevel}%`)}
            />

            <SettingRow
              icon={Clock}
              label="System Uptime"
              value={uptime}
              color="#38bdf8"
              onPress={() => showNativeToast(`System has been up for: ${uptime}`)}
            />
          </View>

          {/* Account Actions */}
          <View style={{ marginBottom: 40 }}>
            <TouchableOpacity onPress={handleSignOut} style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: colors.border }]}>
              <View style={styles.actionIconBox}>
                <LogOut size={20} color={colors.text} />
              </View>
              <Text style={[styles.actionBtnText, { color: colors.text }]}>{t.sign_out}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 120 }}>
            <TouchableOpacity
              onPress={handleDeleteAccount}
              style={[styles.actionBtn, { backgroundColor: colors.destructive + '05', borderColor: colors.destructive + '10' }]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: colors.destructive + '10' }]}>
                <UserX size={20} color={colors.destructive} />
              </View>
              <Text style={[styles.actionBtnText, { color: colors.destructive }]}>{t.purge}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Security Modal */}
      <Modal visible={showSecurityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.security}</Text>
              <TouchableOpacity onPress={() => setShowSecurityModal(false)}><X size={24} color={colors.textDim} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.pinSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                 <View style={styles.pinHeader}>
                    <Key size={16} color={colors.primary} />
                    <Text style={[styles.pinLabel, { color: colors.textDim }]}>{t.access_key} ({t.digits_4})</Text>
                 </View>
                 <View style={styles.pinInputRow}>
                    <TextInput
                        value={pin}
                        onChangeText={(t) => setPin(t.slice(0, 4).replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        secureTextEntry
                        style={[styles.pinInput, { color: colors.text, borderColor: colors.border }]}
                        placeholder="0000"
                        placeholderTextColor={colors.textDim}
                    />
                    <TouchableOpacity onPress={handleSavePin} style={[styles.pinSaveBtn, { backgroundColor: colors.primary }]}>
                        <Check size={18} color="#000" strokeWidth={3} />
                    </TouchableOpacity>
                 </View>
              </View>

              <View style={[styles.pinSection, { backgroundColor: colors.background, borderColor: colors.border, marginTop: -12 }]}>
                 <View style={styles.pinHeader}>
                    <Smartphone size={16} color={colors.primary} />
                    <Text style={[styles.pinLabel, { color: colors.textDim }]}>SECURE DEVICE ID (JAVA)</Text>
                 </View>
                 <Text style={{ color: colors.text, fontFamily: 'Display-Bold', fontSize: 14 }}>{deviceId}</Text>
              </View>
              <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

              <ToggleRow icon={EyeOff} label={t.privacy_protocol} desc="Mask capital balances across vault" value={prefs.privacy_mode_enabled} onToggle={() => handleTogglePref('privacy_mode_enabled')} />
              <ToggleRow icon={Shield} label={t.two_factor} desc="Challenge mode for vault entry" value={prefs.security_2fa_enabled} onToggle={() => handleTogglePref('security_2fa_enabled')} />
              {isBiometricSupported && (
                  <ToggleRow icon={Fingerprint} label={t.biometric} desc="Institutional Signature Login" value={prefs.biometric_enabled} onToggle={() => handleTogglePref('biometric_enabled')} />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={showLanguageModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.dialect}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}><X size={24} color={colors.textDim} /></TouchableOpacity>
            </View>
            <View style={{ gap: 12 }}>
                {[
                  { id: 'en', name: 'English (Standard)' },
                  { id: 'twi', name: 'Twi (Asante)' },
                  { id: 'ga', name: 'Ga (Accra)' },
                  { id: 'ewe', name: 'Ewe (Volta)' },
                  { id: 'zh', name: 'Chinese (Mandarin)' },
                  { id: 'fr', name: 'French (Standard)' }
                ].map((lang) => (
                    <TouchableOpacity
                      key={lang.id}
                      onPress={async () => {
                        await setLanguage(lang.id as LanguageType);
                        Vibration.vibrate(Platform.OS === 'ios' ? 1 : 10);
                        setShowLanguageModal(false);
                      }}
                      style={[
                        styles.langBtn,
                        {
                          backgroundColor: language === lang.id ? colors.primary + '10' : 'transparent',
                          borderColor: language === lang.id ? colors.primary + '40' : colors.border
                        }
                      ]}
                    >
                        <Text style={[styles.langText, { color: language === lang.id ? colors.primary : colors.text }]}>{lang.name}</Text>
                        {language === lang.id && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Payout Details Modal */}
      <Modal visible={showPayoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Payout Destination</Text>
              <TouchableOpacity onPress={() => setShowPayoutModal(false)}><X size={24} color={colors.textDim} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput value={payoutData.bank_name} onChangeText={(t) => setPayoutData({...payoutData, bank_name: t})} placeholder="PROVIDER / BANK (MTN, GCB, etc.)" placeholderTextColor={colors.textDim} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]} />
              <TextInput value={payoutData.account_number} onChangeText={(t) => setPayoutData({...payoutData, account_number: t})} placeholder="ACCOUNT NUMBER" placeholderTextColor={colors.textDim} keyboardType="numeric" style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceElevated, marginTop: 16 }]} />
              <TextInput value={payoutData.account_name} onChangeText={(t) => setPayoutData({...payoutData, account_name: t})} placeholder="FULL ACCOUNT NAME" placeholderTextColor={colors.textDim} style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceElevated, marginTop: 16, marginBottom: 32 }]} />
              <BouncyTap onPress={handleSavePayout} style={{ backgroundColor: colors.primary, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#000', fontFamily: 'Display-Bold', fontSize: 14 }}>AUTHORIZE PAYOUT UPDATE</Text>
              </BouncyTap>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotifModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Alert Preferences</Text>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}><X size={24} color={colors.textDim} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ToggleRow icon={BellRing} label="Push Notifications" desc="Get real-time updates" value={prefs.notifications_enabled} onToggle={() => handleTogglePref('notifications_enabled')} />
              <ToggleRow icon={Smartphone} label="SMS Backup" desc="Receive SMS for security events" value={prefs.sms_backup_enabled} onToggle={() => handleTogglePref('sms_backup_enabled')} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ToggleRow = ({ icon: Icon, label, desc, value, onToggle }: any) => {
  const { colors } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        <View style={[styles.toggleIcon, { backgroundColor: colors.primary + '10' }]}><Icon size={18} color={colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.toggleDesc, { color: colors.textDim }]}>{desc}</Text>
        </View>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.background, true: colors.primary }} thumbColor="#fff" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 160, paddingTop: 60 },
  statusCard: { marginBottom: 40, padding: 24, borderWidth: 1, borderRadius: 32 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  avatarBox: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  miniAvatar: { width: '100%', height: '100%' },
  identityLabel: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 6 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  displayName: { fontFamily: 'Display-Bold', fontSize: 24, letterSpacing: -0.5 },
  businessName: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' },
  section: { marginBottom: 40 },
  sectionTitle: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24, marginLeft: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 12, borderWidth: 1 },
  settingIconBox: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  settingLabel: { fontFamily: 'Display-Bold', fontSize: 14 },
  settingValueText: { fontSize: 11, marginTop: 2, opacity: 0.7 },
  manifestCard: { padding: 20, borderRadius: 24, borderWidth: 1 },
  manifestRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  manifestText: { fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 2, flex: 1 },
  manifestValue: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 1 },
  manifestDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 12 },
  actionIconBox: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  actionBtnText: { fontFamily: 'Display-Bold', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.85)' },
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, maxHeight: '90%', borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontFamily: 'Display-Bold', fontSize: 22 },
  modalInput: { height: 60, borderRadius: 18, paddingHorizontal: 20, fontFamily: 'Display-Bold', fontSize: 14, borderWidth: 1 },
  pinSection: { marginBottom: 24, padding: 20, borderRadius: 24, borderWidth: 1 },
  pinHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  pinLabel: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 2 },
  pinInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pinInput: { flex: 1, backgroundColor: 'rgba(0,0,0,0.05)', height: 56, borderRadius: 16, textAlign: 'center', fontFamily: 'Display-Bold', fontSize: 24, letterSpacing: 10, borderWidth: 1 },
  pinSaveBtn: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalDivider: { height: 1, marginVertical: 32 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 },
  toggleIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  toggleLabel: { fontFamily: 'Display-Bold', fontSize: 14 },
  toggleDesc: { fontSize: 11, marginTop: 2 },
  langBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 18, borderWidth: 1 },
  langText: { fontFamily: 'Display-Bold', fontSize: 14 }
});
