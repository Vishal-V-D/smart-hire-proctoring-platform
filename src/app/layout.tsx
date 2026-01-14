import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { NavbarWrapper } from "@/components/NavbarWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap', // Add font-display swap for better performance
  preload: true,
});

export const metadata: Metadata = {
  title: "Hire | Talent Platform",
  description: "Hire - Connecting talent with opportunities",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} antialiased min-h-screen`}>
        <Providers>
          <NavbarWrapper>
            {children}
          </NavbarWrapper>
        </Providers>
      </body>
    </html>
  );
}
