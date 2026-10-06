import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Konfigurator opłatków",
  description: "Projektuj i konfiguruj opłatki - dodawaj grafiki, wybieraj wzory i kształty",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cormorant+Garamond:wght@400;700&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Lobster&family=Lora:wght@400;700&family=Merriweather:wght@400;700&family=Parisienne&family=Pinyon+Script&family=Playfair+Display:wght@400;700&family=Sacramento&family=Sail&family=Satisfy&family=Tangerine:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}