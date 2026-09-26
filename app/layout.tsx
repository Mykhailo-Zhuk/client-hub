import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Client Hub — track your project in real-time",
  description:
    "Public dashboard with active projects, per-client portal with magic-link access, and Telegram bot integration for progress updates.",
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