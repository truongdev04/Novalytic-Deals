import { type NextRequest, NextResponse } from "next/server";
import { unsubscribeNewsletterSubscriber } from "@/lib/data";
import { verifyToken } from "@/lib/server/security/signedToken";

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  const email = token ? verifyToken(token) : null;

  if (!email) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await unsubscribeNewsletterSubscriber(email);
  return NextResponse.redirect(new URL("/", request.url));
}
