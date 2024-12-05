import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirebaseAdminApp } from "../../../../firebase-admin";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  try {
    const auth = getAuth(getFirebaseAdminApp());
    const customToken = await auth.createCustomToken(userId);
    return NextResponse.json({ token: customToken });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}
