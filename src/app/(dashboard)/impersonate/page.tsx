import React from "react";
import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { notFound, redirect } from "next/navigation";
import { authConfig } from "../../../../config/server-config";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "../../../../firebase-admin";
import ImpersonateView from "./_components/impersonate-view";
import PageContainer from "@/components/layout/page-container";

const db = getFirestore(getFirebaseAdminApp());

export default async function Page() {
  const tokens = await getTokens(cookies(), {
    apiKey: authConfig.apiKey,
    cookieName: authConfig.cookieName,
    cookieSignatureKeys: authConfig.cookieSignatureKeys,
    serviceAccount: authConfig.serviceAccount,
  });

  if (tokens?.decodedToken.role !== "admin") {
    redirect("/calendar");
  }

  const usersSnapshot = await db.collection("users").get();
  const users = usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    email: doc.data().email, // Ensure email is included
  }));

  return (
    <PageContainer scrollable>
      <div className="flex flex-col items-center justify-center gap-y-4">
        <h1 className="text-4xl font-bold">Impersonate</h1>
        <p className="text-lg">Impersonate a user</p>
        <ImpersonateView users={users} />
      </div>
    </PageContainer>
  );
}
