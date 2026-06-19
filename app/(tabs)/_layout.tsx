import { Tabs } from "expo-router";
import { LayoutDashboard, TrendingUp, Wallet, Settings, Users } from "lucide-react-native";
import { BlurView } from 'expo-blur';
import { StyleSheet, View, Platform, Animated, Vibration } from 'react-native';
import React, { useRef, useEffect } from 'react';

function TabIcon({ Icon, color, focused }: { Icon: any, color: string, focused: boolean }) {
  const scaleValue = useRef(new Animated.Value(focused ? 1.2 : 1)).current;

  useEffect(() => {
    if (focused) {
      Vibration.vibrate(Platform.OS === 'ios' ? 0 : 5);
    }
    Animated.spring(scaleValue, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={[
      styles.iconContainer,
      { transform: [{ scale: scaleValue }] }
    ]}>
      <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
      {focused && <View style={styles.activeDot} />}
    </Animated.View>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#10B981",
          tabBarInactiveTintColor: "#405045",
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: Platform.OS === 'ios' ? 94 : 72,
            backgroundColor: 'rgba(15, 23, 20, 0.95)',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.08)',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingTop: 8,
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.4,
            shadowRadius: 15,
          },
          tabBarBackground: () => (
            Platform.OS === 'ios' ? (
              <BlurView
                intensity={80}
                tint="dark"
                style={{ ...StyleSheet.absoluteFillObject, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}
              />
            ) : null
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: (props) => <TabIcon Icon={LayoutDashboard} {...props} />,
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            tabBarIcon: (props) => <TabIcon Icon={Wallet} {...props} />,
          }}
        />
        <Tabs.Screen
          name="susu"
          options={{
            tabBarIcon: (props) => <TabIcon Icon={Users} {...props} />,
          }}
        />
        <Tabs.Screen
          name="loans"
          options={{
            tabBarIcon: (props) => <TabIcon Icon={TrendingUp} {...props} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
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
    width: 44,
    height: 44,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5
  }
});
