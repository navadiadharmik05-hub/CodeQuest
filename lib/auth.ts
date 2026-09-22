import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  // Pure JWT session strategy — zero database connection required
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "codequest-temporary-build-secret-key-32-chars-minimum",
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID || "dummy-github-id",
      clientSecret: process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET || "dummy-github-secret",
    }),
    CredentialsProvider({
      name: "Guest / Demo",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Player1" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Simple mock user to bypass DB validation
        if (credentials?.username) {
          return {
            id: "1",
            name: credentials.username,
            email: `${credentials.username}@codequest.local`,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateSession }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? token.email;
      }
      if (trigger === "update" && updateSession) {
        Object.assign(token, updateSession);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
