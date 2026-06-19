import React from "react";
import { View, Text, TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  icon,
  containerClassName,
  className,
  ...props
}: InputProps) {
  return (
    <View className={cn("space-y-2", containerClassName)}>
      {label && (
        <Text className="text-xs font-bold text-muted-foreground uppercase ml-1">
          {label}
        </Text>
      )}
      <View
        className={cn(
          "flex-row items-center bg-surface rounded-2xl px-4 h-14 border border-border/50",
          error && "border-destructive",
          className
        )}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          placeholderTextColor="#737373"
          className="flex-1 text-foreground font-medium"
          {...props}
        />
      </View>
      {error && (
        <Text className="text-destructive text-[10px] font-bold ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}
