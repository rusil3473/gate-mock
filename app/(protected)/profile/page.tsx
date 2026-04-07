import NavBar from "@/components/NavBar";
import { requirePageSession } from "@/lib/server-auth";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  await requirePageSession({ roles: ["admin", "user"] });

  return (
    <>
      <NavBar path="profile" />
      <ProfileClient />
    </>
  );
}
