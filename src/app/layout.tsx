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

export const metadata: Metadata = {
  title: "Schedula | Appointment operations starter",
  description: "A production-minded starter for doctor appointment booking workflows.",
};

import StoreProvider from "@/store/StoreProvider";
import ToastContainer from "@/components/ui/ToastContainer";
import MaintenanceBanner from "@/components/ui/MaintenanceBanner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <MaintenanceBanner />
          {children}
          <ToastContainer />
        </StoreProvider>
      </body>
    </html>
  );
}
