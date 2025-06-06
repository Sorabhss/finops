import * as React from 'react';
import type { Viewport } from 'next';

import '@/styles/global.css';

import { AwsAccountProvider } from '@/contexts/AwsAccountContext';
import { UserProvider } from '@/contexts/user-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { SideNav } from '@/components/dashboard/layout/side-nav';
import { MobileNav } from '@/components/dashboard/layout/mobile-nav';


export const viewport = { width: 'device-width', initialScale: 1 } satisfies Viewport;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <LocalizationProvider>
          <UserProvider>
          <AwsAccountProvider> 
            <ThemeProvider>{children}</ThemeProvider>
            </AwsAccountProvider>
          </UserProvider>
        </LocalizationProvider>
        
      </body>
    </html>
  );
}
