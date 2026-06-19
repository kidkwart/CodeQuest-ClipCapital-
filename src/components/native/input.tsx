import React from "react";
import { View, Text, TextInput, type TextInputProps, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({ label, error, icon, containerClassName, className, ...props }: InputProps) {
  return (
    <View className={cn("space-y-4", containerClassName)}>
      {label && (
        <Text style={{ fontFamily: 'Display-Bold', color: '#10b981', letterSpacing: 4 }} className="text-[9px] uppercase ml-1 opacity-70">
          {label}
        </Text>
      )}
      <View
        style={styles.inputWrapper}
        className={cn(
          "flex-row items-center rounded-[24px] px-6 h-16 border border-white/5",
          error && "border-red-500/40",
          className
        )}
      >
        {icon && <View className="mr-4 opacity-50">{icon}</View>}
        <TextInput
          placeholderTextColor="#405045"
          selectionColor="#10b981"
          style={{ fontFamily: 'Display-Medium', fontSize: 15, color: '#fcfcfc' }}
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
    backgroundColor: 'rgba(13, 19, 16, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  }
});
