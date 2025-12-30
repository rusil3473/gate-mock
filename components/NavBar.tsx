"use client";
import { signOut } from "next-auth/react";

export default function NavBar({ path }: { path: string }) {
  if (path == "admin") {
    return (
      <div className="flex flex-row bg-black justify-end py-3">
        <button
          className="mx-10 text-white bg-red-600 p-1 rounded-2xl"
          onClick={() => signOut()}
        >
          Logout
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-row bg-black justify-end py-3">
      <button
        className="mx-10 text-white bg-red-600 p-1 rounded-2xl"
        onClick={() => signOut()}
      >
        Logout
      </button>
    </div>
  );
}
