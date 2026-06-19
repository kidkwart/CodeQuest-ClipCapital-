import React from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Card } from './card';
import { Target, TrendingUp, ShieldCheck, Zap, Info, ArrowUpRight } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from "@/context/theme-context";

const { width } = Dimensions.get('window');

export function ClipScoreBreakdown({ score, health, loading }: { score: number, health?: any, loading?: boolean }) {
  const { colors, theme } = useTheme();
  const percentage = Math.min(100, ((score - 600) / 250) * 100);

  const getRank = (s: number) => {
    if (s >= 800) return { name: "PREMIUM", color: colors.gold };
    if (s >= 700) return { name: "ELITE", color: colors.primary };
    return { name: "ESTABLISHED", color: "#3b82f6" };
  };

  const rank = getRank(score);

  if (loading) {
    return (
      <Card glass style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
      </Card>
    );
  }

  // Calculate some derived values from health
  const activityConsistency = health ? (health.entryCount > 5 ? "Excellent" : health.entryCount > 2 ? "Good" : "Needs Work") : "Analyzing...";
  const susuStatus = health ? (health.susuReliability >= 90 ? "Optimal" : "Building") : "Checking...";
  const creditHealth = health ? (health.activeDebt > 0 ? "Active" : "Pristine") : "Calculating...";

  return (
    <Animated.View entering={FadeInUp.duration(400)}>
      <Card glass style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Growth Audit</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Last updated: Just now</Text>
          </View>
          <View style={[styles.rankBadge, { borderColor: `${rank.color}40`, backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.rankText, { color: rank.color }]}>{rank.name} RANK</Text>
          </View>
        </View>

        <View style={styles.scoreSection}>
          <View style={styles.scoreInfo}>
            <Text style={[styles.scoreValue, { color: colors.text }]}>{score}</Text>
            <Text style={[styles.scoreMax, { color: colors.textDim }]}>/ 850</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBase, { backgroundColor: colors.border }]} />
            <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: rank.color, shadowColor: rank.color }]} />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.sectionLabel, { color: colors.textDim }]}>CRITICAL METRICS</Text>

        <View style={{ gap: 16 }}>
          <MetricRow
            icon={TrendingUp}
            label="Activity Consistency"
            desc="Daily revenue logs"
            value={activityConsistency}
            color={colors.primary}
          />
          <MetricRow
            icon={ShieldCheck}
            label="Susu Contribution"
            desc="Timely payments"
            value={susuStatus}
            color={colors.gold}
          />
          <MetricRow
            icon={Target}
            label="Credit Health"
            desc="Loan repayment status"
            value={creditHealth}
            color="#3b82f6"
          />
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>Maintain daily logs to increase your score</Text>
        </View>
      </Card>
    </Animated.View>
  );
}

function MetricRow({ icon: Icon, label, desc, value, color }: any) {
  const { colors } = useTheme();
  return (
    <View style={styles.metricRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[styles.iconBox, { backgroundColor: `${color}10`, borderColor: colors.border }]}>
          <Icon size={18} color={color} />
        </View>
        <View>
          <Text style={[styles.metricLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.metricDesc, { color: colors.textMuted }]}>{desc}</Text>
        </View>
      </View>
      <Text style={[styles.metricValue, { color: color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    marginTop: 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Display-Bold',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
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
    fontSize: 36,
  },
  scoreMax: {
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
    borderRadius: 2,
  },
  progressBar: {
    position: 'absolute',
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  divider: {
    height: 1,
    marginBottom: 24,
  },
  sectionLabel: {
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
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricDesc: {
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
  },
  footerText: {
    fontSize: 12,
    fontWeight: 'bold',
  }
});
