import React, { useMemo } from 'react';
import { View, Text, Dimensions, Platform } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { Card } from './card';

export function AnalyticsChart({ data = [20, 45, 28, 80, 99, 43, 50] }) {
  // Use a fixed width or calculate based on screen but handle SSR/Web stability
  const screenWidth = Platform.OS === 'web' ? 400 : Dimensions.get('window').width;
  const CHART_WIDTH = screenWidth - 80;
  const CHART_HEIGHT = 120;

  const points = useMemo(() => {
    const max = Math.max(...data);
    return data.map((val, i) => ({
      x: (i * (CHART_WIDTH / (data.length - 1))),
      y: CHART_HEIGHT - (val / max) * CHART_HEIGHT,
    }));
  }, [data, CHART_WIDTH]);

  const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaD = `${d} L ${CHART_WIDTH},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`;

  return (
    <Card glass style={{ marginBottom: 40, padding: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <View>
          <Text style={{ color: 'rgba(252,252,252,0.4)', fontFamily: 'Display-Bold', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase' }}>Performance</Text>
          <Text style={{ fontFamily: 'Display-Bold', color: 'white', fontSize: 24, marginTop: 4 }}>Growth Audit</Text>
        </View>
        <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
          <Text style={{ color: '#10b981', fontFamily: 'Display-Bold', fontSize: 10 }}>+12.5%</Text>
        </View>
      </View>

      <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH }}>
        <Svg height={CHART_HEIGHT} width={CHART_WIDTH}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#10b981" stopOpacity="0.3" />
              <Stop offset="1" stopColor="#10b981" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <Path d={areaD} fill="url(#grad)" />
          <Path
            d={d}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <Circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="6"
            fill="#10b981"
          />
        </Svg>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <Text key={day} style={{ color: 'rgba(252,252,252,0.2)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{day}</Text>
        ))}
      </View>
    </Card>
  );
}
