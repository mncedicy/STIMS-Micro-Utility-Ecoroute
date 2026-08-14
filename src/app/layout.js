// /src/app/layout.js
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: "EcoRoute - Carbon Tracking Logistics",
  description: "Real-time fleet emissions audit layer, powered by Stims",
  // FIXED EXTENSION: Injected search console parameters directly in place to boost search appearance
  keywords: ["carbon accounting", "greenhouse gas protocol", "scope 1 2 3", "carbon tax calculator", "logistics telemetry", "Stims", "EcoRoute", "carbon footprint", "fleet emissions audit", "sustainability reporting", "environmental compliance", "supply chain emissions", "carbon tracking software", "eco-friendly logistics", "carbon footprint calculator", "carbon emissions tracking", "sustainability analytics", "carbon management platform", "green logistics solutions", "carbon reduction strategies", "environmental impact assessment", "carbon offsetting tools", "eco-conscious transportation", "carbon neutrality planning", "sustainable supply chain management", "carbon reporting software", "green fleet management", "carbon emissions monitoring", "carbon footprint analysis", "sustainable logistics solutions", "carbon accounting software", "greenhouse gas emissions tracking", "carbon footprint reduction strategies", "eco-friendly fleet management", "carbon emissions reporting tools", "sustainability performance metrics", "carbon footprint assessment tools", "green supply chain analytics", "carbon emissions optimization software", "sustainable transportation solutions", "carbon footprint management platform", "eco-conscious logistics planning", "carbon emissions reduction strategies", "green logistics analytics platform", "carbon footprint tracking software", "sustainable fleet management solutions", "carbon emissions data analysis tools", "eco-friendly supply chain management", "carbon footprint reporting software", "green logistics performance metrics", "carbon emissions monitoring platform", "sustainable transportation analytics", "carbon footprint optimization strategies", "eco-conscious fleet management solutions", "carbon emissions reduction planning tools", "green supply chain performance metrics", "carbon footprint assessment software", "sustainable logistics performance analytics", "carbon emissions tracking and reporting tools", "eco-friendly transportation planning solutions", "carbon footprint management software", "green logistics optimization strategies", "carbon emissions data visualization tools", "sustainable fleet performance metrics", "carbon footprint reduction planning software", "eco-conscious supply chain analytics platform", "carbon emissions monitoring and reporting solutions", "green logistics data analysis tools", "carbon footprint optimization software platform", "sustainable transportation performance metrics", "carbon emissions reduction analytics platform", "eco-friendly fleet performance optimization tools", "carbon footprint assessment and reporting software", "green supply chain optimization strategies", "carbon emissions tracking and analysis platform", "sustainable logistics data visualization tools", "South Africa carbon tax compliance", "carbon tax calculator South Africa", "carbon tax reporting South Africa", "carbon tax compliance software", "carbon tax management platform", "carbon tax reduction strategies", "carbon tax optimization tools", "carbon tax data analysis software", "carbon tax reporting and compliance solutions", "carbon tax planning and management software", "African carbon tax compliance solutions", "carbon tax reporting and optimization platform", "carbon tax reduction planning software", "carbon tax data visualization tools", "carbon tax compliance analytics platform", "carbon tax management and reporting software", "carbon tax optimization and reduction strategies", "carbon tax data analysis and visualization tools", "carbon tax compliance and reporting solutions", "carbon tax planning and optimization software", "African carbon tax reporting and compliance platform", "API carbon tax compliance solutions", "carbon tax reporting and optimization software", "carbon tax reduction and management platform", "carbon tax data analysis and visualization software", "carbon tax compliance and reporting analytics platform", "carbon tax planning and optimization tools", "African carbon tax management and reporting solutions"],
  metadataBase: new URL("https://ecoroute.stims.co.za"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "EcoRoute - Carbon Tracking Logistics",
    description: "Real-time fleet emissions audit layer, powered by Stims. Track, analyze, and optimize your logistics carbon footprint with our advanced telemetry and compliance tools. API-driven insights for sustainable fleet management and carbon tax compliance.",
    url: "https://ecoroute.stims.co.za",
    siteName: "EcoRoute Stims",
    type: "website",
  },
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
