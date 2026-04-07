"use client";
import { signOut } from "next-auth/react";

export default function NavBar({ path }: { path: string }) {
  return (
    <nav className="flex items-center justify-between bg-slate-900 text-white py-3 px-4 sm:px-8 shadow-sm sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📋</span>
        <div>
          <div className="font-semibold">GATE Mock</div>
          <div className="text-xs text-slate-300 hidden sm:block">{path === "admin" ? "Admin" : "Practice mock tests"}</div>
        </div>
      </div>

      <div>
        <button
          className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-md"
          onClick={() => signOut()}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
