import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Linking, ActivityIndicator, StyleSheet, Vibration, Keyboard, Dimensions, ImageBackground } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useMyMessages, useSendMessageToAdmin, useProfile } from "@/lib/app-queries";
import { useLanguage } from "@/context/language-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldCheck, Send, MessageCircle, ArrowLeft, HelpCircle, Smartphone, ChevronRight, Paperclip, Headphones, LifeBuoy } from "lucide-react-native";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/theme-context";

const { width } = Dimensions.get("window");

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const { data: messages, isLoading } = useMyMessages();
  const sendMessage = useSendMessageToAdmin();
  const [text, setText] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const qc = useQueryClient();

  const isDark = theme === 'dark';

  useEffect(() => {
    const channel = supabase
      .channel('support-chat-v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, () => {
        qc.invalidateQueries({ queryKey: ["admin-messages"] });
        Vibration.vibrate(Platform.OS === 'ios' ? 0 : 10);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText("");
    try {
      await sendMessage.mutateAsync(msg);
      Vibration.vibrate(Platform.OS === 'ios' ? 0 : 5);
    } catch (e: any) {
      alert(t.failed_send + ": " + (e.message || t.check_connection));
      setText(msg);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        headerShown: true,
        title: "",
        headerTransparent: true,
        headerLeft: () => (
          <BouncyTap
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}
          >
            <ArrowLeft size={22} color={colors.text} />
          </BouncyTap>
        )
      }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: 100 }]}
        >
          <View style={{ paddingHorizontal: 24 }}>

            {/* Minimal Elegant Header */}
            <View style={styles.headerSection}>
                <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                    <Headphones size={12} color={colors.primary} />
                    <Text style={[styles.badgeText, { color: colors.primary }]}>{t.command_center}</Text>
                </View>
                <Text style={[styles.title, { color: colors.text }]}>{t.support_protocol}</Text>
                <Text style={[styles.subtitle, { color: colors.textDim }]}>{t.direct_line_support}</Text>
            </View>

            {/* WhatsApp/Call Quick Links */}
            <View style={styles.quickLinks}>
                <TouchableOpacity onPress={() => Linking.openURL("https://wa.me/233509511256")} style={[styles.linkBtn, { borderColor: colors.border }]}>
                    <MessageCircle size={18} color="#25D366" />
                    <Text style={[styles.linkText, { color: colors.text }]}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL("tel:0599242307")} style={[styles.linkBtn, { borderColor: colors.border }]}>
                    <Smartphone size={18} color={colors.primary} />
                    <Text style={[styles.linkText, { color: colors.text }]}>{t.voice_link}</Text>
                </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <View style={styles.chatContainer}>
              {isLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
              ) : (messages ?? []).length === 0 ? (
                <View style={styles.emptyState}>
                  <LifeBuoy size={40} color={colors.textDim} opacity={0.3} />
                  <Text style={[styles.emptyText, { color: colors.textDim }]}>{t.no_active_inquiries}</Text>
                </View>
              ) : (
                messages!.map((m, idx) => {
                  const isAdmin = m.is_from_admin;
                  return (
                    <Animated.View
                        key={m.id}
                        entering={FadeInDown.delay(idx * 50)}
                        style={[styles.msgRow, isAdmin ? styles.rowAdmin : styles.rowUser]}
                    >
                      <View style={[
                        styles.bubble,
                        isAdmin ? [styles.bubbleAdmin, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }] : [styles.bubbleUser, { backgroundColor: colors.primary }]
                      ]}>
                        <Text style={[styles.msgText, { color: isAdmin ? colors.text : '#000' }]}>{m.message}</Text>
                      </View>
                      <Text style={[styles.timeText, { color: colors.textDim }]}>
                        {isAdmin ? t.agent : t.you} · {format(new Date(m.created_at), "h:mm a")}
                      </Text>
                    </Animated.View>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>

        {/* RE-ENGINEERED INPUT BAR */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <View style={styles.inputInner}>
                <TouchableOpacity style={styles.attachButton}>
                    <Paperclip size={22} color={colors.textDim} />
                </TouchableOpacity>

                <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                    <TextInput
                        value={text}
                        onChangeText={setText}
                        placeholder={t.type_here}
                        placeholderTextColor={colors.textDim}
                        style={[styles.textInput, { color: colors.text }]}
                        multiline
                    />
                </View>

                {text.trim().length > 0 && (
                    <TouchableOpacity onPress={handleSend} style={[styles.sendButton, { backgroundColor: colors.primary }]}>
                        <Send size={20} color="#000" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 16 },
  scrollContent: { },
  headerSection: { marginBottom: 32, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, marginBottom: 12 },
  badgeText: { fontFamily: 'Display-Bold', fontSize: 9, letterSpacing: 1 },
  title: { fontFamily: 'Display-Bold', fontSize: 26, marginBottom: 4 },
  subtitle: { fontSize: 13, opacity: 0.7, textAlign: 'center' },
  quickLinks: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  linkBtn: { flex: 1, height: 50, borderRadius: 16, borderWeight: 1, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  linkText: { fontFamily: 'Display-Bold', fontSize: 13 },
  chatContainer: { paddingBottom: 20 },
  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
  emptyText: { textAlign: 'center', marginTop: 12, fontSize: 12, paddingHorizontal: 40 },
  msgRow: { marginBottom: 24, maxWidth: '85%' },
  rowAdmin: { alignSelf: 'flex-start' },
  rowUser: { alignSelf: 'flex-end' },
  bubble: { padding: 16, borderRadius: 20 },
  bubbleAdmin: { borderTopLeftRadius: 4 },
  bubbleUser: { borderTopRightRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 20, fontFamily: 'Display-Medium' },
  timeText: { fontSize: 8, fontFamily: 'Display-Bold', marginTop: 6, opacity: 0.5, paddingHorizontal: 4 },
  inputBar: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
  inputInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  attachButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  inputWrapper: { flex: 1, borderRadius: 24, borderWidth: 1, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' },
  textInput: { fontSize: 14, fontFamily: 'Display-Medium', paddingVertical: 8 },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }
});
