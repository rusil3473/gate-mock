import { authOption } from "@/app/api/auth/[...nextauth]/route";
import { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

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
  redirectTo?: string;
}) {
  const { roles, redirectTo = "/sign-in" } = params;
  const session = await getServerSession(authOption);

  if (!session?.user) {
    return NextResponse.json({ messgae: "Unauthorized" }, { status: 401 });
  }

  if (!roles.includes(session.user.role)) {
    return NextResponse.json({ messgae: "Forbidden" }, { status: 403 });
  }

  return session;
}
