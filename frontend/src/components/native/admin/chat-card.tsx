import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Card } from '../card';
import { Check, User, MessageCircle } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface Props {
  user: any;
  messages: any[];
  onReply: (text: string) => Promise<void>;
}

export function AdminChatCard({ user, messages, onReply }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await onReply(text);
    setText("");
    setLoading(false);
  };

  return (
    <Card className="mb-6 p-0 overflow-hidden border-white/5 bg-[#1a241f]/40">
      <View className="p-5 border-b border-white/5 flex-row items-center justify-between bg-white/5">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 rounded-2xl bg-primary/10 items-center justify-center border border-primary/20">
            <User size={20} color="#10B981" />
          </View>
          <View>
            <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-sm">{user?.display_name || 'Member'}</Text>
            <Text className="text-muted-foreground text-[8px] font-black uppercase tracking-widest">{user?.phone_number || 'No Phone'}</Text>
          </View>
        </View>
        <MessageCircle size={18} color="#405045" />
      </View>

      <View className="p-6 space-y-4 max-h-60 overflow-hidden">
        {messages.slice(0, 3).reverse().map((m) => (
          <View key={m.id} className={cn(
            "p-4 rounded-2xl max-w-[85%]",
            m.is_from_admin ? "bg-primary/10 self-end border border-primary/20" : "bg-surface self-start"
          )}>
            <Text className={cn("text-xs leading-relaxed", m.is_from_admin ? "text-primary font-bold" : "text-[#fcfcfc]")}>
              {m.message}
            </Text>
          </View>
        ))}
      </View>

      <View className="p-4 bg-[#0d1310] flex-row gap-3">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type your reply..."
          placeholderTextColor="#405045"
          className="flex-1 bg-surface h-12 rounded-2xl px-5 text-white text-xs font-bold"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={loading || !text.trim()}
          className="bg-primary h-12 w-12 rounded-2xl items-center justify-center shadow-lg"
        >
          <Check size={20} color="#0d1310" />
        </TouchableOpacity>
      </View>
    </Card>
  );
}
