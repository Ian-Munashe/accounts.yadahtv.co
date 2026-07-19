import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Yadah TV Account Center",
    template: "%s — Yadah TV Account Center",
  },
  description:
    "Access, update, and secure your Yadah TV account. Connect with all PHD Ministries services using your unified profile.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Yadah TV",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#e40816",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark" className="dark">
      <body className="bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
