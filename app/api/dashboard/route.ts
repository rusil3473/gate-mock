import { authOption } from "@/app/api/auth/[...nextauth]/route";
import { AppError, handleApiError } from "@/lib/api-error";
import { connectBD } from "@/lib/db";
import { TestSubmission } from "@/models/TestSubmissionModel";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type SubmissionDoc = {
  _id: unknown;
  year: number;
  set: number;
  branch: string;
  score: number;
  maxScore: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  submittedAt?: Date;
};

const roundTo2 = (value: number) => Number(value.toFixed(2));

export async function GET() {
  try {
    const session = await getServerSession(authOption);
    if (!session?.user?.id) {
      throw new AppError({
        message: "You need to sign in to access dashboard data.",
        status: 401,
        code: "UNAUTHORIZED",
      });
    }

    await connectBD();

    const submissions = (await TestSubmission.find({ userId: session.user.id })
      .select({
        year: 1,
        set: 1,
        branch: 1,
        score: 1,
        maxScore: 1,
        attempted: 1,
        correct: 1,
        incorrect: 1,
        unanswered: 1,
        submittedAt: 1,
      })
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(500)
      .lean()) as SubmissionDoc[];

    const totalSubmissions = submissions.length;
    const bestScorePercent =
      submissions.length > 0
        ? roundTo2(
            Math.max(
              ...submissions.map((submission) =>
                submission.maxScore > 0
                  ? (Number(submission.score) / Number(submission.maxScore)) *
                    100
                  : 0,
              ),
            ),
          )
        : 0;
    const averageScorePercent =
      submissions.length > 0
        ? roundTo2(
            submissions.reduce((sum, submission) => {
              if (submission.maxScore <= 0) return sum;
              return (
                sum +
                (Number(submission.score) / Number(submission.maxScore)) * 100
              );
            }, 0) / submissions.length,
          )
        : 0;

    return NextResponse.json(
      {
        stats: {
          totalSubmissions,
          bestScorePercent,
          averageScorePercent,
        },
        submissions: submissions.map((submission) => ({
          id: String(submission._id),
          year: Number(submission.year),
          set: Number(submission.set),
          branch: String(submission.branch ?? ""),
          score: roundTo2(Number(submission.score ?? 0)),
          maxScore: roundTo2(Number(submission.maxScore ?? 0)),
          attempted: Number(submission.attempted ?? 0),
          correct: Number(submission.correct ?? 0),
          incorrect: Number(submission.incorrect ?? 0),
          unanswered: Number(submission.unanswered ?? 0),
          submittedAt: submission.submittedAt
            ? new Date(submission.submittedAt).toISOString()
            : null,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError({
      context: "api.dashboard.GET",
      error,
    });
  }
}
