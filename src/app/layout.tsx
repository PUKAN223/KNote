import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KNote",
  description: "Premium note-taking experience for iPad",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KNote",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "overlays-content",
  themeColor: "#FAF8F3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.className} h-full antialiased bg-knote-bg text-knote-text`}
    >
      <head>
        {/* Runs synchronously before first paint — prevents theme flash on reload */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('knote:library-theme');
                if (!t) {
                  t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.dataset.theme = t;
                document.documentElement.style.colorScheme = t;
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col overflow-hidden touch-none overscroll-none">
        {children}
      </body>
    </html>
  );
}
