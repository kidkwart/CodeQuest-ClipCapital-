import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, SafeAreaView } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Lucide from "lucide-react-native";
import { useTheme } from "@/context/theme-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInRight, FadeOutLeft } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Build Your Digital Reputation",
    description: "Every sale you log increases your ClipScore. A higher score unlocks better loan rates and higher limits.",
    icon: <Lucide.TrendingUp size={80} color="#10b981" />,
    color: "#10b981"
  },
  {
    id: "2",
    title: "Equipment on Credit",
    description: "Access the marketplace to buy tools and inventory. Pay later with flexible installments tailored to your business.",
    icon: <Lucide.ShoppingBag size={80} color="#3b82f6" />,
    color: "#3b82f6"
  },
  {
    id: "3",
    title: "Secure Your Future",
    description: "Use The Vault to set savings goals for expansion. Smart saving habits show lenders you are ready for more.",
    icon: <Lucide.ShieldCheck size={80} color="#f59e0b" />,
    color: "#f59e0b"
  },
  {
    id: "4",
    title: "Professional Invoicing",
    description: "Send professional receipts to your customers. Each invoice automatically tracks your income and boosts your score.",
    icon: <Lucide.FileText size={80} color="#8b5cf6" />,
    color: "#8b5cf6"
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await AsyncStorage.setItem('has_onboarded', 'true');
      router.replace("/(auth)/login");
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('has_onboarded', 'true');
    router.replace("/(auth)/login");
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topSection}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textDim }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Animated.View entering={FadeIn.delay(200)} style={styles.iconContainer}>
                 <View style={[styles.iconCircle, { backgroundColor: item.color + '10', borderColor: item.color + '30' }]}>
                    {item.icon}
                 </View>
              </Animated.View>

              <Animated.View entering={FadeInRight.delay(300)} style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.description, { color: colors.textMuted }]}>{item.description}</Text>
              </Animated.View>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />

        <View style={styles.footer}>
          <View style={styles.indicatorContainer}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  { backgroundColor: index === currentIndex ? colors.primary : colors.border },
                  index === currentIndex && { width: 30 }
                ]}
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleNext} style={styles.nextBtnContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primary + 'cc']}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>
                {currentIndex === slides.length - 1 ? "GET STARTED" : "NEXT"}
              </Text>
              <Lucide.ArrowRight size={20} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width: width,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed'
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Display-Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  indicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextBtnContainer: {
    width: '100%',
  },
  nextBtn: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  nextBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
});
