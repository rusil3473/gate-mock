"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "authenticated") return redirect("/");

  return (
    <nav className="h-screen flex justify-center items-center">
      <button
        className="bg-blue-700 flex justify-center items-center shadow-md"
        onClick={() => signIn("google")}
      >
        <Image
          src="/google_signin.png"
          alt="Google Logo"
          width={40}
          height={40}
          className="m-1"
        ></Image>
        <div className="text-white h-12 w-48 flex items-center justify-center">
          Sign In with Google
        </div>
      </button>
    </nav>
  );
}
