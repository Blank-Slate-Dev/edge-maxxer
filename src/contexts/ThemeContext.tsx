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

// IMPORTANT:
// Do NOT remove meta[name="theme-color"] tags. Next.js manages head tags and may generate
// multiple theme-color tags (including media-query variants). Removing them can break
// App Router navigation commits.
// Instead, maintain ONE dedicated tag and update it.
const THEME_META_ID = 'edge-maxxer-theme-color';

function upsertThemeColorMeta(theme: Theme) {
  if (typeof window === 'undefined') return;

  const color = THEME_COLORS[theme];

  // Prefer updating our dedicated tag
  let meta = document.querySelector(`meta#${THEME_META_ID}`) as HTMLMetaElement | null;

  if (!meta) {
    meta = document.createElement('meta');
    meta.id = THEME_META_ID;
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }

  meta.content = color;
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
    } catch {
      // localStorage not available
    }
  }
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialTheme = getInitialTheme();
    setThemeState(initialTheme);

    // Sync html class (in case something drifted)
    document.documentElement.classList.toggle('light', initialTheme === 'light');

    // Only update our dedicated theme-color meta (do not remove Next's tags)
    upsertThemeColorMeta(initialTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    try {
      localStorage.setItem('edge-maxxer-theme', newTheme);
    } catch {
      // localStorage not available
    }

    document.documentElement.classList.toggle('light', newTheme === 'light');

    // Only update our dedicated theme-color meta (do not remove Next's tags)
    upsertThemeColorMeta(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
