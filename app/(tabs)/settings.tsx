import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, ActivityIndicator, Alert, Platform, Modal } from "react-native";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUpdateProfile } from "@/lib/app-queries";
import { Input } from "@/components/native/input";
import { Button } from "@/components/native/button";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { LogOut, User, Bell, Shield, Phone, Building, ChevronRight, Lock, CreditCard, BadgeCheck, Save, Check, UserX, X } from "lucide-react-native";
import { BlurView } from "expo-blur";

export default function Settings() {
  const { data: profile, refetch, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const [formData, setFormData] = useState({
    display_name: "",
    business_name: "",
    phone_number: "",
  });

  const [payoutData, setPayoutData] = useState({
    bank_name: "",
    account_number: "",
    account_name: "",
  });

  useEffect(() => {
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
    }
  }, [profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(formData);
      alert("Merchant Identity successfully synchronized.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSavePayout = async () => {
    try {
      await updateProfile.mutateAsync(payoutData);
      setShowPayoutModal(false);
      alert("Payout details updated successfully.");
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
        alert("Account deleted.");
      } catch (e: any) {
        alert("Action restricted: " + e.message);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("Permanently delete account?")) performDelete();
    } else {
      Alert.alert("Delete Account", "This is permanent. Proceed?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete }
      ]);
    }
  };

  const SettingRow = ({ icon: Icon, label, color = "#10b981", onPress, value }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f1714',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderRadius: 24,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
        <Icon size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 14 }}>{label}</Text>
        {value ? <Text style={{ color: '#7d8a84', fontSize: 12, marginTop: 2 }}>{value}</Text> : null}
      </View>
      <ChevronRight size={14} color="#405045" />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 60 }}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor="#10B981" onRefresh={onRefresh} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="Settings" subtitle="Merchant Portal" />

          {/* Verification Status Card */}
          <Card glass style={{ marginBottom: 40, padding: 24, borderColor: '#10b98130' }}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ height: 28, paddingHorizontal: 12, borderRadius: 100, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
                   <Text style={{ color: '#10b981', fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Active Session</Text>
                </View>
                <BadgeCheck size={18} color="#10b981" />
             </View>
             <Text style={{ color: 'rgba(252,252,252,0.4)', fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Authorized Identity</Text>
             <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 24, letterSpacing: -0.5 }}>{profile?.display_name || 'Artisan Account'}</Text>
          </Card>

          {/* Identity Form */}
          <View style={{ marginBottom: 40 }}>
             <Text style={{ color: 'rgba(252,252,252,0.3)', fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24, marginLeft: 8 }}>Identity Modification</Text>
             <Card style={{ padding: 28, backgroundColor: 'rgba(15,23,20,0.4)', borderRadius: 32 }}>
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
                  size="default"
                />
             </Card>
          </View>

          {/* Preferences */}
          <View style={{ marginBottom: 48 }}>
            <Text style={{ color: 'rgba(252,252,252,0.3)', fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24, marginLeft: 8 }}>Preferences</Text>
            <SettingRow icon={Bell} label="Alert Notifications" onPress={() => alert("Coming soon")} />
            <SettingRow
              icon={CreditCard}
              label="Payout Account"
              color="#f59e0b"
              value={profile?.account_number ? `${profile.bank_name} • ${profile.account_number}` : "Not configured"}
              onPress={() => setShowPayoutModal(true)}
            />
            <SettingRow icon={Shield} label="Security Protocol" onPress={() => alert("Coming soon")} />
          </View>

          {/* Account Actions */}
          <View style={{ marginBottom: 80 }}>
            <Text style={{ color: 'rgba(252,252,252,0.3)', fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24, marginLeft: 8 }}>Account Integrity</Text>

            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.7}
              style={styles.actionBtn}
            >
              <View style={styles.actionIcon}>
                <LogOut size={20} color="#fcfcfc" />
              </View>
              <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 14 }}>Secure Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
              style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.1)' }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <UserX size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Display-Bold', color: '#EF4444', fontSize: 14 }}>Permanent Deletion</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Payout Details Modal */}
      <Modal
        visible={showPayoutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPayoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payout Destination</Text>
              <TouchableOpacity onPress={() => setShowPayoutModal(false)}>
                <X size={24} color="#7d8a84" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Input
                label="Provider / Bank Name"
                placeholder="e.g. MTN, Vodafone, GCB"
                value={payoutData.bank_name}
                onChangeText={(t) => setPayoutData({...payoutData, bank_name: t})}
                containerClassName="mb-6"
              />
              <Input
                label="Account Number"
                placeholder="e.g. 0244000000"
                value={payoutData.account_number}
                onChangeText={(t) => setPayoutData({...payoutData, account_number: t})}
                keyboardType="numeric"
                containerClassName="mb-6"
              />
              <Input
                label="Account Name"
                placeholder="Name on account"
                value={payoutData.account_name}
                onChangeText={(t) => setPayoutData({...payoutData, account_name: t})}
                containerClassName="mb-8"
              />

              <Button
                title="Update Payout Account"
                onPress={handleSavePayout}
                loading={updateProfile.isPending}
                variant="gold"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: '#0f1714',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 32,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32
  },
  modalTitle: {
    fontFamily: 'Display-Bold',
    color: 'white',
    fontSize: 20
  }
});
