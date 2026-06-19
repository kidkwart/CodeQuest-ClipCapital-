import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUpdateProfile } from "@/lib/app-queries";
import { Input } from "@/components/native/input";
import { Button } from "@/components/native/button";
import { Card } from "@/components/native/card";
import { LogOut, User, Bell, Shield, Phone, Building, Save } from "lucide-react-native";

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
      alert("Profile updated successfully!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const SettingItem = ({ icon: Icon, label, color = "#FFFFFF", onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center bg-surface p-4 rounded-2xl mb-3 border border-border/20"
    >
      <View className="w-10 h-10 rounded-xl bg-muted/20 items-center justify-center mr-4">
        <Icon size={20} color={color} />
      </View>
      <Text className="flex-1 text-foreground font-bold">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      className="flex-1 bg-background pt-14 px-6"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
    >
      <Text className="text-3xl font-bold text-foreground mb-8">Settings</Text>

      {/* Profile Form */}
      <View className="mb-8">
        <Text className="text-lg font-bold text-foreground mb-4">Edit Profile</Text>
        <Card className="space-y-4">
          <Input
            label="Full Name"
            value={formData.display_name}
            onChangeText={(t) => setFormData({...formData, display_name: t})}
            icon={<User size={18} color="#737373" />}
          />
          <Input
            label="Business Name"
            value={formData.business_name}
            onChangeText={(t) => setFormData({...formData, business_name: t})}
            icon={<Building size={18} color="#737373" />}
          />
          <Input
            label="MoMo Number"
            value={formData.phone_number}
            onChangeText={(t) => setFormData({...formData, phone_number: t})}
            icon={<Phone size={18} color="#737373" />}
            keyboardType="phone-pad"
          />
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={updateProfile.isPending}
            className="mt-2"
          />
        </Card>
      </View>

      {/* App Options */}
      <View className="mb-8">
        <Text className="text-lg font-bold text-foreground mb-4">Preferences</Text>
        <SettingItem icon={User} label="Professional Details" onPress={() => alert("Detailed settings coming soon")} />
        <SettingItem icon={Bell} label="Notifications" onPress={() => alert("Notification settings coming soon")} />
        <SettingItem icon={Shield} label="Security & PIN" onPress={() => alert("Security settings coming soon")} />
      </View>

      {/* Navigation Shortcuts */}
      <View className="mb-8">
        <Text className="text-lg font-bold text-foreground mb-4">Quick Links</Text>
        <SettingItem icon={LogOut} label="Log Out" color="#EF4444" onPress={handleSignOut} />
      </View>
      <View className="h-20" />
    </ScrollView>
  );
}
