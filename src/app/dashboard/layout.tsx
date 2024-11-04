import type { Metadata } from "next";
import AppSidebar from "@/components/layout/app-sidebar";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { clientConfig, serverConfig } from "../../../config";

export const metadata: Metadata = {
  title: "Rebus Pro - Dashboard",
  description: "Rebus Pro - The best way to manage your events",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tokens = await getTokens(cookies(), {
    apiKey: clientConfig.apiKey,
    cookieName: serverConfig.cookieName,
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    serviceAccount: serverConfig.serviceAccount,
  });

  if (!tokens) {
    redirect("/");
  }
  return (
    <>
      <AppSidebar userToken={tokens?.decodedToken}>{children}</AppSidebar>
    </>
  );
}
