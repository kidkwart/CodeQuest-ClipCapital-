import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, ActivityIndicator, Alert, Platform, Modal, Switch, TextInput } from "react-native";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUpdateProfile } from "@/lib/app-queries";
import { Input } from "@/components/native/input";
import { Button } from "@/components/native/button";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { LogOut, User, Bell, Shield, Phone, Building, ChevronRight, Lock, CreditCard, BadgeCheck, Save, Check, UserX, X, Eye, EyeOff, Smartphone, BellRing, Fingerprint, Key } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { LinearGradient } from "expo-linear-gradient";

// Optional import for biometrics
let LocalAuthentication: any = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch (e) {}

export default function Settings() {
  const { data: profile, refetch, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [pin, setPin] = useState("");

  const [formData, setFormData] = useState({
    display_name: "",
    business_name: "",
    phone_number: "",
  });

  const [prefs, setPrefs] = useState({
    notifications_enabled: true,
    privacy_mode_enabled: false,
    security_2fa_enabled: false,
    sms_backup_enabled: false,
    biometric_enabled: false,
  });

  const [payoutData, setPayoutData] = useState({
    bank_name: "",
    account_number: "",
    account_name: "",
  });

  useEffect(() => {
    checkBiometrics();
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        business_name: profile.business_name || "",
        phone_number: profile.phone_number || "",
      });
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
    const newVal = !prefs[key];

    // If enabling sensitive features, verify identity
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
      if (key === 'biometric_enabled') {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem("biometric_enabled", newVal ? "true" : "false");
      }
    } catch (e: any) {
      alert("Failed to update preference: " + e.message);
    }
  };

  const handleSavePin = async () => {
    if (pin.length !== 4) return Alert.alert("Invalid Key", "Access key must be exactly 4 digits.");
    try {
        await updateProfile.mutateAsync({ access_pin: pin });
        Alert.alert("Success", "Your private Institutional Access Key has been registered.");
    } catch (e: any) {
        alert(e.message);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(formData);
      alert("Merchant Identity synchronized.");
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteAccount = async () => {
    const performDelete = async () => {
      try {
        const { error } = await supabase.rpc('delete_user_account');
        if (error) throw error;
        await supabase.auth.signOut();
        alert("Account successfully purged from system.");
      } catch (e: any) {
        alert("Action restricted: " + e.message);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("Permanently delete account? This is irreversible.")) performDelete();
    } else {
      Alert.alert("Institutional Purge", "Are you sure you want to permanently delete your account, your wallet balance, and all business records? This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "DELETE PERMANENTLY", style: "destructive", onPress: performDelete }
      ]);
    }
  };

  const SettingRow = ({ icon: Icon, label, color = "#10b981", onPress, value }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.settingRow}
    >
      <View style={[styles.settingIconBox, { backgroundColor: `${color}15` }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value ? <Text style={styles.settingValueText}>{value}</Text> : null}
      </View>
      <ChevronRight size={14} color="#405045" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor="#10B981" onRefresh={onRefresh} progressViewOffset={Platform.OS === 'ios' ? 60 : 0} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="Settings" subtitle="Merchant Portal" />

          {/* Verification Status Card */}
          <Card style={styles.statusCard}>
             <View style={styles.statusHeader}>
                <View style={styles.sessionBadge}>
                   <Text style={styles.sessionText}>Active Session</Text>
                </View>
                <BadgeCheck size={18} color="#10b981" />
             </View>
             <Text style={styles.identityLabel}>Authorized Identity</Text>
             <Text style={styles.displayName}>{profile?.display_name || 'Artisan Account'}</Text>
          </Card>

          {/* Identity Form */}
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>Identity Modification</Text>
             <Card style={styles.formCard}>
                <Input
                  label="Display Name"
                  value={formData.display_name}
                  onChangeText={(t) => setFormData({...formData, display_name: t})}
                  containerClassName="mb-6"
                />
                <Input
                  label="Registered Business"
                  value={formData.business_name}
                  onChangeText={(t) => setFormData({...formData, business_name: t})}
                  containerClassName="mb-6"
                />
                <Input
                  label="Merchant Contact"
                  value={formData.phone_number}
                  onChangeText={(t) => setFormData({...formData, phone_number: t})}
                  keyboardType="phone-pad"
                  containerClassName="mb-8"
                />

                <Button
                  title="Synchronize Profile"
                  onPress={handleSave}
                  loading={updateProfile.isPending}
                />
             </Card>
          </View>

          {/* Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <SettingRow
              icon={Bell}
              label="Alert Notifications"
              value={prefs.notifications_enabled ? "Enabled" : "Muted"}
              onPress={() => setShowNotifModal(true)}
            />
            <SettingRow
              icon={CreditCard}
              label="Payout Account"
              color="#f59e0b"
              value={profile?.account_number ? `${profile.bank_name} • ${profile.account_number}` : "Not configured"}
              onPress={() => setShowPayoutModal(true)}
            />
            <SettingRow
              icon={Shield}
              label="Security Protocol"
              value={prefs.security_2fa_enabled ? "High Security" : "Standard"}
              onPress={() => setShowSecurityModal(true)}
            />
          </View>

          {/* Account Actions */}
          <View style={{ marginBottom: 40 }}>
            <Text style={styles.sectionTitle}>Account Control</Text>
            <TouchableOpacity onPress={handleSignOut} style={styles.actionBtn}>
              <View style={styles.actionIconBox}>
                <LogOut size={20} color="#fcfcfc" />
              </View>
              <Text style={styles.actionBtnText}>Secure Sign Out</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 100 }}>
            <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
            <TouchableOpacity
              onPress={handleDeleteAccount}
              style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.1)' }]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <UserX size={20} color="#EF4444" />
              </View>
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete Institutional Account</Text>
            </TouchableOpacity>
            <Text style={{ color: '#405045', fontSize: 10, textAlign: 'center', marginTop: 12, paddingHorizontal: 20 }}>
                Terminating your account will permanently wipe all vault data and financial history.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Security Modal */}
      <Modal visible={showSecurityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Security Protocol</Text>
              <TouchableOpacity onPress={() => setShowSecurityModal(false)}><X size={24} color="#7d8a84" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Access PIN Section */}
              <View style={styles.pinSection}>
                 <View style={styles.pinHeader}>
                    <Key size={16} color="#10b981" />
                    <Text style={styles.pinLabel}>ACCESS KEY (4-DIGITS)</Text>
                 </View>
                 <View style={styles.pinInputRow}>
                    <TextInput
                        value={pin}
                        onChangeText={(t) => setPin(t.slice(0, 4).replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        secureTextEntry
                        style={styles.pinInput}
                        placeholder="0000"
                        placeholderTextColor="#405045"
                    />
                    <TouchableOpacity onPress={handleSavePin} style={styles.pinSaveBtn}>
                        <Check size={18} color="#000" strokeWidth={3} />
                    </TouchableOpacity>
                 </View>
                 <Text style={styles.pinHint}>This key will be required during 2FA challenges.</Text>
              </View>

              <View style={styles.modalDivider} />

              <ToggleRow
                icon={EyeOff}
                label="Privacy Protocol"
                desc="Mask capital balances across vault"
                value={prefs.privacy_mode_enabled}
                onToggle={() => handleTogglePref('privacy_mode_enabled')}
              />
              <ToggleRow
                icon={Shield}
                label="Two-Factor Auth"
                desc="Challenge mode for vault entry"
                value={prefs.security_2fa_enabled}
                onToggle={() => handleTogglePref('security_2fa_enabled')}
              />
              {isBiometricSupported && (
                  <ToggleRow
                    icon={Fingerprint}
                    label="Biometric Unlock"
                    desc="Institutional Body Signature Login"
                    value={prefs.biometric_enabled}
                    onToggle={() => handleTogglePref('biometric_enabled')}
                  />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payout Details Modal */}
      <Modal visible={showPayoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payout Destination</Text>
              <TouchableOpacity onPress={() => setShowPayoutModal(false)}><X size={24} color="#7d8a84" /></TouchableOpacity>
            </View>
            <ScrollView>
              <Input label="Provider / Bank" placeholder="MTN, GCB, etc." value={payoutData.bank_name} onChangeText={(t) => setPayoutData({...payoutData, bank_name: t})} containerClassName="mb-6" />
              <Input label="Account Number" placeholder="024..." value={payoutData.account_number} onChangeText={(t) => setPayoutData({...payoutData, account_number: t})} keyboardType="numeric" containerClassName="mb-6" />
              <Input label="Account Name" placeholder="Exact name on account" value={payoutData.account_name} onChangeText={(t) => setPayoutData({...payoutData, account_name: t})} containerClassName="mb-8" />
              <Button title="Update Payout Account" onPress={handleSavePayout} loading={updateProfile.isPending} variant="gold" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotifModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alert Preferences</Text>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}><X size={24} color="#7d8a84" /></TouchableOpacity>
            </View>
            <ScrollView>
              <ToggleRow icon={BellRing} label="Push Notifications" desc="Get real-time updates" value={prefs.notifications_enabled} onToggle={() => handleTogglePref('notifications_enabled')} />
              <ToggleRow icon={Smartphone} label="SMS Backup" desc="Receive SMS for security events" value={prefs.sms_backup_enabled} onToggle={() => handleTogglePref('sms_backup_enabled')} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ToggleRow = ({ icon: Icon, label, desc, value, onToggle }: any) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleLeft}>
      <View style={styles.toggleIcon}><Icon size={18} color="#10b981" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
    </View>
    <Switch value={value} onValueChange={onToggle} trackColor={{ false: "#1a211e", true: "#10b981" }} thumbColor="#fff" />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c0a' },
  scrollContent: { paddingBottom: 160, paddingTop: 60 },
  statusCard: { marginBottom: 40, padding: 24, backgroundColor: '#0f1714', borderColor: '#10b98130' },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sessionBadge: { height: 28, paddingHorizontal: 12, borderRadius: 100, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  sessionText: { color: '#10b981', fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase' },
  identityLabel: { color: 'rgba(252,252,252,0.4)', fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 },
  displayName: { fontFamily: 'Display-Bold', color: 'white', fontSize: 24, letterSpacing: -0.5 },
  section: { marginBottom: 40 },
  sectionTitle: { color: 'rgba(252,252,252,0.3)', fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24, marginLeft: 8 },
  formCard: { padding: 28, backgroundColor: '#0f1714', borderRadius: 32 },
  settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1714', padding: 20, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.03)' },
  settingIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  settingLabel: { fontFamily: 'Display-Bold', color: 'white', fontSize: 14 },
  settingValueText: { color: '#7d8a84', fontSize: 12, marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12 },
  actionIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  actionBtnText: { fontFamily: 'Display-Bold', color: 'white', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.85)' },
  modalContent: { backgroundColor: '#0f1714', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontFamily: 'Display-Bold', color: 'white', fontSize: 20 },
  pinSection: { marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  pinHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  pinLabel: { color: '#7d8a84', fontWeight: '900', fontSize: 9, letterSpacing: 2 },
  pinInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pinInput: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', height: 56, borderRadius: 16, textAlign: 'center', color: 'white', fontFamily: 'Display-Bold', fontSize: 24, letterSpacing: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  pinSaveBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  pinHint: { color: '#405045', fontSize: 10, fontWeight: 'bold', marginTop: 12, textAlign: 'center' },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 32 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 },
  toggleIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  toggleLabel: { color: 'white', fontFamily: 'Display-Bold', fontSize: 14 },
  toggleDesc: { color: '#7d8a84', fontSize: 12, marginTop: 2 }
});
