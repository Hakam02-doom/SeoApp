import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "RankYak - Get Google and ChatGPT traffic on autopilot",
  description: "Your all-in-one SEO platform that finds keywords, writes content, and builds backlinks — boosting your visibility in Google and ChatGPT on full autopilot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
