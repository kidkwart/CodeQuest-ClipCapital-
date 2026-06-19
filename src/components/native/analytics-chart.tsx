import React, { useMemo } from 'react';
import { View, Text, Dimensions, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { Card } from './card';

interface AnalyticsChartProps {
  data?: number[];
  labels?: string[];
  todayIndex?: number;
  growth?: string;
  isPositive?: boolean;
  loading?: boolean;
}

export function AnalyticsChart({
  data = [0, 0, 0, 0, 0, 0, 0, 0],
  labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  todayIndex = 0,
  growth = "0",
  isPositive = true,
  loading = false
}: AnalyticsChartProps) {
  // Use a fixed width or calculate based on screen but handle SSR/Web stability
  const screenWidth = Platform.OS === 'web' ? 400 : Dimensions.get('window').width;
  const CHART_WIDTH = screenWidth - 80;
  const CHART_HEIGHT = 120;

  // Ensure there's always some "height" to the chart even if all data is 0
  const points = useMemo(() => {
    const max = Math.max(...data, 10); // at least 10 for scale
    const stepX = CHART_WIDTH / (data.length - 1);
    return data.map((val, i) => ({
      x: i * stepX,
      y: CHART_HEIGHT - (val / max) * CHART_HEIGHT,
    }));
  }, [data, CHART_WIDTH]);

  const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaD = `${d} L ${CHART_WIDTH},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`;

  const color = isPositive ? '#10b981' : '#ef4444';

  if (loading) {
    return (
      <Card glass style={{ marginBottom: 40, padding: 24, height: 220, justifyContent: 'center' }}>
        <ActivityIndicator color="#10b981" />
      </Card>
    );
  }

  return (
    <Card glass style={{ marginBottom: 40, padding: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <View>
          <Text style={{ color: 'rgba(252,252,252,0.4)', fontWeight: '900', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase' }}>Weekly Audit</Text>
          <Text style={{ fontFamily: 'Display-Bold', color: '#fff', fontSize: 24, marginTop: 4 }}>Growth Audit</Text>
        </View>
        <View style={{ backgroundColor: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: isPositive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}>
          <Text style={{ color: color, fontWeight: '900', fontSize: 10 }}>{isPositive ? '+' : ''}{growth}%</Text>
        </View>
      </View>

      <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH }}>
        <Svg height={CHART_HEIGHT} width={CHART_WIDTH}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.3" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <Path d={areaD} fill="url(#grad)" />
          <Path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <Circle
            cx={points[todayIndex]?.x || 0}
            cy={points[todayIndex]?.y || 0}
            r="6"
            fill={color}
            stroke="#080c0a"
            strokeWidth={2}
          />
        </Svg>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        {labels.map((day, i) => (
          <Text key={i} style={{ color: i === todayIndex ? '#10b981' : 'rgba(252,252,252,0.2)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>{day}</Text>
        ))}
      </View>
    </Card>
  );
}
