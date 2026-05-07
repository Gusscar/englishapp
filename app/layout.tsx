import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import InstallPrompt from "@/components/InstallPrompt";
import BottomNav from "@/components/BottomNav";
import QuickCapture from "@/components/QuickCapture";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "English Practice",
  description: "Practica pronunciación en inglés con flashcards",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "English Practice",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full bg-slate-900 text-white antialiased`}>
        <ServiceWorkerRegister />
        <InstallPrompt />
        {/* pb-20 leaves room for the bottom nav */}
        <div className="pb-20">
          {children}
        </div>
        <QuickCapture />
        <BottomNav />
      </body>
    </html>
  );
}
