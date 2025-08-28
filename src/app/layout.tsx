
import type { Metadata } from 'next';
import './globals.css';
import { getCurrentUser } from '@/lib/data';
import { ClientProviders } from './client-providers';

export const metadata: Metadata = {
  title: 'Vox Populi',
  description: 'A modern discussion platform.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vox Populi',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();
  
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
          rel="stylesheet"
        ></link>
        <meta name="theme-color" content="#008080" />
      </head>
      <body className="font-body antialiased">
        <ClientProviders isPwaEnabled={currentUser?.isPwaEnabled ?? false}>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
