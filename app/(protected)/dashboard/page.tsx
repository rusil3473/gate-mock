import NavBar from "@/components/NavBar";
import { requirePageSession } from "@/lib/server-auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  await requirePageSession({ roles: ["admin", "user"] });

  return (
    <>
      <NavBar path="dashboard" />
      <DashboardClient />
    </>
  );
}
