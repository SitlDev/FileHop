import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'VectorForge | Professional PDF Editor & Creative Suite',
    template: '%s | VectorForge'
  },
  description: 'The ultimate online PDF editor. Edit text, add images, and reconstruct documents with AI precision. Free, fast, and secure.',
  keywords: ['PDF Editor', 'Online PDF Editor', 'Edit PDF', 'Vector Graphics', 'KnotStranded Tools', 'Document Reconstruction'],
  authors: [{ name: 'KnotStranded' }],
  creator: 'KnotStranded',
  metadataBase: new URL('https://tools.knotstranded.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tools.knotstranded.com',
    title: 'VectorForge | Professional PDF Editor',
    description: 'Edit PDF text and graphics directly in your browser. No installation required.',
    siteName: 'VectorForge',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'VectorForge PDF Editor Dashboard',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VectorForge | PDF Editor',
    description: 'The most powerful online browser-based PDF editor.',
    creator: '@knotstranded',
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense Script Placeholder */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" 
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <meta name="google-site-verification" content="YOUR_VERIFICATION_TOKEN_HERE" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
