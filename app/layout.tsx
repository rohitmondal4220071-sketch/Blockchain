import type { Metadata, Viewport } from "next";
import { poppins, sourceSerif } from "@/lib/fonts";
import { AuthProvider } from "@/hooks/useProtectedAction";
import { EarthBackground } from "@/components/shared/EarthBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediScan AI — Intelligent Healthcare",
  description:
    "Reinventing the future of intelligent healthcare. Where AI meets precision diagnosis.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a2330",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${sourceSerif.variable}`}>
      <body className="font-sans antialiased">
        {/* Global Earth/space background — always present on first paint */}
        <EarthBackground />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
