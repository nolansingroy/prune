import type { Metadata } from "next";
import { exo_2, montserrat, roboto, inter, openSans } from "@/lib/fonts";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import ThemeProvider from "@/components/layout/ThemeToggle/theme-provider";

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
      className={`${openSans.variable} ${inter.variable} ${roboto.variable} ${montserrat.variable} ${exo_2.variable}`}
      // suppressHydrationWarning={true}
    >
      <body
        className="overflow-hidden font-openSans"
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
