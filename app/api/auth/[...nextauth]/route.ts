import NextAuth, { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import jwt from "jsonwebtoken";
export const authOption: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.NEXT_GOOGLE_CLIENT!,
      clientSecret: process.env.NEXT_GOOGLE_SECRET!,
    }),
  ],
  cookies: {
    sessionToken: {
      name: "token",
      options: {
        httpOnly: true,
        path: "/",
      },
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    async encode({ secret, token }) {
      return jwt.sign(token as unknown as string, secret);
    },
    async decode({ secret, token }) {
      return jwt.verify(token as unknown as string, secret) as any;
    },
  },
};

const handle = NextAuth(authOption);
export { handle as GET, handle as POST };
