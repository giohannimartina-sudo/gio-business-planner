import './globals.css';

export const metadata = {
  title: 'GIO Business Planner',
  description: 'GIO Business Planner app',
  manifest: '/manifest.webmanifest',
  themeColor: '#07111f',
  icons: {
    icon: '/favicon.png',
    apple: '/icon-180.png'
  },
  appleWebApp: {
    capable: true,
    title: 'GIO Planner',
    statusBarStyle: 'black-translucent'
  }
};

export default function RootLayout({ children }) {
  return <html lang="nl"><body>{children}</body></html>;
}
