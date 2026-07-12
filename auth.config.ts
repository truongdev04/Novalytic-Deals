import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/admin/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.permissions = (user as { permissions?: string[] }).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "ADMIN" | "EDITOR" | undefined;
        session.user.permissions = token.permissions as string[] | undefined;
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
};
