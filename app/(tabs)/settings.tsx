import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUpdateProfile } from "@/lib/app-queries";
import { Input } from "@/components/native/input";
import { Button } from "@/components/native/button";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { LogOut, User, Bell, Shield, Phone, Building, ChevronRight, Lock, CreditCard, BadgeCheck, Save, Check, UserX } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';

export default function Settings() {
  const { data: profile, refetch, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    display_name: "",
    business_name: "",
    phone_number: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        business_name: profile.business_name || "",
        phone_number: profile.phone_number || "",
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteAccount = async () => {
    const performDelete = async () => {
      try {
        // Step 1: Sign out first to prevent session errors during deletion (Supabase typical workflow)
        const { error } = await supabase.rpc('delete_user_account');
        if (error) throw error;

        await supabase.auth.signOut();
        alert("Account scheduled for deletion. Access revoked.");
      } catch (e: any) {
        alert("Action restricted: " + e.message);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("CRITICAL ACTION: Are you sure you want to permanently delete your account? This cannot be undone.")) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Delete Account",
        "This is permanent. All your data, credit history, and susu memberships will be erased. Proceed?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete Permanently", style: "destructive", onPress: performDelete }
        ]
      );
    }
  };

  const SettingRow = ({ icon: Icon, label, color = "#10b981", onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f1714',
        paddingHorizontal: 20,
        paddingVertical: 24,
        borderRadius: 28,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
        <Icon size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 15 }}>{label}</Text>
      </View>
      <ChevronRight size={16} color="#405045" />
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
          <Card glass style={{ marginBottom: 40, padding: 32, borderColor: '#10b98140' }}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <View style={{ height: 32, paddingHorizontal: 12, borderRadius: 100, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
                   <Text style={{ color: '#10b981', fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Active Session</Text>
                </View>
                <BadgeCheck size={20} color="#10b981" />
             </View>

             <View>
                <Text style={{ color: 'rgba(252,252,252,0.4)', fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Authorized Identity</Text>
                <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 24, letterSpacing: -1 }}>{profile?.display_name || 'Artisan Account'}</Text>
             </View>
          </Card>

          {/* Profile Form */}
          <View style={{ marginBottom: 40 }}>
             <Text style={{ color: 'rgba(252,252,252,0.3)', fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24, marginLeft: 8 }}>Identity Modification</Text>
             <Card style={{ padding: 28, backgroundColor: 'rgba(15,23,20,0.4)', borderRadius: 35 }}>
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
                />
             </Card>
          </View>

          {/* Refined Premium Save Action */}
          <View style={{ marginBottom: 60, borderRadius: 32, overflow: 'hidden', borderWeight: 1, borderColor: '#10b98130', alignSelf: 'center', width: '100%' }}>
            <LinearGradient
              colors={['#10B981', '#064e3b']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ padding: 24, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 20 }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Display-Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>Commit Data</Text>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSave}
                disabled={updateProfile.isPending}
                style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 }}
              >
                {updateProfile.isPending ? (
                  <ActivityIndicator color="#064e3b" />
                ) : (
                  <Check size={32} color="#064e3b" strokeWidth={3} />
                )}
              </TouchableOpacity>

              <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Display-Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>Sync Profile</Text>
            </LinearGradient>
          </View>

          {/* Preferences */}
          <View style={{ marginBottom: 48 }}>
            <Text style={{ color: 'rgba(252,252,252,0.3)', fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24, marginLeft: 8 }}>Preferences</Text>
            <SettingRow icon={Bell} label="Alert Notifications" onPress={() => alert("Coming soon")} />
            <SettingRow icon={CreditCard} label="Payment Methods" color="#f59e0b" onPress={() => alert("Coming soon")} />
            <SettingRow icon={Shield} label="Security Protocol" onPress={() => alert("Coming soon")} />
          </View>

          {/* Account Actions */}
          <View style={{ marginBottom: 80 }}>
            <Text style={{ color: 'rgba(252,252,252,0.3)', fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 24, marginLeft: 8 }}>Account Integrity</Text>

            {/* Sign Out */}
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: 24,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.05)',
                marginBottom: 12
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <LogOut size={20} color="#fcfcfc" />
              </View>
              <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 14 }}>Secure Sign Out</Text>
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(239,68,68,0.05)',
                padding: 24,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.1)'
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <UserX size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Display-Bold', color: '#EF4444', fontSize: 14 }}>Permanent Deletion</Text>
                <Text style={{ color: 'rgba(239,68,68,0.4)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 }}>Erase all personal merchant data</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
