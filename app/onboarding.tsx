import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, FlatList, NativeSyntheticEvent, NativeScrollEvent, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, TrendingUp, Users, Wallet } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/context/theme-context';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Grow Your\nShop Capital',
    subtitle: 'Unlock high-tier credit lines for new clippers, chairs, and shop expansion.',
    icon: Wallet,
    color: '#10b981',
  },
  {
    id: '2',
    title: 'Save With\nYour Circle',
    subtitle: 'Join community Susu groups to rotate payouts and build collective wealth.',
    icon: Users,
    color: '#f59e0b',
  },
  {
    id: '3',
    title: 'Track Every\nSingle Cedi',
    subtitle: 'Monitor your daily earnings and expenses with professional growth audits.',
    icon: TrendingUp,
    color: '#10b981',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const updateCurrentSlideIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlide(currentIndex);
  };

  const handleNext = async () => {
    const nextIndex = currentSlide + 1;
    if (nextIndex < SLIDES.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentSlide(nextIndex);
    } else {
      await AsyncStorage.setItem('has_onboarded', 'true');
      router.replace('/(auth)/login');
    }
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => {
    const Icon = item.icon;
    return (
      <View style={{ width, padding: 40, justifyContent: 'center' }}>
        {/* Branding Logo at Top */}
        <View style={{ position: 'absolute', top: 60, left: 40, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
           <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />
           <Text style={{ fontFamily: 'Display-Bold', color: colors.text, fontSize: 16, letterSpacing: -0.5 }}>ClipCapital</Text>
        </View>

        <Animated.View key={`icon-${item.id}`} entering={FadeIn.delay(200)} style={styles.iconContainer}>
          <View style={[styles.iconBg, { backgroundColor: `${item.color}15`, borderColor: `${item.color}30` }]}>
            <Icon size={48} color={item.color} />
          </View>
          <View style={[styles.glow, { backgroundColor: item.color }]} />
        </Animated.View>

        <Animated.View key={`text-${item.id}`} entering={FadeInDown.delay(400)}>
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{item.subtitle}</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={theme === 'dark' ? ['#111814', '#080c0a'] : ['#ffffff', '#f8fafc']}
        style={StyleSheet.absoluteFill}
      />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        onScroll={Platform.OS === 'web' ? updateCurrentSlideIndex : undefined}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.indicator,
                {
                  width: i === currentSlide ? 24 : 8,
                  backgroundColor: i === currentSlide ? colors.primary : colors.border
                }
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, theme === 'dark' ? '#064e3b' : colors.primary + 'cc']}
            style={styles.nextBtn}
          >
            <Text style={[styles.nextBtnText, { color: '#000' }]}>
              {currentSlide === SLIDES.length - 1 ? 'Start Business' : 'Continue'}
            </Text>
            <ArrowRight size={20} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080c0a'
  },
  iconContainer: {
    marginBottom: 60,
    position: 'relative',
    alignItems: 'flex-start'
  },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 35,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  glow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    left: 20,
    top: 20,
    opacity: 0.2,
  },
  title: {
    fontFamily: 'Display-Bold',
    color: 'white',
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.5,
    marginBottom: 20
  },
  subtitle: {
    color: '#b2baac',
    fontSize: 16,
    lineHeight: 26,
    maxWidth: '85%'
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 8
  },
  indicator: {
    height: 8,
    borderRadius: 4
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
  },
  nextBtnText: {
    fontFamily: 'Display-Bold',
    color: '#0d1310',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.5
  }
});
