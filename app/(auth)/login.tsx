import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, StyleSheet } from "react-native";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "expo-router";
import { Mail, Lock, ArrowRight, User, Building } from "lucide-react-native";
import { KenteBackground } from "@/components/native/effects/kente-pattern";

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit() {
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
        Alert.alert("Success", "Check your email for the verification link!");
        setMode("signin");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <KenteBackground />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: 'transparent' }}
      >
        <View className="flex-1 px-8 pt-20 pb-12">

          {/* Logo Branding */}
          <View className="items-center mb-10">
            <View style={{ width: 280, height: 100, backgroundColor: '#0f1714', borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#10b98130' }}>
               <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 40, letterSpacing: -2 }}>
                 Clip<Text style={{ color: '#10b981' }}>Capital</Text>
               </Text>
            </View>
            <View className="bg-primary/10 px-4 py-1 rounded-full border border-primary/20 mt-4">
              <Text className="text-primary font-black text-[10px] uppercase tracking-[0.4em]">Finance. Simplified.</Text>
            </View>
          </View>

          {/* Tab Switcher */}
          <View className="w-full mb-10 flex-row bg-[#0f1714]/80 p-1.5 rounded-[28px] border border-white/5">
            <TouchableOpacity
              onPress={() => setMode("signin")}
              activeOpacity={0.8}
              className={`flex-1 py-4 rounded-[22px] items-center justify-center ${mode === "signin" ? 'bg-primary shadow-lg shadow-primary/30' : ''}`}
            >
              <Text style={{ fontFamily: mode === "signin" ? 'Display-Bold' : 'Display-Regular' }} className={`text-xs uppercase tracking-widest ${mode === "signin" ? 'text-[#080c0a]' : 'text-muted-foreground'}`}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode("signup")}
              activeOpacity={0.8}
              className={`flex-1 py-4 rounded-[22px] items-center justify-center ${mode === "signup" ? 'bg-primary shadow-lg shadow-primary/30' : ''}`}
            >
              <Text style={{ fontFamily: mode === "signup" ? 'Display-Bold' : 'Display-Regular' }} className={`text-xs uppercase tracking-widest ${mode === "signup" ? 'text-[#080c0a]' : 'text-muted-foreground'}`}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="space-y-5">
            {mode === "signup" && (
              <View className="space-y-5 mb-5">
                <InputWithIcon
                  label="Full Name"
                  icon={User}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="e.g. Kwame Mensah"
                />
                <InputWithIcon
                  label="Business Name"
                  icon={Building}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="e.g. Mensah Quality Cuts"
                />
              </View>
            )}

            <InputWithIcon
              label="Email Address"
              icon={Mail}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
            />

            <InputWithIcon
              label="Password"
              icon={Lock}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            <TouchableOpacity
              onPress={onSubmit}
              disabled={loading}
              activeOpacity={0.9}
              className="mt-8 bg-primary h-16 rounded-[28px] flex-row items-center justify-center shadow-2xl shadow-primary/40 border-t border-white/20"
            >
              <Text style={{ fontFamily: 'Display-Bold' }} className="text-[#080c0a] text-sm uppercase tracking-[0.2em] mr-2">
                {loading ? "Processing..." : mode === "signin" ? "Enter Shop" : "Start Growing"}
              </Text>
              {!loading && <ArrowRight size={20} color="#080c0a" />}
            </TouchableOpacity>
          </View>

          <View className="mt-auto pt-16 items-center">
            <View className="px-6 py-2 bg-white/5 rounded-full border border-white/5 flex-row items-center gap-2">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500" />
              <Text className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.3em]">
                Ghana's Partner for Trades
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
      <Text className="text-[10px] font-black text-[#10B981] opacity-60 uppercase mb-3 ml-2 tracking-[0.3em]">{label}</Text>
      <View className="flex-row items-center bg-[#0f1714]/60 rounded-[24px] px-5 h-14 border border-white/5">
        <Icon size={18} color="#10B981" opacity={0.6} />
        <TextInput
          placeholderTextColor="#334140"
          className="flex-1 ml-4 text-white font-bold text-sm"
          autoCapitalize="none"
          {...props}
        />
      </View>
    </View>
  );
}
