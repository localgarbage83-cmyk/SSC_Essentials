import './globals.css';
import Link from 'next/link';
import Reg from './Reg';
const site = process.env.SITE_URL || 'http://localhost:3000';
export const metadata = {
  metadataBase: new URL(site), title: { default: 'SSC STUDY HUB — Study Smart. Practice More.', template: '%s · SSC STUDY HUB' },
  description: 'Chapter-wise PDF notes, MCQ, CQ and model questions for Bangladesh SSC students.', manifest: '/manifest.webmanifest',
  openGraph: { title: 'SSC STUDY HUB', description: 'Chapter-wise PDF study materials for SSC.', type: 'website' }
};
export const viewport = { themeColor: '#000000', width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function Root({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&family=Tiro+Bangla&display=swap" rel="stylesheet" />
        <link rel="icon" href="/icons/icon-192.png" /><link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <div className="wrap">
          <header className="top"><Link href="/"><b>SSC STUDY HUB</b></Link><span className="mono tag-line">STUDY SMART. PRACTICE MORE.</span></header>
          {children}
        </div>
        <Reg />
      </body>
    </html>
  );
}
