// src/contexts/ThemeContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

// Helper to get initial theme (checks what the inline script already set)
function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    // Check if the inline script already applied the light class
    if (document.documentElement.classList.contains('light')) {
      return 'light';
    }
    // Fallback: check localStorage directly
    try {
      const stored = localStorage.getItem('edge-maxxer-theme') as Theme | null;
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (e) {
      // localStorage not available
    }
  }
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize with the theme that was already set by the inline script
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Sync state with what the inline script set on mount
  useEffect(() => {
    setMounted(true);
    const initialTheme = getInitialTheme();
    setThemeState(initialTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('edge-maxxer-theme', newTheme);
    } catch (e) {
      // localStorage not available
    }
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Return children immediately - the inline script already handled the initial theme
  // This prevents any flash since the correct class is already on <html>
  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}