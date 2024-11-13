import React from "react";
import PageContainer from "@/components/layout/page-container";
import FullCalendarComponent from "./_components/full-calendar";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { clientConfig, serverConfig } from "../../../../config";

export default async function CalendarPage() {
  const tokens = await getTokens(cookies(), {
    apiKey: clientConfig.apiKey,
    cookieName: serverConfig.cookieName,
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    serviceAccount: serverConfig.serviceAccount,
  });

  if (tokens) {
    console.log("token", tokens.decodedToken);
  }
  return (
    <PageContainer className="md:px-0" scrollable={true}>
      <FullCalendarComponent />
    </PageContainer>
  );
}
