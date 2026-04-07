"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

type NavBarProps = {
  path: string;
};

export default function NavBar({ path }: NavBarProps) {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "user";
  const sectionSubtitle = path === "admin" ? "Admin" : "Practice mock tests";

  const navLinks = [
    { href: "/", label: "Home", key: "home" },
    { href: "/dashboard", label: "Dashboard", key: "dashboard" },
    ...(role === "admin"
      ? [{ href: "/admin", label: "Admin", key: "admin" }]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-[0.22em] rounded-full bg-slate-900 text-white px-2.5 py-1.5">
            GATE
          </span>
          <div>
            <div className="font-semibold text-slate-900">Mock Arena</div>
            <div className="text-xs text-slate-500 hidden sm:block">
              {sectionSubtitle}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive =
                (link.href === "/" && path === "/") || path === link.key;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <button
            className="rounded-xl bg-slate-900 text-white px-3.5 py-2 text-sm hover:bg-slate-700 transition-colors"
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
