import NavBar from "@/components/NavBar";
import { requirePageSession } from "@/lib/server-auth";
import { Types } from "mongoose";
import { notFound } from "next/navigation";
import AnalyzeClient from "./AnalyzeClient";

type PageProps = {
  params: Promise<{ submissionId: string }> | { submissionId: string };
};

export default async function AnalyzePage({ params }: PageProps) {
  await requirePageSession({ roles: ["admin", "user"] });

  const resolvedParams = await params;
  const submissionId = resolvedParams.submissionId;

  if (!Types.ObjectId.isValid(submissionId)) {
    notFound();
  }

  return (
    <>
      <NavBar path="dashboard" />
      <AnalyzeClient submissionId={submissionId} />
    </>
  );
}
