import React from "react";
import { Pressable, Text, ActivityIndicator, View } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-[24px] px-4 py-3 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#10b981] shadow-xl shadow-[#10b981]/30",
        destructive: "bg-[#ef4444] shadow-xl shadow-[#ef4444]/30",
        outline: "border-2 border-[#10b981]/40 bg-transparent",
        secondary: "bg-[#eab308] shadow-xl shadow-[#eab308]/30",
        ghost: "bg-transparent",
        link: "bg-transparent",
      },
      size: {
        default: "h-14",
        sm: "h-11 px-5",
        lg: "h-18 px-10",
        icon: "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const textVariants = cva("text-[13px] font-black uppercase tracking-[0.2em]", {
  variants: {
    variant: {
      default: "text-[#0d1310]", // Dark text on bright green
      destructive: "text-white",
      outline: "text-[#10b981]",
      secondary: "text-[#0d1310]", // Dark text on bright gold
      ghost: "text-[#7d8a84]",
      link: "text-[#10b981] underline",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface ButtonProps
  extends VariantProps<typeof buttonVariants> {
  onPress?: () => void;
  title?: string;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Button({
  className,
  variant,
  size,
  onPress,
  title,
  loading,
  children,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#0d1310" />
      ) : (
        <View className="flex-row items-center justify-center">
          {children ? (
            children
          ) : (
            <Text className={cn(textVariants({ variant }))}>{title}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
