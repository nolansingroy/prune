//middleware to handle authentication and authorization

import { NextRequest, NextResponse } from "next/server";
import {
  authMiddleware,
  redirectToHome,
  redirectToLogin,
  redirectToPath,
  getFirebaseAuth,
} from "next-firebase-auth-edge";
import { authConfig } from "../config/server-config";
import { refreshNextResponseCookies } from "next-firebase-auth-edge/lib/next/cookies";
import { adminUserIds } from "./constants/data";

const { setCustomUserClaims, getUser } = getFirebaseAuth(authConfig);
const PUBLIC_PATHS = ["/register", "/login", "/policy/textmessaging"];

export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    // debug: true,
    loginPath: "/api/login",
    logoutPath: "/api/logout",
    refreshTokenPath: "/api/refresh-token",
    debug: authConfig.debug,
    enableMultipleCookies: authConfig.enableMultipleCookies,
    enableCustomToken: authConfig.enableCustomToken,
    apiKey: authConfig.apiKey,
    cookieName: authConfig.cookieName,
    cookieSerializeOptions: authConfig.cookieSerializeOptions,
    cookieSignatureKeys: authConfig.cookieSignatureKeys,
    serviceAccount: authConfig.serviceAccount,
    experimental_enableTokenRefreshOnExpiredKidHeader:
      authConfig.experimental_enableTokenRefreshOnExpiredKidHeader,

    handleValidToken: async ({ token, decodedToken }, headers) => {
      const pathname = request.nextUrl.pathname;

      // Allow authenticated users to access /policy/textmessaging
      if (pathname === "/policy/textmessaging") {
        return NextResponse.next({
          request: {
            headers,
          },
        });
      }

      // Redirect authenticated users away from other public paths
      if (
        PUBLIC_PATHS.includes(pathname) &&
        pathname !== "/policy/textmessaging"
      ) {
        return redirectToPath(request, "/calendar", {
          shouldClearSearchParams: true,
        });
      }

      // Redirect authenticated users to /calendar if they request the root path
      if (pathname === "/") {
        return redirectToPath(request, "/calendar", {
          shouldClearSearchParams: true,
        });
      }

      const response = NextResponse.next({
        request: {
          headers,
        },
      });

      // if (!decodedToken.display_name) {
      const userRecord = await getUser(decodedToken.uid);

      if (adminUserIds.includes(userRecord?.uid ?? "") && !decodedToken.role) {
        await setCustomUserClaims(decodedToken.uid, {
          role: "admin",
        });

        return refreshNextResponseCookies(request, response, authConfig);
      }
      // await setCustomUserClaims(decodedToken.uid, {
      //   display_name: userRecord?.displayName ?? "N/A",
      // });

      // }

      return response;
    },
    handleInvalidToken: async (reason) => {
      console.info("Missing or malformed credentials", { reason });

      return redirectToLogin(request, {
        path: "/login",
        publicPaths: PUBLIC_PATHS,
      });
    },
    handleError: async (error) => {
      console.error("Unhandled authentication error", { error });

      return redirectToLogin(request, {
        path: "/login",
        publicPaths: PUBLIC_PATHS,
      });
    },
  });
}

export const config = {
  matcher: ["/", "/((?!_next|api|.*\\.).*)", "/api/login", "/api/logout"],
};
