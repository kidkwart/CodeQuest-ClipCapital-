import React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/theme-context";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({ label, error, icon, containerClassName, className, ...props }: InputProps) {
  const { colors, theme } = useTheme();

  return (
    <View className={cn("space-y-4", containerClassName)}>
      {label && (
        <Text style={{ fontFamily: 'Display-Bold', color: colors.primary, letterSpacing: 4 }} className="text-[9px] uppercase ml-1 opacity-70">
          {label}
        </Text>
      )}
      <View
        style={[styles.inputWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
        className={cn(
          "flex-row items-center rounded-[24px] px-6 h-16 border",
          error && "border-red-500/40",
          className
        )}
      >
        {icon && <View className="mr-4 opacity-50">{icon}</View>}
        <TextInput
          placeholderTextColor={colors.textDim}
          selectionColor={colors.primary}
          style={{ fontFamily: 'Display-Medium', fontSize: 15, color: colors.text }}
          className="flex-1 h-full"
          {...props}
        />
      </View>
      {error && (
        <Text style={{ fontFamily: 'Display-Bold' }} className="text-red-500 text-[9px] uppercase tracking-widest ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  }
});
