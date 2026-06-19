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
          sceneStyle: { backgroundColor: '#080c0a' }, // FORCE DARK SCENE
          tabBarStyle: {
            position: 'absolute',
            bottom: 25,
            left: 20,
            right: 20,
            elevation: 0,
            backgroundColor: '#111814',
            borderRadius: 25,
            height: 70,
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            paddingBottom: Platform.OS === 'ios' ? 0 : 0,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(16, 185, 129, 0.1)'
          },
          tabBarBackground: () => (
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          ),
          tabBarActiveTintColor: "#10B981",
          tabBarInactiveTintColor: "#4b5563",
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? "bg-primary/10 p-3 rounded-2xl" : "p-3"}>
                <LayoutDashboard size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="susu"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? "bg-primary/10 p-3 rounded-2xl" : "p-3"}>
                <Wallet size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="loans"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? "bg-primary/10 p-3 rounded-2xl" : "p-3"}>
                <TrendingUp size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? "bg-primary/10 p-3 rounded-2xl" : "p-3"}>
                <Settings size={24} color={color} />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
