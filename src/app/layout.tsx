import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { NavbarWrapper } from "@/components/NavbarWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
