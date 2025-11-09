import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobhub.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | JobHub",
    default: "JobHub – Discover Your Next Opportunity",
  },
  description:
    "Browse the latest job openings across industries. Filter by location, category, and keywords to find the perfect role.",
  keywords: [
    "jobs",
    "careers",
    "job board",
    "hiring",
    "remote jobs",
    "full-time jobs",
  ],
  openGraph: {
    title: "JobHub – Discover Your Next Opportunity",
    description:
      "Stay ahead with realtime job listings from Careerjet and apply directly to the original job post.",
    url: siteUrl,
    siteName: "JobHub",
    locale: "en_US",
    type: "website",
  },
  alternates: {
    canonical: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "JobHub – Discover Your Next Opportunity",
    description:
      "Find curated job listings with rich filters and apply on the original employer site.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}
