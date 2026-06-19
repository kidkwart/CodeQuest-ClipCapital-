import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Linking, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useMyMessages, useSendMessageToAdmin } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { SupportHeader } from "@/components/native/effects/support-header";
import { Send, MessageCircle, ShieldCheck, HelpCircle, ChevronRight, ArrowLeft } from "lucide-react-native";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SupportScreen() {
  const router = useRouter();
  const { data: messages, isLoading } = useMyMessages();
  const sendMessage = useSendMessageToAdmin();
  const [text, setText] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const qc = useQueryClient();

  const [category, setCategory] = useState("General");

  useEffect(() => {
    const channel = supabase
      .channel('support-chat-v2')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, () => {
        qc.invalidateQueries({ queryKey: ["admin-messages"] });
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
    } catch (e) {
      alert("Failed to send. Check connection.");
      setText(msg);
    }
  };

  const openWhatsApp = () => {
    Linking.openURL("https://wa.me/233509511256");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: '#0d1310' }}
    >
      <View className="flex-1">
        <Stack.Screen options={{
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-4 h-10 w-10 rounded-xl bg-surface items-center justify-center border border-white/5">
              <ArrowLeft size={20} color="#fcfcfc" />
            </TouchableOpacity>
          )
        }} />

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 100, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
        >
          <PremiumHeader title="Support" subtitle="Premium Assistance" />

          <SupportHeader />

          {/* WhatsApp Action */}
          <TouchableOpacity onPress={openWhatsApp} activeOpacity={0.9} className="mb-10">
            <Card className="bg-[#25D366]/10 border-[#25D366]/20 flex-row items-center p-5">
              <View className="h-12 w-12 rounded-2xl bg-[#25D366] items-center justify-center mr-4 shadow-lg shadow-[#25D366]/30">
                <MessageCircle size={24} color="#0d1310" />
              </View>
              <View className="flex-1">
                <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-base">WhatsApp Support</Text>
                <Text className="text-[#25D366] text-[10px] font-black uppercase tracking-widest">Typical reply: 2 mins</Text>
              </View>
              <ChevronRight size={20} color="#405045" />
            </Card>
          </TouchableOpacity>

          {/* Chat Interface */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-6 ml-1">
              <ShieldCheck size={18} color="#10b981" />
              <Text className="text-white/40 font-black text-[10px] uppercase tracking-[0.4em]">Official System Chat</Text>
            </View>

            {isLoading ? (
              <ActivityIndicator color="#10b981" />
            ) : (messages ?? []).length === 0 ? (
              <Card glass className="items-center py-12 border-dashed opacity-50">
                <Text className="text-[#b2baac] font-bold italic text-xs">No active message history</Text>
              </Card>
            ) : (
              <View>
                {messages!.map((m) => (
                  <Animated.View
                    key={m.id}
                    entering={FadeInDown}
                    className={`max-w-[85%] mb-5 ${m.is_from_admin ? "self-start" : "self-end"}`}
                  >
                    <View className={`p-5 rounded-[28px] ${m.is_from_admin ? "bg-[#1a241f] border border-white/5 rounded-tl-none" : "bg-[#10b981] rounded-tr-none shadow-xl"}`}>
                      <Text className={`text-sm font-medium ${m.is_from_admin ? "text-[#fcfcfc]" : "text-[#0d1310]"}`}>{m.message}</Text>
                    </View>
                    <Text className={`text-[8px] font-black uppercase mt-2 px-1 ${m.is_from_admin ? "text-[#7d8a84] text-left" : "text-[#10b981] text-right"}`}>
                      {m.is_from_admin ? 'AGENT' : 'VERIFIED'} · {format(new Date(m.created_at), "h:mm a")}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Input Bar */}
        <View className="absolute bottom-8 left-6 right-6 h-16 rounded-[28px] bg-[#1a241f] border border-white/10 shadow-2xl flex-row items-center px-2 overflow-hidden">
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type your question..."
            placeholderTextColor="#405045"
            className="flex-1 h-full px-5 text-white font-bold text-sm"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim()}
            className="bg-[#10b981] h-12 w-12 rounded-[22px] items-center justify-center shadow-lg"
          >
            <Send size={20} color="#0d1310" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
