// /src/app/layout.js
import "./globals.css";
import React from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next";

// FIXED META DATA STRUCT: Enhanced with complete canonical and OpenGraph parameters to maximize Google indexing priority
export const metadata = {
  title: 'EcoRoute // Enterprise Carbon Accounting Software Node',
  description: 'Automated multi-modal logistics mileage-to-emissions translation engine built specifically for delivery fleets seeking compliance environmental tax credits.',
  keywords: ['carbon accounting', 'greenhouse gas protocol', 'scope 1 2 3', 'carbon tax calculator', 'logistics telemetry', 'Stims', 'South Africa'],
  metadataBase: new URL('https://ecoroute.stims.co.za'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'EcoRoute Carbon Accounting Core',
    description: 'Track vehicle logs, utility parameters, and financial tax liabilities natively under global validation matrices rules.',
    url: 'https://ecoroute.stims.co.za',
    siteName: 'EcoRoute Stims',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark font-mono text-xs" style={{ colorScheme: "dark" }}>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-slate-950 min-h-screen relative overflow-x-hidden">

        {/* Background Ambient Spotlight Layer */}
        <div className="stims-ambient-glow pointer-events-none" />

        {/* Render children sub-page layers dynamically */}
        {children}

        {/* Vercel live server performance telemetry core blocks */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
