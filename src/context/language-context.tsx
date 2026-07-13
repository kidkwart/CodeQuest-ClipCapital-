import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { translations, LanguageType } from '@/lib/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageContextType {
  language: LanguageType;
  t: typeof translations.en;
  setLanguage: (lang: LanguageType) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageType>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem('user_language');
        const validLanguages: LanguageType[] = ['en', 'twi', 'ga', 'ewe', 'zh', 'fr'];
        if (saved && validLanguages.includes(saved as LanguageType)) {
          setLanguageState(saved as LanguageType);
        }
      } catch (e) {
        console.error("Failed to load language", e);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: LanguageType) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('user_language', lang);
    } catch (e) {
      console.error("Failed to save language", e);
    }
  };

  const t = useMemo(() => translations[language], [language]);

  const value = useMemo(() => ({
    language,
    t,
    setLanguage
  }), [language, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
