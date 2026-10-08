import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StarProvider } from "@/lib/star-store";
import { PrefsProvider } from "@/lib/prefs";

export const metadata: Metadata = {
  title: "Kleine Sternenwelt · your little corner of the universe",
  description: "A tiny interactive night world made for one person.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Sternenwelt", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070b1a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        <PrefsProvider>
          <StarProvider>{children}</StarProvider>
        </PrefsProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sw.js').catch(()=>{})})}`,
          }}
        />
      </body>
    </html>
  );
}
