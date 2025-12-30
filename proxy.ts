import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const authorized = ["/admin", "/dashboard", "/test"];

export default function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const currPath = url.pathname;
  url.pathname = "/sign-in";
  try {
    const token = req.cookies.get("token")?.value;
    const isAuthorized = authorized.includes(currPath);
    if (!isAuthorized) {
      return NextResponse.next();
    }

    if (!token || typeof token != "string") return NextResponse.rewrite(url);
    const session = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    if (!session) {
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  } catch (e: any) {
    if (e.message == "invalid token") {
      return NextResponse.rewrite(url);
    }
  }
}

export const config = { matcher: ["/admin", "/dashboard", "/", "/test:path*"] };
