import React from "react";
import { Pressable, Text, ActivityIndicator, View, StyleSheet } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from "@/context/theme-context";

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
        default: "h-14",
        sm: "h-10 px-4",
        lg: "h-16 px-10",
        icon: "h-12 w-12",
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
  const { theme } = useTheme();

  const isDarkText = variant === 'default' || variant === 'secondary';
  const isGold = variant === 'secondary';
  const isEmerald = variant === 'default';
  const isOutline = variant === 'outline';

  const isDisabled = disabled || loading;

  const getTextColor = () => {
    if (isDarkText) return "#0d1310";
    if (isOutline) return "#10b981"; // Always use emerald for outline text
    return "white";
  };

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
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {children ? children : (
            <Text style={{
              fontFamily: 'Display-Bold',
              color: getTextColor(),
              fontSize: 14,
              letterSpacing: 3,
              textTransform: 'uppercase'
            }}>
              {title}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
