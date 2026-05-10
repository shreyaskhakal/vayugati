import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vayu-Gati | Digital Twin",
  description: "Kinetic Infrastructure Interface",
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { SplashScreen } from "@/components/Layout/SplashScreen";
import { ToastManager } from "@/components/Layout/ToastManager";
import { CommandBar } from "@/components/Layout/CommandBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text-main)] transition-colors duration-500">
        <ThemeProvider>
          <SplashScreen />
          <ToastManager />
          <CommandBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
