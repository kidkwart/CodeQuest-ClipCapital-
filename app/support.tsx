import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useMyMessages, useSendMessageToAdmin } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { Input } from "@/components/native/input";
import { ArrowLeft, Send, MessageCircle, ShieldCheck, Info } from "lucide-react-native";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function SupportScreen() {
  const router = useRouter();
  const { data: messages, isLoading } = useMyMessages();
  const sendMessage = useSendMessageToAdmin();
  const [text, setText] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('support-chat-native')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, () => {
        qc.invalidateQueries({ queryKey: ["admin-messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await sendMessage.mutateAsync(text);
      setText("");
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {}
  };

  const faqs = [
    { q: "How do I apply for a loan?", a: "Go to the Loans tab, enter amount and term, and click Submit." },
    { q: "What is ClipSusu?", a: "A community savings group where members rotate payouts safely." },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View className="flex-1 bg-background">
        <Stack.Screen options={{
          headerShown: true, title: "Support Center",
          headerStyle: { backgroundColor: "#0A0A0A" }, headerTintColor: "#FFF",
          headerLeft: () => <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="#FFF" /></TouchableOpacity>
        }} />

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-6 pt-6"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Emergency WhatsApp */}
          <Card className="bg-primary/5 border-primary/20 mb-8 p-4">
            <View className="flex-row items-center gap-3 mb-2">
              <Info size={20} color="#10B981" />
              <Text className="text-white font-black text-sm uppercase">Emergency Support</Text>
            </View>
            <Text className="text-muted-foreground text-[11px] mb-4">Urgent payment issue? Contact us instantly via WhatsApp.</Text>
            <Button
              title="Message on WhatsApp"
              className="bg-[#25D366] h-10"
              onPress={() => alert("WhatsApp linking coming soon")}
            />
          </Card>

          {/* FAQs */}
          <View className="mb-8">
            <Text className="text-white font-bold text-lg mb-4">Common Questions</Text>
            {faqs.map((f, i) => (
              <View key={i} className="bg-surface/50 border border-white/5 p-4 rounded-2xl mb-2">
                <Text className="text-white font-bold text-xs mb-1">{f.q}</Text>
                <Text className="text-muted-foreground text-[10px]">{f.a}</Text>
              </View>
            ))}
          </View>

          {/* Chat Messages */}
          <View className="mb-6">
            <Text className="text-white font-bold text-lg mb-4">Message History</Text>
            {isLoading ? (
              <Text className="text-muted-foreground italic">Loading messages...</Text>
            ) : (messages ?? []).length === 0 ? (
              <Text className="text-muted-foreground italic text-center py-10">Start a conversation below</Text>
            ) : (
              messages!.map((m) => (
                <View
                  key={m.id}
                  className={`max-w-[85%] mb-4 p-4 rounded-3xl ${
                    m.is_from_admin
                    ? "bg-surface border border-white/5 self-start rounded-tl-none"
                    : "bg-primary self-end rounded-tr-none"
                  }`}
                >
                  <Text className="text-white text-sm font-medium">{m.message}</Text>
                  <Text className="text-white/40 text-[8px] font-black uppercase mt-2">
                    {m.is_from_admin ? 'Support' : 'You'} · {format(new Date(m.created_at), "h:mm a")}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Message Input */}
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-white/5 flex-row gap-3">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type your question..."
            placeholderTextColor="#404040"
            className="flex-1 bg-surface h-12 rounded-2xl px-4 text-white font-bold border border-white/5"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sendMessage.isPending || !text.trim()}
            className="bg-primary w-12 h-12 rounded-2xl items-center justify-center shadow-lg"
          >
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
