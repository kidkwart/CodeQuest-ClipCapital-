import React, { createContext, useContext, useEffect, useState } from 'react';
import { theme as ThemeColors, ThemeType } from '@/lib/theme';
import { useProfile } from '@/lib/app-queries';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  theme: ThemeType;
  colors: typeof ThemeColors.dark;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: profile } = useProfile();
  const [themeMode, setThemeMode] = useState<ThemeType>('dark');

  useEffect(() => {
    // Initial load from storage
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem('theme_preference');
      if (saved === 'light' || saved === 'dark') {
        setThemeMode(saved as ThemeType);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (profile?.theme_preference) {
      const pTheme = profile.theme_preference as ThemeType;
      setThemeMode(pTheme);
      AsyncStorage.setItem('theme_preference', pTheme);
    }
  }, [profile]);

  const colors = ThemeColors[themeMode];

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem('theme_preference', next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme: themeMode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
