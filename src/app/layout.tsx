import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import BottomNav, { SideNav } from "@/components/BottomNav";
import Toaster from "@/components/Toaster";
import LocaleSync from "@/components/LocaleSync";
import { themeBootScript } from "@/lib/theme";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: "PlantLens AI", description: t("description") };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <LocaleSync active={locale} />
          <div className="app">
            <SideNav />
            <div className="app-main">{children}</div>
            <BottomNav />
          </div>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
