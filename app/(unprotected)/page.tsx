"use client";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  console.log(session);

  return (
    <nav className="">
      <div className="flex flex-row justify-between mx-7 my-5 bg-red-600">
        <div>LOGO IMAGE</div>
        <div>SING IN Button</div>
      </div>
    </nav>
  );
}
