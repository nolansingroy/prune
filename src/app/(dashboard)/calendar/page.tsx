import React from "react";
import FullCalendarComponent from "./_components/full-calendar";
import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { notFound } from "next/navigation";
import { fetchBookingsListviewEvents } from "@/lib/converters/events";
import { authConfig } from "../../../../config/server-config";

export default async function CalendarPage() {
  const tokens = await getTokens(cookies(), {
    apiKey: authConfig.apiKey,
    cookieName: authConfig.cookieName,
    cookieSignatureKeys: authConfig.cookieSignatureKeys,
    serviceAccount: authConfig.serviceAccount,
  });

  if (!tokens) {
    notFound();
  }

  console.log(tokens);

  // const result = await fetchBookingsListviewEvents(tokens.decodedToken.uid);
  // console.log(result);

  return <FullCalendarComponent />;
}
