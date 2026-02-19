// src/app/signup/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nocache: true,
    },
  },
};

export default function NoIndexLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
