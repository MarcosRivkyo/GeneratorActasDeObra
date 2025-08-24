// app/layout.tsx
export const runtime = "nodejs";

import "./globals.css";
import type { ReactNode } from "react";
import { requireSession } from "@/lib/session";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GeneraActasDeObra",
  description: "Generador de Actas De Visita a Obra",
  icons: {
    icon: [
      { url: "/icono.png" },
      { url: "/icono.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/icono.png",
  },
}


export default async function RootLayout({ children }: { children: ReactNode }) {
  await requireSession();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}







