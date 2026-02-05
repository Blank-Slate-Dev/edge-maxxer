// src/components/FlagIconsLoader.tsx
'use client';

import { useEffect } from 'react';

// =========================================================================
// PERFORMANCE FIX: Flag icons CSS was previously loaded as a render-blocking
// <link> in layout.tsx, adding ~30KB of CSS to EVERY page load — including
// the landing page where flags are never shown above the fold.
//
// This component dynamically injects the stylesheet only when mounted,
// meaning it only loads on pages that actually use the <Flag> component
// (i.e., the dashboard). The landing page is completely unaffected.
//
// Usage: Add <FlagIconsLoader /> at the top of dashboard/page.tsx
// =========================================================================

const FLAG_ICONS_URL = 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/css/flag-icons.min.css';
const LINK_ID = 'flag-icons-css';

export function FlagIconsLoader() {
  useEffect(() => {
    // Don't add if already loaded
    if (document.getElementById(LINK_ID)) return;

    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href = FLAG_ICONS_URL;
    document.head.appendChild(link);
  }, []);

  return null;
}
