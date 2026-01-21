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

// Theme colors matching your viewport config in layout.tsx
const THEME_COLORS = {
  light: '#f0efeb',
  dark: '#1c1c1a',
} as const;

// Helper to update the theme-color meta tag for iOS status bar
function updateThemeColorMeta(theme: Theme) {
  if (typeof window === 'undefined') return;
  
  // Find existing theme-color meta tags and remove them
  const existingMetas = document.querySelectorAll('meta[name="theme-color"]');
  existingMetas.forEach((meta) => meta.remove());
  
  // Create a new theme-color meta tag with the current theme's color
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = THEME_COLORS[theme];
  document.head.appendChild(meta);
}

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
    // Update the theme-color meta tag on initial mount
    updateThemeColorMeta(initialTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('edge-maxxer-theme', newTheme);
    } catch (e) {
      // localStorage not available
    }
    document.documentElement.classList.toggle('light', newTheme === 'light');
    // Update the iOS status bar color immediately
    updateThemeColorMeta(newTheme);
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