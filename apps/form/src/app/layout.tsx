import type { Metadata } from "next";
import { Nunito_Sans, Noto_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const notoSansHeading = Noto_Sans({ subsets: ["latin"], variable: "--font-heading" });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Leave a Review",
  description: "Share your experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", nunitoSans.variable, notoSansHeading.variable)}>
      <body className="bg-background">{children}</body>
    </html>
  );
}
