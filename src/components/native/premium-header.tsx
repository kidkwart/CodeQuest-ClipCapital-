import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/theme-context";

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export function PremiumHeader({ title, subtitle, showBack }: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {showBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.cardBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          {subtitle && (
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 }}>
              {subtitle}
            </Text>
          )}
          <Text style={{ fontFamily: 'Display-Bold', color: colors.text, fontSize: 40, letterSpacing: -1.5 }}>
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
}
