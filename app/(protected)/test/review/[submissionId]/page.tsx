import NavBar from "@/components/NavBar";
import { requirePageSession } from "@/lib/server-auth";
import { Types } from "mongoose";
import { notFound } from "next/navigation";
import ReviewClient from "./ReviewClient";

type PageProps = {
  params: Promise<{ submissionId: string }> | { submissionId: string };
};

export default async function TestReviewPage({ params }: PageProps) {
  await requirePageSession({ roles: ["admin", "user"] });

  const resolvedParams = await params;
  const submissionId = resolvedParams.submissionId;

  if (!Types.ObjectId.isValid(submissionId)) {
    notFound();
  }

  return (
    <>
      <NavBar path="/" />
      <ReviewClient submissionId={submissionId} />
    </>
  );
}

