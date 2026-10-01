import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://payments.musictutorship.in'),
  title: 'Music Tutorship | Official Course Payment Portal',
  description: 'Secure course fee payments, enrollment and registration for Music Tutorship programs by Vijay.',
  icons: {
    icon: '/images/logo.png',
  },
  openGraph: {
    title: 'Music Tutorship | Official Course Payment Portal',
    description: 'Learn music production from mentor Vijay. Secure online payment & instant batch enrollment.',
    url: 'https://payments.musictutorship.in',
    siteName: 'Music Tutorship Payments',
    images: [
      {
        url: '/images/logo.png',
        width: 120,
        height: 120,
        alt: 'Music Tutorship Logo',
      }
    ],
    locale: 'en_IN',
    type: 'website',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={`${poppins.className} antialiased`}>
        <Header />
        <main style={{ minHeight: 'calc(100vh - 180px)' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
