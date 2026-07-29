import { cache } from "react";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/db";
import { verifyTurnstileToken } from "@/lib/server/security/turnstile";
import { authConfig } from "./auth.config";

// Distinguishes a failed Turnstile challenge from wrong credentials on the
// client via SignInResponse.code — NextAuth's `error` field stays the
// generic "CredentialsSignin" string either way.
class TurnstileError extends CredentialsSignin {
  code = "turnstile_failed";
}

const { handlers, auth: uncachedAuth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Turnstile Token", type: "text" },
      },
      async authorize(credentials, request) {
        const email = typeof credentials?.email === "string" ? credentials.email : undefined;
        const password =
          typeof credentials?.password === "string" ? credentials.password : undefined;
        const turnstileToken =
          typeof credentials?.turnstileToken === "string" ? credentials.turnstileToken : undefined;
        if (!email || !password) return null;

        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const verified = await verifyTurnstileToken(turnstileToken, ip);
        if (!verified) throw new TurnstileError();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.hashedPassword) return null;
        if (user.status === "INACTIVE") return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          fullDataAccess: user.fullDataAccess,
        };
      },
    }),
  ],
});

// The admin layout and several page-level "defense in depth" role checks
// each call auth() once per request — cache() dedupes those into a single
// JWT decode/re-sign instead of repeating it 2-3x per render.
export const auth = cache(uncachedAuth);
export { handlers, signIn, signOut };
