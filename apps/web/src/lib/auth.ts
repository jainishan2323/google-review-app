import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@repo/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/business.manage",
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Persist the Google OAuth tokens so they can be reused later (offline/dev
      // testing of the Business Profile API). The refresh token is the durable
      // credential; access tokens expire in ~1h. refresh_token is only present on
      // a consent grant — guard so a token-only refresh never clobbers it. This is
      // best-effort: a write failure must never block the owner's login.
      const tokenFields = account
        ? {
            googleAccessToken: account.access_token ?? null,
            ...(account.refresh_token ? { googleRefreshToken: account.refresh_token } : {}),
            googleTokenExpiresAt: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          }
        : {};

      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name, image: user.image, ...tokenFields },
          create: { email: user.email, name: user.name, image: user.image, ...tokenFields },
        });
      } catch (err) {
        console.error("signIn: failed to upsert user / persist tokens", err);
      }

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
