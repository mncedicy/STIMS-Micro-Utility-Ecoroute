import "./globals.css";

export const metadata = {
  title: "EcoRoute - Carbon Tracking Logistics",
  description: "Real-time fleet emissions audit layer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body>
        {children}
      </body>
    </html>
  );
}
