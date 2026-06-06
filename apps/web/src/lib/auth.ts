import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import { prisma } from "@repo/db";

// Refresh an expired Google access token using the stored refresh token.
// Returns a new token object with updated accessToken/expiresAt, or token.error set on failure.
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) throw new Error("Missing refresh token");

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(refreshed));

    return {
      ...token,
      accessToken: refreshed.access_token,
      // expires_in is seconds from now; store as absolute unix seconds (matches account.expires_at)
      expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 3600),
      // Google may not return a new refresh token; keep the existing one
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (err) {
    console.error("Failed to refresh Google access token", err);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

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
    async signIn({ user }) {
      if (!user.email) return false;

      await prisma.user.upsert({
        where: { email: user.email },
        update: { name: user.name, image: user.image },
        create: { email: user.email, name: user.name, image: user.image },
      });

      return true;
    },

    async jwt({ token, account, user }) {
      // First sign-in: account + user are present.
      if (account && user) {
        // Resolve the Prisma User.id by email. Under the JWT strategy `user.id` is the
        // Google OAuth `sub`, NOT our DB id, so we look it up explicitly. signIn() has
        // already upserted the user by email at this point.
        const dbUser = user.email
          ? await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } })
          : null;

        return {
          ...token,
          userId: dbUser?.id ?? token.userId,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }

      // Subsequent calls: return the token if it's still valid, otherwise refresh.
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.userId = token.userId;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
