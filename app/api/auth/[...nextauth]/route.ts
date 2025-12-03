import NextAuth, { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";

const authOption: NextAuthOptions = {
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
        http: true,
        path: "/",
      },
    },
  },
};

const handle = NextAuth(authOption);
export { handle as GET, handle as POST };
