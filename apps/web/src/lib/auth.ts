import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@repo/db";

// The Operator allowlist is the single source of truth for who is an admin: an
// email listed in ADMIN_EMAILS is the Operator (role=ADMIN, cross-business access);
// everyone else is an Owner. We resolve role from this list on every sign-in so a
// change to the env list takes effect on next login, with no manual DB edits.
// See docs/adr/0014-operator-admin-cross-business-access.md
const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const roleForEmail = (email: string) =>
  adminEmails.includes(email.toLowerCase()) ? "ADMIN" : "OWNER";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Phase 1: identity only. We ask Google to confirm who the owner is
      // (name + email) and nothing more — no `business.manage` scope, no
      // offline refresh token, no forced consent screen. This is a light,
      // warning-free sign-in. The heavier "let Jugnoo read and reply to your
      // reviews" permission is deferred to Phase 2 as an explicit "Connect
      // Google" step on the same account (incremental authorization).
      // See docs/adr/0003-google-signin-split-identity-then-authorization.md
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const role = roleForEmail(user.email);
      await prisma.user.upsert({
        where: { email: user.email },
        update: { name: user.name, image: user.image, role },
        create: { email: user.email, name: user.name, image: user.image, role },
      });

      return true;
    },

    async jwt({ token, account, user }) {
      if (account && user) {
        return {
          ...token,
          userId: user.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.userId = token.userId;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
