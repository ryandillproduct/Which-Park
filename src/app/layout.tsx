import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'WhichPark?',
  description: 'Real-time park recommendations for Disney World locals and Annual Passholders.',
  openGraph: {
    title: 'WhichPark? | Best Park to Visit Right Now',
    description: 'Real-time park recommendations for Disney World locals and Annual Passholders.',
    siteName: 'WhichPark?',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhichPark? | Best Park to Visit Right Now',
    description: 'Real-time park recommendations for Disney World locals and Annual Passholders.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t;}catch(e){}})();",
          }}
        />
      </head>
      <body className="font-sans antialiased bg-[var(--bg)] text-[var(--text)]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
