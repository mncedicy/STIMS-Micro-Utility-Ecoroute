// /src/app/layout.js
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: "EcoRoute - Carbon Tracking Logistics",
  description: "Real-time fleet emissions audit layer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-blue-500/30">

        {/* Render children sub-page layers dynamically */}
        {children}

        {/* Vercel live server performance telemetry core block */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}