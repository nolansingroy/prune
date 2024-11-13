import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clientConfig, serverConfig } from "../../../config";
import { NextRequest, NextResponse } from "next/server";
// import {redirectToPath} from 'next-firebase-auth-edge';

export async function getDecodedToken() {
  const tokens = await getTokens(cookies(), {
    apiKey: clientConfig.apiKey,
    cookieName: serverConfig.cookieName,
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    serviceAccount: serverConfig.serviceAccount,
  });

  if (!tokens) {
    redirect("/login");
  }

  return tokens.decodedToken;
}
