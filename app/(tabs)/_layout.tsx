import { Tabs } from "expo-router";
import { LayoutDashboard, TrendingUp, Wallet, Settings, Users } from "lucide-react-native";
import { BlurView } from 'expo-blur';
import { StyleSheet, View, Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#10B981",
          tabBarInactiveTintColor: "#7d8a84",
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: Platform.OS === 'ios' ? 94 : 70, // Slightly taller for better icon placement
            backgroundColor: '#0f1714',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            elevation: 0,
            paddingTop: 10,
          },
          tabBarItemStyle: {
            height: 60,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={90}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
                <LayoutDashboard size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
                <Wallet size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="susu"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
                <Users size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="loans"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
                <TrendingUp size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
                <Settings size={24} color={color} />
              </View>
            ),
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
    marginTop: 10, // Helps center the icon in the tab bar height
  },
  activeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    width: 46,
    height: 46,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  }
});
