import { Tabs } from "expo-router";
import { LayoutDashboard, TrendingUp, Wallet, Settings } from "lucide-react-native";
import { BlurView } from 'expo-blur';
import { StyleSheet, View, Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 30,
            left: 20,
            right: 20,
            elevation: 0,
            backgroundColor: 'rgba(26, 36, 31, 0.8)',
            borderRadius: 30,
            height: 80,
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 15 },
            shadowOpacity: 0.4,
            shadowRadius: 25,
            paddingBottom: 0,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          },
          tabBarBackground: () => (
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          ),
          tabBarActiveTintColor: "#10B981",
          tabBarInactiveTintColor: "#7d8a84",
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? "bg-[#10b981]/10 p-4 rounded-[22px] border border-[#10b981]/20" : "p-4"}>
                <LayoutDashboard size={26} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="susu"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? "bg-[#10b981]/10 p-4 rounded-[22px] border border-[#10b981]/20" : "p-4"}>
                <Wallet size={26} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="loans"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? "bg-[#10b981]/10 p-4 rounded-[22px] border border-[#10b981]/20" : "p-4"}>
                <TrendingUp size={26} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? "bg-[#10b981]/10 p-4 rounded-[22px] border border-[#10b981]/20" : "p-4"}>
                <Settings size={26} color={color} />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
