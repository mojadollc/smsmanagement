import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMS Dashboard",
  description: "Twilio-powered SMS management dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flash theme script — runs before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&d)){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
