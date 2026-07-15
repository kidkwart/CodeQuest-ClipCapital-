import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';

export function KenteBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Defs>
          <Pattern
            id="kente-grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            {/* The signature diagonal weaves from the PWA */}
            <Path
              d="M0 60L60 0M-15 15L15 -15M45 75L75 45"
              stroke="#10b981"
              strokeWidth="0.5"
              opacity="0.08"
            />
            <Path
              d="M0 0L60 60M-15 45L15 75M45 -15L75 15"
              stroke="#eab308"
              strokeWidth="0.5"
              opacity="0.04"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#kente-grid)" />
      </Svg>
    </View>
  );
}
