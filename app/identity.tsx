import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Platform, Vibration, Image, KeyboardAvoidingView } from "react-native";
import { useProfile, useUpdateProfile } from "@/lib/app-queries";
import { Input } from "@/components/native/input";
import { Button } from "@/components/native/button";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { User, ShieldCheck, ArrowLeft, Camera, Check } from "lucide-react-native";
import { useRouter, Stack } from "expo-router";
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "@/context/language-context";
import * as ImagePicker from 'expo-image-picker';
import { supabase } from "@/integrations/supabase/client";

export default function IdentityScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    display_name: "",
    username: "",
    business_name: "",
    business_type: "",
    location: "",
    phone_number: "",
    bio: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        username: profile.username || "",
        business_name: profile.business_name || "",
        business_type: profile.business_type || "",
        location: profile.location || "",
        phone_number: profile.phone_number || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.media_permission_denied, t.media_access_required);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const formDataUpload = new FormData();
      formDataUpload.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formDataUpload);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      Vibration.vibrate(10);
    } catch (error: any) {
      Alert.alert(t.upload_failed, error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync(formData);
      Vibration.vibrate(Platform.OS === 'ios' ? 1 : 20);
      Alert.alert(t.identity + " " + t.operational, t.sync_success, [
        { text: t.view_all, onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert(t.sync_error, e.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        headerShown: true,
        title: "",
        headerTransparent: true,
        headerLeft: () => (
          <BouncyTap onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}>
            <ArrowLeft size={20} color={colors.text} />
          </BouncyTap>
        ),
      }} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={{ paddingHorizontal: 24 }}>
            <PremiumHeader title={t.identity} subtitle={`${t.modification} v4.2`} />

            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <BouncyTap onPress={pickImage} containerStyle={{ alignItems: 'center' }}>
                <View style={[styles.avatarContainer, { borderColor: colors.primary + '40' }]}>
                    {profile?.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
                            <User size={40} color={colors.textDim} />
                        </View>
                    )}
                    <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                        <Camera size={14} color="#000" strokeWidth={3} />
                    </View>
                    {uploading && (
                        <View style={styles.uploadOverlay}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    )}
                </View>
              </BouncyTap>
              <Text style={[styles.avatarHint, { color: colors.textDim }]}>{t.photo_protocol}</Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textDim }]}>{t.credentials}</Text>
              <Card style={[styles.formCard, { backgroundColor: colors.cardBg }]}>
                <Input
                  label={t.display_name_label}
                  value={formData.display_name}
                  onChangeText={(t) => setFormData({...formData, display_name: t})}
                  containerClassName="mb-6"
                />
                <Input
                  label={t.unique_username_label}
                  value={formData.username}
                  onChangeText={(t) => setFormData({...formData, username: t.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                  containerClassName="mb-6"
                />
                <Input
                  label={t.registered_business_label}
                  value={formData.business_name}
                  onChangeText={(t) => setFormData({...formData, business_name: t})}
                  containerClassName="mb-6"
                />
                <Input
                  label={t.business_category_label}
                  value={formData.business_type}
                  onChangeText={(t) => setFormData({...formData, business_type: t})}
                  placeholder={t.business_category_placeholder}
                  containerClassName="mb-6"
                />
                <Input
                  label={t.business_location_label}
                  value={formData.location}
                  onChangeText={(t) => setFormData({...formData, location: t})}
                  placeholder={t.business_loc_placeholder}
                  containerClassName="mb-6"
                />
                <Input
                  label={t.merchant_contact_label}
                  value={formData.phone_number}
                  onChangeText={(t) => setFormData({...formData, phone_number: t})}
                  keyboardType="phone-pad"
                  containerClassName="mb-6"
                />
                <Input
                  label={t.professional_bio_label}
                  value={formData.bio}
                  onChangeText={(t) => setFormData({...formData, bio: t})}
                  placeholder={t.professional_bio_placeholder}
                  multiline
                  containerClassName="mb-8"
                />

                <Button
                  title={t.secure_creds}
                  onPress={handleSave}
                  loading={updateProfile.isPending}
                />
              </Card>
            </View>

            <View style={styles.securityNote}>
              <ShieldCheck size={14} color={colors.primary} />
              <Text style={[styles.securityText, { color: colors.textDim }]}>{t.log_info}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60, paddingTop: 100 },
  backBtn: { marginLeft: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarSection: { alignItems: 'center', marginBottom: 40 },
  avatarContainer: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, padding: 4, position: 'relative' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 60 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  cameraBadge: { position: 'absolute', bottom: 4, right: 4, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  avatarHint: { fontFamily: 'Display-Bold', fontSize: 8, letterSpacing: 2, marginTop: 16, opacity: 0.8 },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, marginLeft: 8 },
  formCard: { padding: 24, borderRadius: 28 },
  securityNote: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, marginTop: 12 },
  securityText: { fontSize: 10, flex: 1, lineHeight: 16 }
});
