
'use client';

import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { PwaManager } from '@/components/pwa-manager';

interface ClientProvidersProps {
  children: React.ReactNode;
  isPwaEnabled: boolean;
}

export function ClientProviders({ children, isPwaEnabled }: ClientProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
      <PwaManager isPwaEnabled={isPwaEnabled} />
    </ThemeProvider>
  );
}
