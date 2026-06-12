import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export function PremiumHeader({ title, subtitle, showBack }: Props) {
  const router = useRouter();

  return (
    <View className="mb-10">
      <View className="flex-row items-center gap-4">
        {showBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-12 w-12 rounded-2xl bg-white/5 items-center justify-center border border-white/5"
          >
            <ArrowLeft size={20} color="#fcfcfc" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          {subtitle && (
            <Text className="text-primary font-black text-[9px] uppercase tracking-[0.4em] mb-1">
              {subtitle}
            </Text>
          )}
          <Text style={{ fontFamily: 'Display-Bold' }} className="text-white text-4xl tracking-tighter">
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
}
