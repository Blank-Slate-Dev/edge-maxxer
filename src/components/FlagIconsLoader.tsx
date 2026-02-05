// src/components/FlagIconsLoader.tsx
'use client';

// =========================================================================
// DEPRECATED: Flag icons CSS is now imported locally via npm in globals.css:
//   @import "flag-icons/css/flag-icons.min.css";
//
// This component previously injected a CDN link dynamically, which caused
// "Tracking Prevention blocked access to storage" errors in Edge because
// cdn.jsdelivr.net was being blocked by tracking protection.
//
// This file is kept as a no-op so existing imports don't break.
// You can safely remove <FlagIconsLoader /> from dashboard/page.tsx
// and delete this file whenever convenient.
// =========================================================================

export function FlagIconsLoader() {
  return null;
}
