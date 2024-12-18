//middleware to handle authentication and authorization

import { NextRequest, NextResponse } from "next/server";
import {
  authMiddleware,
  redirectToHome,
  redirectToLogin,
  redirectToPath,
} from "next-firebase-auth-edge";
import { authConfig } from "../config/server-config";

const PUBLIC_PATHS = [
  "/register",
  "/login",
  "/policy/textmessaging",
  "/sms",
  "/404",
];

export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    // debug: true,
    loginPath: "/api/login",
    logoutPath: "/api/logout",
    apiKey: authConfig.apiKey,
    cookieName: authConfig.cookieName,
    cookieSignatureKeys: authConfig.cookieSignatureKeys,
    cookieSerializeOptions: authConfig.cookieSerializeOptions,
    serviceAccount: authConfig.serviceAccount,
    handleValidToken: async ({ token, decodedToken }, headers) => {
      const pathname = request.nextUrl.pathname;

      // Allow authenticated users to access /policy/textmessaging
      if (
        pathname === "/policy/textmessaging" ||
        pathname === "/sms" ||
        pathname === "/404"
      ) {
        return NextResponse.next({
          request: {
            headers,
          },
        });
      }

      // Redirect authenticated users away from other public paths
      if (
        PUBLIC_PATHS.includes(pathname) &&
        pathname !== "/policy/textmessaging" &&
        pathname !== "/sms" &&
        pathname !== "/404"
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

      return NextResponse.next({
        request: {
          headers,
        },
      });
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
