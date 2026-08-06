import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/components/ThemeProvider";
import SmoothScrolling from "@/components/ui/SmoothScrolling";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Productivity Hub",
  description: "An interactive productivity hub with micro-apps designed for focus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-white text-black dark:bg-black dark:text-white selection:bg-purple-500/30 transition-colors duration-300">
        <ThemeProvider defaultTheme="system">
          <SmoothScrolling>{children}</SmoothScrolling>
          <ToastContainer 
            position="bottom-right" 
            theme="colored"
            toastClassName="!rounded-none !border-2 !border-black !font-black !uppercase !tracking-widest"
          />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
