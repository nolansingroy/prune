import React from "react";
import FullCalendarComponent from "./_components/full-calendar";
import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { notFound } from "next/navigation";
import { fetchBookingsListviewEvents } from "@/lib/converters/events";
import { authConfig } from "../../../../config/server-config";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "../../../../firebase-admin";

// const db = getFirestore(getFirebaseAdminApp());
export default async function CalendarPage() {
  // const tokens = await getTokens(cookies(), {
  //   apiKey: authConfig.apiKey,
  //   cookieName: authConfig.cookieName,
  //   cookieSignatureKeys: authConfig.cookieSignatureKeys,
  //   serviceAccount: authConfig.serviceAccount,
  // });

  // if (!tokens) {
  //   notFound();
  // }

  // console.log(tokens);

  // const snapshot = await db
  //   .collection("users")
  //   .doc(tokens.decodedToken.uid)
  //   .get();
  // console.log(snapshot.data());

  return <FullCalendarComponent />;
}
