import { Tabs } from "expo-router";
import { LayoutDashboard, TrendingUp, Wallet, Settings, Users } from "lucide-react-native";
import { BlurView } from 'expo-blur';
import { StyleSheet, View, Platform, Animated, Vibration } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "@/context/language-context";

function TabIcon({ Icon, color, focused }: { Icon: any, color: string, focused: boolean }) {
  const scaleValue = useRef(new Animated.Value(focused ? 1.1 : 1)).current;

  useEffect(() => {
    if (focused) {
      Vibration.vibrate(Platform.OS === 'ios' ? 1 : 5);
    }
    Animated.spring(scaleValue, {
      toValue: focused ? 1.1 : 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={[
      styles.iconContainer,
      { transform: [{ scale: scaleValue }] }
    ]}>
      <Icon size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
    </Animated.View>
  );
}

export default function TabsLayout() {
  const { colors, theme } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textDim,
          tabBarLabelStyle: {
            fontFamily: 'Display-Bold',
            fontSize: 10,
            marginTop: -4,
            marginBottom: Platform.OS === 'ios' ? 0 : 8,
          },
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: Platform.OS === 'ios' ? 94 : 72,
            backgroundColor: theme === 'dark' ? 'rgba(15, 23, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderTopWidth: 1,
            borderTopColor: colors.border,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: theme === 'dark' ? 0.4 : 0.1,
            shadowRadius: 15,
            paddingTop: 8,
          },
          tabBarBackground: () => (
            Platform.OS === 'ios' ? (
              <BlurView
                intensity={80}
                tint={theme}
                style={{ ...StyleSheet.absoluteFillObject, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}
              />
            ) : null
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t.dashboard.toUpperCase(),
            tabBarIcon: (props) => <TabIcon Icon={LayoutDashboard} {...props} />,
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: t.wallet.toUpperCase(),
            tabBarIcon: (props) => <TabIcon Icon={Wallet} {...props} />,
          }}
        />
        <Tabs.Screen
          name="susu"
          options={{
            title: t.groups.toUpperCase(),
            tabBarIcon: (props) => <TabIcon Icon={Users} {...props} />,
          }}
        />
        <Tabs.Screen
          name="loans"
          options={{
            title: t.loans.toUpperCase(),
            tabBarIcon: (props) => <TabIcon Icon={TrendingUp} {...props} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t.settings.toUpperCase(),
            tabBarIcon: (props) => <TabIcon Icon={Settings} {...props} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  }
});
