import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers/Providers';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { PWAInstallPrompt, OfflineStatusIndicator } from '@/components/ui/PWAInstallPrompt';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ERPNext - Business Management Software',
  description: 'Complete business management solution with accounting, inventory, CRM, and more.',
  keywords: 'ERP, business management, accounting, inventory, CRM, manufacturing',
  authors: [{ name: 'ERPNext Team' }],
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ERPNext',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50">
        <Providers>
          <LayoutProvider>
            <OfflineStatusIndicator />
            {children}
            <PWAInstallPrompt />
          </LayoutProvider>
        </Providers>
      </body>
    </html>
  );
}
