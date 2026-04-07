"use client";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;
    router.replace("/");
  }, [router, status]);

  if (status === "authenticated") return null;

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
