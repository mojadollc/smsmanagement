import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMS Management",
  description: "Twilio-powered SMS management dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
