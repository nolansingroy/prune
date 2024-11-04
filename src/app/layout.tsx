import type { Metadata } from "next";
import { Inter, Open_Sans } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Source_Sans_3 } from "next/font/google";
import { Exo_2 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import ThemeProvider from "@/components/layout/ThemeToggle/theme-provider";
import { filterStandardClaims } from "next-firebase-auth-edge/lib/auth/claims";
import { Tokens, getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { User } from "../context/AuthContext";
import { AuthProvider } from "../context/AuthProvider";
import { clientConfig, serverConfig } from "../../config";

const toUser = ({ decodedToken }: Tokens): User => {
  const {
    uid,
    email,
    picture: photoURL,
    email_verified: emailVerified,
    phone_number: phoneNumber,
    name: displayName,
    source_sign_in_provider: signInProvider,
  } = decodedToken;

  const customClaims = filterStandardClaims(decodedToken);

  return {
    uid,
    email: email ?? null,
    displayName: displayName ?? null,
    photoURL: photoURL ?? null,
    phoneNumber: phoneNumber ?? null,
    emailVerified: emailVerified ?? false,
    providerId: signInProvider,
    customClaims,
  };
};

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tokens = await getTokens(cookies(), {
    apiKey: clientConfig.apiKey,
    cookieName: serverConfig.cookieName,
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    serviceAccount: serverConfig.serviceAccount,
  });

  const user = tokens ? toUser(tokens) : null;

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
        <AuthProvider user={user}>{children}</AuthProvider>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
