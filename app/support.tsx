import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Linking, ActivityIndicator, StyleSheet, Vibration, Keyboard } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useMyMessages, useSendMessageToAdmin } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { SupportHeader } from "@/components/native/effects/support-header";
import { Send, MessageCircle, ShieldCheck, ChevronRight, ArrowLeft, Zap, Smartphone, ExternalLink, HelpCircle } from "lucide-react-native";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/theme-context";

export default function SupportScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { data: messages, isLoading } = useMyMessages();
  const sendMessage = useSendMessageToAdmin();
  const [text, setText] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const qc = useQueryClient();

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
    Keyboard.dismiss();
    try {
      await sendMessage.mutateAsync(msg);
      Vibration.vibrate(Platform.OS === 'ios' ? 0 : 5);
    } catch (e) {
      alert("Failed to send. Check connection.");
      setText(msg);
    }
  };

  const openWhatsApp = () => {
    Linking.openURL("https://wa.me/233509511256");
  };

  const initiateCall = () => {
    Linking.openURL("tel:0599242307");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerLeft: () => (
            <BouncyTap onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <ArrowLeft size={20} color={colors.text} />
            </BouncyTap>
          )
        }} />

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={{ paddingHorizontal: 24 }}>
            <PremiumHeader title="Support" subtitle="Elite Assistance" />

            <SupportHeader />

            {/* Premium Institutional Channels */}
            <View style={styles.channelRow}>
               <BouncyTap onPress={openWhatsApp} style={{ flex: 1 }}>
                  <LinearGradient
                    colors={theme === 'dark' ? ['#1a241f', '#0d1310'] : ['#ffffff', '#f1f5f9']}
                    style={[styles.channelCard, { borderColor: colors.border }]}
                  >
                     <View style={[styles.channelIconBox, { backgroundColor: '#25D366' }]}>
                        <MessageCircle size={20} color="#000" strokeWidth={2.5} />
                     </View>
                     <Text style={[styles.channelTitle, { color: colors.text }]}>WhatsApp</Text>
                     <Text style={[styles.channelStatus, { color: colors.primary }]}>ONLINE</Text>
                  </LinearGradient>
               </BouncyTap>

               <BouncyTap onPress={initiateCall} style={{ flex: 1 }}>
                  <LinearGradient
                    colors={theme === 'dark' ? ['#1a241f', '#0d1310'] : ['#ffffff', '#f1f5f9']}
                    style={[styles.channelCard, { borderColor: colors.border }]}
                  >
                     <View style={[styles.channelIconBox, { backgroundColor: colors.primary }]}>
                        <Smartphone size={20} color="#000" strokeWidth={2.5} />
                     </View>
                     <Text style={[styles.channelTitle, { color: colors.text }]}>Direct Call</Text>
                     <Text style={[styles.channelStatus, { color: colors.primary }]}>24/7</Text>
                  </LinearGradient>
               </BouncyTap>
            </View>

            {/* Chat Interface */}
            <View style={styles.chatSection}>
              <View style={styles.chatDivider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <View style={[styles.dividerBadge, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '15' }]}>
                   <ShieldCheck size={12} color={colors.primary} />
                   <Text style={[styles.dividerText, { color: colors.primary }]}>SECURE PROTOCOL</Text>
                </View>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {isLoading ? (
                <View style={{ paddingVertical: 60 }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (messages ?? []).length === 0 ? (
                <Animated.View entering={FadeInUp} style={styles.emptyChat}>
                  <HelpCircle size={40} color={colors.textDim} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>Inquire with the Command Center for institutional support.</Text>
                </Animated.View>
              ) : (
                <View style={{ paddingBottom: 120 }}>
                  {messages!.map((m, idx) => (
                    <Animated.View
                      key={m.id}
                      entering={FadeInDown.delay(idx * 50)}
                      layout={Layout.springify()}
                      style={[styles.msgWrapper, m.is_from_admin ? styles.msgAdmin : styles.msgUser]}
                    >
                      <View style={[styles.msgBubble, m.is_from_admin ? [styles.bubbleAdmin, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }] : [styles.bubbleUser, { backgroundColor: colors.primary }]]}>
                        <Text style={[styles.msgText, m.is_from_admin ? { color: colors.text } : { color: '#0d1310', fontWeight: 'bold' }]}>{m.message}</Text>
                      </View>
                      <View style={styles.msgMeta}>
                         <Text style={[styles.msgTime, { color: colors.textDim }, m.is_from_admin ? { textAlign: 'left' } : { textAlign: 'right' }]}>
                           {m.is_from_admin ? 'INSTITUTIONAL AGENT' : 'VERIFIED MERCHANT'} · {format(new Date(m.created_at), "h:mm a")}
                         </Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Premium Input Bar */}
        <View style={[styles.inputBarContainer, { borderColor: colors.border }]}>
           <BlurView intensity={Platform.OS === 'ios' ? 90 : 100} tint={theme} style={StyleSheet.absoluteFill} />
           <View style={styles.inputBarInner}>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Initiate private inquiry..."
                  placeholderTextColor={colors.textDim}
                  style={[styles.input, { color: colors.text }]}
                  selectionColor={colors.primary}
                  multiline
                />
              </View>
              <BouncyTap
                onPress={handleSend}
                disabled={!text.trim()}
                style={[styles.sendBtn, !text.trim() && { opacity: 0.3 }]}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primary + 'cc']}
                  style={styles.sendBtnGradient}
                >
                   <Send size={20} color="#080c0a" strokeWidth={2.5} />
                </LinearGradient>
              </BouncyTap>
           </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtn: { marginLeft: 16, height: 48, width: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  scrollContent: { paddingTop: 100, paddingBottom: 150 },
  channelRow: { flexDirection: 'row', gap: 12, marginBottom: 48 },
  channelCard: { padding: 20, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  channelIconBox: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  channelTitle: { fontWeight: 'bold', fontSize: 13 },
  channelStatus: { fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  chatSection: { marginTop: 10 },
  chatDivider: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 40 },
  dividerLine: { flex: 1, height: 1 },
  dividerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  dividerText: { fontWeight: '900', fontSize: 8, letterSpacing: 2 },
  emptyChat: { paddingVertical: 60, alignItems: 'center', opacity: 0.3 },
  emptyText: { fontSize: 12, fontWeight: 'bold', fontStyle: 'italic', textAlign: 'center', marginTop: 16, paddingHorizontal: 40, lineHeight: 20 },
  msgWrapper: { maxWidth: '85%', marginBottom: 32 },
  msgAdmin: { alignSelf: 'flex-start' },
  msgUser: { alignSelf: 'flex-end' },
  msgBubble: { padding: 20, borderRadius: 28 },
  bubbleAdmin: { borderTopLeftRadius: 4, borderWidth: 1 },
  bubbleUser: { borderTopRightRadius: 4, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  msgText: { fontSize: 14, lineHeight: 22 },
  msgMeta: { marginTop: 8, paddingHorizontal: 4 },
  msgTime: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  inputBarContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 20, left: 24, right: 24, minHeight: 72, borderRadius: 32, overflow: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
  inputBarInner: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 10, paddingVertical: 10 },
  inputWrapper: { flex: 1, minHeight: 52, justifyContent: 'center' },
  input: { fontWeight: 'bold', fontSize: 14, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 14 : 10, paddingBottom: 10 },
  sendBtn: { height: 52, width: 52, borderRadius: 20, overflow: 'hidden' },
  sendBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
