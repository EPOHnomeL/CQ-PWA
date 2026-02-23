import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { AuthGuardProvider } from "@/hooks/useAuthGuard";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Christian Quotes",
  description:
    "Discover and save inspiring Christian quotes from theologians, pastors, and leaders throughout history.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Christian Quotes",
  },
  openGraph: {
    title: "Christian Quotes",
    description:
      "Discover and save inspiring Christian quotes from theologians, pastors, and leaders throughout history.",
    type: "website",
    siteName: "Christian Quotes",
  },
  twitter: {
    card: "summary_large_image",
    title: "Christian Quotes",
    description:
      "Discover and save inspiring Christian quotes from theologians, pastors, and leaders throughout history.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <AuthGuardProvider>
            <AppShell>{children}</AppShell>
          </AuthGuardProvider>
        </ConvexClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
