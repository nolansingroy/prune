import React from "react";
import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { notFound, redirect } from "next/navigation";
import { authConfig } from "../../../../config/server-config";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "../../../../firebase-admin";
import ImpersonateView from "./_components/impersonate-view";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

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
    email: doc.data().email,
  }));

  const title = "Impersonate";
  const description = "Login to users accounts";

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start">
          <Heading title={title} description={description} />
        </div>
        <Separator />
        <ImpersonateView users={users} />
      </div>
    </PageContainer>
  );
}
