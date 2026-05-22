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
