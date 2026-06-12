import 'react-native-gesture-handler';
import "../global.css";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, ActivityIndicator, StatusBar, Platform, Text } from "react-native";
import { useFonts, SpaceGrotesk_700Bold, SpaceGrotesk_500Medium, SpaceGrotesk_400Regular } from '@expo-google-fonts/space-grotesk';
import { KenteBackground } from "@/components/native/effects/kente-pattern";
import AsyncStorage from '@react-native-async-storage/async-storage';

const queryClient = new QueryClient();

// Polyfill for web environments
if (Platform.OS === 'web') {
  // @ts-ignore
  window.process = window.process || { env: {} };
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Display-Bold': SpaceGrotesk_700Bold,
    'Display-Medium': SpaceGrotesk_500Medium,
    'Display-Regular': SpaceGrotesk_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#080c0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
          <KenteBackground />
          <AuthGuard />
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function AuthGuard() {
  const { user, loading } = useCurrentUser();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    const performNavigation = async () => {
      const hasOnboarded = await AsyncStorage.getItem('has_onboarded');
      const rootSegment = segments[0];

      // 1. Handle Onboarding
      if (!hasOnboarded) {
        if (rootSegment !== "onboarding") {
          router.replace("/onboarding");
        } else {
          setIsReady(true);
        }
        return;
      }

      // 2. Handle Authentication
      if (!user) {
        // If not logged in, force to login unless already in auth
        if (rootSegment !== "(auth)") {
          router.replace("/(auth)/login");
        } else {
          setIsReady(true);
        }
      } else {
        // If logged in...
        if (rootSegment === "(auth)" || rootSegment === "onboarding" || !rootSegment) {
          // ...and trying to go to login/onboarding/root, send to dashboard
          router.replace("/(tabs)");
        } else {
          // ...otherwise, they are allowed to be on any other authed route (market, withdraw, etc.)
          setIsReady(true);
        }
      }
    };

    performNavigation();
  }, [user, loading, segments]);

  if (!isReady || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#080c0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ color: 'gray', marginTop: 10, fontSize: 10, letterSpacing: 2 }}>SECURE GATEWAY...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: 'transparent' },
      animation: 'fade'
    }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="market" />
      <Stack.Screen name="withdraw" />
      <Stack.Screen name="history" />
      <Stack.Screen name="support" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
