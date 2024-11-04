import type { Metadata } from "next";
import { Inter, Open_Sans } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Source_Sans_3 } from "next/font/google";
import { Exo_2 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import ThemeProvider from "@/components/layout/ThemeToggle/theme-provider";

const exo_2 = Exo_2({
  subsets: ["latin"],
  weight: "700",
  style: "normal",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  style: "normal",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Rebus Pro",
  description: "Rebus Pro - The best way to manage your events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${openSans.className}`}
      // suppressHydrationWarning={true}
    >
      <body
        className="overflow-hidden"
        // suppressHydrationWarning={true}
      >
        <NextTopLoader showSpinner={false} color="#1fce88" />
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        > */}
        <Toaster />
        {children}
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
