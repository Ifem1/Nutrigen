import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from '@/providers';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Nutrigen', template: '%s | Nutrigen' },
  description: 'AI-powered livestock feed optimization and growth projection platform.',
  keywords: ['livestock', 'feed optimization', 'animal nutrition', 'AI', 'compliance'],
  authors: [{ name: 'Nutrigen' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Nutrigen',
    title: 'Nutrigen — Feed Optimization & Growth Projection',
    description: 'AI-powered livestock feed optimization with decentralized compliance validation.',
  },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{ duration: 4000 }}
          />
        </Providers>
      </body>
    </html>
  );
}
