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
      <body className="h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}