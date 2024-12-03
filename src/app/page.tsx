import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { authConfig, serverConfig } from "../../config/server-config";

export default async function Home() {
  const tokens = await getTokens(cookies(), {
    apiKey: authConfig.apiKey,
    cookieName: authConfig.cookieName,
    cookieSignatureKeys: authConfig.cookieSignatureKeys,
    serviceAccount: authConfig.serviceAccount,
  });

  if (!tokens) {
    redirect("/login");
  } else {
    redirect("/calendar");
  }
}
