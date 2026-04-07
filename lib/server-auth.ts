import { authOption } from "@/app/api/auth/[...nextauth]/route";
import { apiErrorResponse } from "@/lib/api-error";
import { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

type UserRole = Session["user"]["role"];

export async function requirePageSession(params: {
  roles: UserRole[];
  redirectTo?: string;
}) {
  const { roles, redirectTo = "/sign-in" } = params;
  const session = await getServerSession(authOption);

  if (!session?.user) {
    redirect(redirectTo);
  }

  if (!roles.includes(session.user.role)) {
    redirect("/");
  }

  return session;
}

export async function requireAPISession(params: {
  roles: UserRole[];
}) {
  const { roles } = params;
  const session = await getServerSession(authOption);

  if (!session?.user) {
    return apiErrorResponse({
      message: "You need to sign in to continue.",
      status: 401,
      code: "UNAUTHORIZED",
      context: "auth.requireAPISession",
    });
  }

  if (!roles.includes(session.user.role)) {
    return apiErrorResponse({
      message: "You do not have permission for this action.",
      status: 403,
      code: "FORBIDDEN",
      context: "auth.requireAPISession",
    });
  }

  return session;
}
