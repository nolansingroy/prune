import type { Metadata } from "next";
import { exo_2, montserrat, roboto, inter, openSans } from "@/lib/fonts";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import ThemeProvider from "@/components/layout/ThemeToggle/theme-provider";
import Script from "next/script";
import ConfirmationDialog from "../components/alerts/confirmation-dialog";

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
        <ConfirmationDialog />
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "ot2mw7b8el");
        `,
          }}
        />
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
