import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Noto_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const notoSansHeading = Noto_Sans({ subsets: ["latin"], variable: "--font-heading" });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Leave a Review",
  description: "Share your experience",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", nunitoSans.variable, notoSansHeading.variable)}>
      <head>
        {/* Warm the connection to Google's review host — the handoff target for 4-5★. */}
        <link rel="preconnect" href="https://search.google.com" />
      </head>
      <body className="bg-background">
        {children}
      </body>
    </html>
  );
}
