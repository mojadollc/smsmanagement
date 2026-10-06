import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "SMS Dashboard - Beegoo",
    template: "%s | SMS Dashboard",
  },
  description: "Twilio-powered SMS management dashboard for your business",
  keywords: ["SMS", "Twilio", "Campaign", "Messaging", "Business", "Marketing"],
  authors: [{ name: "Beegoo" }],
  creator: "Beegoo",
  publisher: "Beegoo",
  applicationName: "SMS Dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SMS App",
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },
  openGraph: {
    type: "website",
    siteName: "SMS Dashboard",
    title: "SMS Dashboard - Beegoo",
    description: "Twilio-powered SMS management dashboard for your business",
  },
  twitter: {
    card: "summary_large_image",
    title: "SMS Dashboard - Beegoo",
    description: "Twilio-powered SMS management dashboard for your business",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={jakarta.variable}>
      <head>
        {/* No-flash theme script — runs before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&d)){document.documentElement.classList.add('dark')}})()`,
          }}
        />
        {/* PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('SW registered: ', registration.scope);
                    },
                    function(err) {
                      console.log('SW registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
        {/* iOS Meta Tags for PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
