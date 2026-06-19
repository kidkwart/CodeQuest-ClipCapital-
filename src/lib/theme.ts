export const theme = {
  dark: {
    background: '#080c0a',
    surface: '#0f1714',
    surfaceElevated: '#1a241f',
    text: '#fcfcfc',
    textMuted: '#7d8a84',
    textDim: '#405045',
    primary: '#10b981',
    primaryDim: 'rgba(16,185,129,0.1)',
    border: 'rgba(255,255,255,0.05)',
    cardBg: '#0f1714',
    destructive: '#ef4444',
    gold: '#f59e0b',
  },
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceElevated: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    textDim: '#94a3b8',
    primary: '#10b981',
    primaryDim: 'rgba(16,185,129,0.1)',
    border: 'rgba(0,0,0,0.05)',
    cardBg: '#ffffff',
    destructive: '#ef4444',
    gold: '#f59e0b',
  }
};

export type ThemeType = 'dark' | 'light';
