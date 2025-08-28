
'use client';

import { useEffect } from 'react';

interface PwaManagerProps {
  isPwaEnabled: boolean;
}

export function PwaManager({ isPwaEnabled }: PwaManagerProps) {
  useEffect(() => {
    const manageServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        if (isPwaEnabled) {
          try {
            const { Workbox } = await import('workbox-window');
            const wb = new Workbox('/sw.js');
            wb.register();
            console.log('PWA Service Worker registered.');
          } catch (error) {
            console.error('Service Worker registration failed:', error);
          }
        } else {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
              console.log('PWA Service Worker unregistered.');
            }
          } catch (error) {
            console.error('Service Worker unregistration failed:', error);
          }
        }
      }
    };

    manageServiceWorker();
  }, [isPwaEnabled]);

  return null; // This component does not render anything
}
