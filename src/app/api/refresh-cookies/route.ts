// import { NextRequest, NextResponse } from "next/server";
// import { getAuth } from "firebase-admin/auth";
// import { getFirebaseAdminApp } from "../../../../firebase-admin";
// import { setAuthCookies } from "next-firebase-auth-edge";

// export async function POST(req: NextRequest) {
//   const { token } = await req.json();

//   try {
//     const auth = getAuth(getFirebaseAdminApp());
//     const decodedToken = await auth.verifyIdToken(token);
//     const user = await auth.getUser(decodedToken.uid);

//     const response = NextResponse.next();
//     await setAuthCookies(req, response, {
//       token,
//       user,
//       apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//       cookieName: process.env.NEXT_PUBLIC_COOKIE_NAME,
//       cookieSignatureKeys: [process.env.NEXT_PUBLIC_COOKIE_SIGNATURE_KEY],
//       serviceAccount: process.env.GOOGLE_APPLICATION_CREDENTIALS,
//     });

//     return response;
//   } catch (error) {
//     if (error instanceof Error) {
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     } else {
//       return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
//     }
//   }
// }
