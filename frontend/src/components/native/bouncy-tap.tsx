import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, Vibration, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface BouncyTapProps extends PressableProps {
  children: React.ReactNode;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  vibrate?: boolean;
}

export function BouncyTap({
  children,
  scaleTo = 0.96,
  style,
  containerStyle,
  vibrate = false,
  onPress,
  ...props
}: BouncyTapProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    // Snappy spring config
    scale.value = withSpring(scaleTo, {
      damping: 10,
      stiffness: 400,
      mass: 0.5
    });

    if (vibrate) {
      // Light haptic feedback on press start for immediate response
      if (Platform.OS === 'ios') {
        // Use a very light tap for iOS
        Vibration.vibrate(1);
      } else {
        Vibration.vibrate(5);
      }
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 400,
      mass: 0.5
    });
  };

  const handlePress = (e: any) => {
    if (onPress) {
      onPress(e);
    }
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
      hitSlop={props.hitSlop || 20}
    >
      <Animated.View style={[containerStyle, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
