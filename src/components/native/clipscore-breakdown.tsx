import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Card } from './card';
import { Target, TrendingUp, ShieldCheck, Zap, Info, ArrowUpRight } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export function ClipScoreBreakdown({ score }: { score: number }) {
  const percentage = Math.min(100, ((score - 600) / 250) * 100);

  const getRank = (s: number) => {
    if (s >= 800) return { name: "PREMIUM", color: "#f59e0b" };
    if (s >= 700) return { name: "ELITE", color: "#10b981" };
    return { name: "ESTABLISHED", color: "#3b82f6" };
  };

  const rank = getRank(score);

  return (
    <Animated.View entering={FadeInUp.duration(400)}>
      <Card glass style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Growth Audit</Text>
            <Text style={styles.subtitle}>Last updated: Just now</Text>
          </View>
          <View style={[styles.rankBadge, { borderColor: `${rank.color}40` }]}>
            <Text style={[styles.rankText, { color: rank.color }]}>{rank.name} RANK</Text>
          </View>
        </View>

        <View style={styles.scoreSection}>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreMax}>/ 850</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBase]} />
            <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: rank.color }]} />
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>CRITICAL METRICS</Text>

        <View style={{ gap: 16 }}>
          <MetricRow
            icon={TrendingUp}
            label="Activity Consistency"
            desc="Daily revenue logs"
            value="+12 pts"
            color="#10b981"
          />
          <MetricRow
            icon={ShieldCheck}
            label="Susu Contribution"
            desc="Timely payments"
            value="Optimal"
            color="#f59e0b"
          />
          <MetricRow
            icon={Target}
            label="Credit Utilization"
            desc="Loan health ratio"
            value="Excellent"
            color="#3b82f6"
          />
        </View>

        <TouchableOpacity style={styles.footer} activeOpacity={0.7}>
          <Text style={styles.footerText}>Learn how to increase your score</Text>
          <ArrowUpRight size={14} color="#7d8a84" />
        </TouchableOpacity>
      </Card>
    </Animated.View>
  );
}

function MetricRow({ icon: Icon, label, desc, value, color }: any) {
  return (
    <View style={styles.metricRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[styles.iconBox, { backgroundColor: `${color}10` }]}>
          <Icon size={18} color={color} />
        </View>
        <View>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={styles.metricDesc}>{desc}</Text>
        </View>
      </View>
      <Text style={[styles.metricValue, { color: color }]}>{value}</Text>
    </View>
  );
}

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: 24,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Display-Bold',
    color: 'white',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#7d8a84',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 1,
  },
  rankBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  rankText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scoreSection: {
    marginBottom: 32,
  },
  scoreInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreValue: {
    fontFamily: 'Display-Bold',
    color: 'white',
    fontSize: 36,
  },
  scoreMax: {
    color: '#405045',
    fontSize: 16,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 8,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  progressBase: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
  },
  progressBar: {
    position: 'absolute',
    height: 8,
    borderRadius: 4,
    shadowColor: '#10b981',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#405045',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  metricLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricDesc: {
    color: '#7d8a84',
    fontSize: 11,
    marginTop: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  footerText: {
    color: '#7d8a84',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
