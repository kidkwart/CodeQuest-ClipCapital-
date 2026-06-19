import React, { createContext, useContext, useEffect, useState } from 'react';
import { theme as ThemeColors, ThemeType } from '@/lib/theme';
import { useProfile } from '@/lib/app-queries';

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
    if (profile?.theme_preference) {
      setThemeMode(profile.theme_preference as ThemeType);
    }
  }, [profile]);

  const colors = ThemeColors[themeMode];

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
