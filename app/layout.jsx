import './globals.css';

export const metadata = {
  title: 'GIO Business Planner PRO',
  description: 'Projecten, uren, planning, betalingen en cloudsync voor GIO Klus Baas',
  manifest: '/manifest.webmanifest',
  themeColor: '#0b0b0c',
  icons: { icon: '/favicon.png', apple: '/gio-logo-180.png' },
  appleWebApp: { capable: true, title: 'GIO Planner', statusBarStyle: 'black-translucent' }
};

export default function RootLayout({ children }) {
  return <html lang="nl"><body>{children}</body></html>;
}
