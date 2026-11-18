import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ente | Private by design",
  description: "Private apps for photos, documents, and 2FA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Figtree:wght@900&family=Gochi+Hand&display=swap"
          rel="stylesheet"
        />
        <script src="https://unpkg.com/@rive-app/webgl2@2.34.1/rive.js" defer />
        <script src="/assets/ducky-data.js" defer />
      </head>
      <body>{children}</body>
    </html>
  );
}
