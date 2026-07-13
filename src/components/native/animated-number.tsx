import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useDerivedValue,
  runOnJS
} from 'react-native-reanimated';

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  style?: any;
  duration?: number;
  decimals?: number;
}

export function AnimatedNumber({ value, prefix = "", suffix = "", style, duration = 2000, decimals = 0 }: Props) {
  const count = useSharedValue(0);
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    count.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.exp),
    });
  }, [value]);

  useDerivedValue(() => {
    const formattedValue = count.value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    runOnJS(setDisplay)(`${prefix}${formattedValue}${suffix}`);
  });

  return (
    <Text style={style}>{display}</Text>
  );
}
