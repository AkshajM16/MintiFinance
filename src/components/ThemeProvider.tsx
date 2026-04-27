'use client';

import { ThemeProvider as InnerThemeProvider } from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <InnerThemeProvider>{children}</InnerThemeProvider>;
} 