import { cache } from "react";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/db";
import { authConfig } from "./auth.config";

const { handlers, auth: uncachedAuth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : undefined;
        const password =
          typeof credentials?.password === "string" ? credentials.password : undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.hashedPassword) return null;
        if (user.status === "INACTIVE") return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        return { id: user.id, email: user.email, role: user.role, permissions: user.permissions };
      },
    }),
  ],
});

// The admin layout and several page-level "defense in depth" role checks
// each call auth() once per request — cache() dedupes those into a single
// JWT decode/re-sign instead of repeating it 2-3x per render.
export const auth = cache(uncachedAuth);
export { handlers, signIn, signOut };
