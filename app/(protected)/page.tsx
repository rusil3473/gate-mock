import Home from "@/components/Home";
import { requirePageSession } from "@/lib/server-auth";

export default async function page() {
  await requirePageSession({ roles: ["user"] });
  return <Home />;
}
