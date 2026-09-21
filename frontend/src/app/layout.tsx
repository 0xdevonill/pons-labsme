import type { Metadata, Viewport } from "next";
import { Geist_Mono, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Launch on Robinhood Chain`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#f3f3f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${outfit.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
