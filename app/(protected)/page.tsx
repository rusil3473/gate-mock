import PapersHome from "@/components/home/PapersHome";
import { requirePageSession } from "@/lib/server-auth";

export default async function ProtectedHomePage() {
  await requirePageSession({ roles: ["admin", "user"] });
  return <PapersHome />;
}
