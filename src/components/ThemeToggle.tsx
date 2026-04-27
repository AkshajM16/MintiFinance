'use client';

import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      aria-label="Toggle theme"
      className="fixed top-4 right-4 z-50 p-2 rounded-full bg-card border border-border shadow hover:bg-accent transition-colors"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M17.75 15.5a7.25 7.25 0 01-7.25-7.25c0-1.61.52-3.1 1.41-4.3A.75.75 0 0011.2 2.2a9.25 9.25 0 109.6 9.6.75.75 0 00-1.75-.16c-1.2.89-2.69 1.41-4.3 1.41z"/></svg>
      ) : (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 4.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 4.75zm0 12a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 011.5 0zm7.25-5.25a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75zm-12.5 0a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75zm9.19-5.19a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zm-9.19 9.19a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zm12.38 0a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm-9.19-9.19a.75.75 0 010 1.06L5.19 7.81a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM12 7.25a4.75 4.75 0 100 9.5 4.75 4.75 0 000-9.5z"/></svg>
      )}
    </button>
  );
} 