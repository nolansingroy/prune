import React from "react";
import PageContainer from "@/components/layout/page-container";
import FullCalendarComponent from "./_components/full-calendar";
import { redirect } from "next/navigation";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { clientConfig, serverConfig } from "../../../../config";

export default async function CalendarPage() {
  const tokens = await getTokens(cookies(), {
    apiKey: clientConfig.apiKey,
    cookieName: serverConfig.cookieName,
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    serviceAccount: serverConfig.serviceAccount,
  });

  console.log("User is signed in with token", tokens?.decodedToken);

  // if (!tokens) {
  //   console.log("User is not signed in there is no token");
  //   return redirect("/");
  // } else {
  //   console.log("User is signed in with token", tokens.decodedToken);
  // }

  return (
    <PageContainer className="md:px-2 md:py-0" scrollable={false}>
      <FullCalendarComponent />
    </PageContainer>
  );
}
