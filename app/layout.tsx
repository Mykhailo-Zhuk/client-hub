import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Inter, JetBrains_Mono, Lora } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/types";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-geist-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const lora = Lora({ subsets: ["latin", "cyrillic"], variable: "--font-lora" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://client-hub-inky-one.vercel.app";
const SITE_TITLE = "Client Hub — track your project in real-time";
const SITE_DESCRIPTION =
  "Public dashboard with active projects, per-client portal with magic-link access, and Telegram bot integration for progress updates.";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Client Hub",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Client Hub",
  keywords: [
    "Client Hub",
    "project tracker",
    "client portal",
    "real-time progress",
    "Telegram notifications",
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Client Hub",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Client Hub — Track your project in real-time",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("ch_locale")?.value;
  const initialLocale: Locale = rawLocale === "uk" ? "uk" : "en";

  return (
    <html lang={initialLocale} suppressHydrationWarning className={`${inter.variable} ${mono.variable} ${lora.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <LanguageProvider initialLocale={initialLocale}>
          <ThemeProvider>
            <div className="flex min-h-screen flex-col">
              <Nav />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}