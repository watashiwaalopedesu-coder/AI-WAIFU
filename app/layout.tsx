import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AI-WAIFU · Your little corner",
  description:
    "Your personal AI companion. A quiet space for conversation, voice, and seeing things together.",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
