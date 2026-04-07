import client from "@/lib/db";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { ObjectId } from "mongodb";
import NextAuth, { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";

type AppRole = "admin" | "user";

const USERS_COLLECTION = "users";
const DEFAULT_ROLE: AppRole = "user";

const isAppRole = (value: unknown): value is AppRole =>
  value === "admin" || value === "user";

const getRoleFromDb = async (userId?: string | null): Promise<AppRole> => {
  if (!userId || !ObjectId.isValid(userId)) {
    return DEFAULT_ROLE;
  }

  const users = (await client.connect())
    .db()
    .collection<{ role?: string }>(USERS_COLLECTION);
  const _id = new ObjectId(userId);
  const user = await users.findOne({ _id }, { projection: { role: 1 } });

  if (isAppRole(user?.role)) {
    return user.role;
  }

  // Backfill users created by adapter without role.
  await users.updateOne({ _id }, { $set: { role: DEFAULT_ROLE } });
  return DEFAULT_ROLE;
};

export const authOption: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.NEXT_GOOGLE_CLIENT!,
      clientSecret: process.env.NEXT_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  adapter: MongoDBAdapter(client),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        const userId = user?.id ?? token.sub;
        token.role = await getRoleFromDb(userId);
      } catch (error) {
        console.error("Failed to resolve role", error);
        token.role = (token.role as AppRole | undefined) ?? DEFAULT_ROLE;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as AppRole | undefined) ?? DEFAULT_ROLE;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        await getRoleFromDb(user.id);
      } catch (error) {
        console.error("Failed to set default role for new user", error);
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handle = NextAuth(authOption);
export { handle as GET, handle as POST };
