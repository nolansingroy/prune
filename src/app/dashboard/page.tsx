import { redirect } from "next/navigation";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { clientConfig, serverConfig } from "../../../config";

export default async function Dashboard() {
  const tokens = await getTokens(cookies(), {
    apiKey: clientConfig.apiKey,
    cookieName: serverConfig.cookieName,
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    serviceAccount: serverConfig.serviceAccount,
  });

  if (!tokens) {
    console.log("User is not signed in there is no token");
    return redirect("/");
  } else {
    console.log("User is signed in with token", tokens.decodedToken);
    redirect("/dashboard/overview");
  }
}
