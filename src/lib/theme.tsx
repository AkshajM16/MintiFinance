'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Radix Colors (light/dark)
const lightTheme = {
  background: '#f8fafc',
  foreground: '#18181b',
  card: '#fff',
  border: '#e4e4e7',
  accent: '#6366f1',
  accentForeground: '#fff',
};

const darkTheme = {
  background: '#18181b',
  foreground: '#f8fafc',
  card: '#232326',
  border: '#27272a',
  accent: '#6366f1',
  accentForeground: '#fff',
};

const ThemeContext = createContext({
  theme: 'light',
  setTheme: (theme: 'light' | 'dark') => {},
  themeVars: lightTheme,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with 'light' to match SSR
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // On mount, check localStorage and update theme
  useEffect(() => {
    const stored = window.localStorage.getItem('theme');
    if (stored === 'dark') setTheme('dark');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const themeVars = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeVars }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 