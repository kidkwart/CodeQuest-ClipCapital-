import React from "react";
import { Pressable, Text, ActivityIndicator, View, StyleSheet } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LinearGradient } from 'expo-linear-gradient';

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-[26px] px-8 active:scale-[0.96]",
  {
    variants: {
      variant: {
        default: "bg-[#10b981]",
        destructive: "bg-[#ef4444]",
        outline: "border-2 border-[#10b981]/30 bg-transparent",
        secondary: "bg-[#f59e0b]", // Gold
        ghost: "bg-transparent",
        link: "bg-transparent",
      },
      size: {
        default: "h-16",
        sm: "h-11 px-6",
        lg: "h-20 px-12",
        icon: "h-16 w-16",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  onPress?: () => void;
  title?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: any;
  children?: React.ReactNode;
}

export function Button({ className, variant, size, onPress, title, loading, disabled, style, children, ...props }: ButtonProps) {
  const isDarkText = variant === 'default' || variant === 'secondary';
  const isGold = variant === 'secondary';
  const isEmerald = variant === 'default';

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[style, isDisabled && { opacity: 0.5 }]}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {/* Add a subtle gradient overlay for the Premium look */}
      {(isGold || isEmerald) && (
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'transparent']}
          style={StyleSheet.absoluteFill}
          className="rounded-[26px]"
        />
      )}

      {loading ? (
        <ActivityIndicator color={isDarkText ? "#0d1310" : "white"} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {children ? children : (
            <Text style={{ fontFamily: 'Display-Bold', color: isDarkText ? '#0d1310' : 'white', fontSize: 14, letterSpacing: 3, textTransform: 'uppercase' }}>
              {title}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
