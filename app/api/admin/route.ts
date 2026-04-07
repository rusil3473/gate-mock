import client, { connectBD } from "@/lib/db";
import { handleApiError } from "@/lib/api-error";
import { requireAPISession } from "@/lib/server-auth";
import { Question, Year } from "@/models/QuestionModel";
import { TestSubmission } from "@/models/TestSubmissionModel";
import { NextResponse } from "next/server";

type SubmissionDoc = {
  _id: unknown;
  userId: string;
  userEmail?: string;
  year: number;
  set: number;
  branch?: string;
  score: number;
  maxScore: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  submitReason?: string;
  remarks?: string[];
  submittedAt?: Date;
};

type UserDoc = {
  _id: unknown;
  email?: string;
  name?: string;
  role?: string;
  createdAt?: Date;
};

type YearDoc = {
  year: number;
  set: number;
  branch: string;
};

type QuestionCountDoc = {
  _id: {
    year: number;
    set: number;
    branch: string;
  };
  questionCount: number;
};

const roundTo2 = (value: number) => Number(value.toFixed(2));
const paperKey = (year: number, set: number, branch: string) =>
  `${year}::${set}::${branch.toLowerCase()}`;

export async function GET() {
  try {
    const sessionOrResponse = await requireAPISession({ roles: ["admin"] });
    if (sessionOrResponse instanceof NextResponse) {
      return sessionOrResponse;
    }

    await connectBD();

    const submissions = (await TestSubmission.find({})
      .select({
        userId: 1,
        userEmail: 1,
        year: 1,
        set: 1,
        branch: 1,
        score: 1,
        maxScore: 1,
        attempted: 1,
        correct: 1,
        incorrect: 1,
        unanswered: 1,
        submitReason: 1,
        remarks: 1,
        submittedAt: 1,
      })
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(1000)
      .lean()) as SubmissionDoc[];

    const totalSubmissions = submissions.length;
    const uniqueSubmissionStudents = new Set(
      submissions.map(
        (submission) => submission.userId || submission.userEmail,
      ),
    ).size;
    const averageScorePercent =
      totalSubmissions > 0
        ? roundTo2(
            submissions.reduce((sum, submission) => {
              if (!submission.maxScore || submission.maxScore <= 0) return sum;
              return sum + (submission.score / submission.maxScore) * 100;
            }, 0) / totalSubmissions,
          )
        : 0;

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const todaySubmissions = submissions.filter((submission) => {
      if (!submission.submittedAt) return false;
      return new Date(submission.submittedAt).getTime() >= dayStart.getTime();
    }).length;

    const usersCollection = (await client.connect())
      .db()
      .collection<UserDoc>("users");
    const [totalUsers, adminUsers, users] = await Promise.all([
      usersCollection.countDocuments(),
      usersCollection.countDocuments({ role: "admin" }),
      usersCollection
        .find({}, { projection: { email: 1, name: 1, role: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(500)
        .toArray(),
    ]);

    const [yearDocs, questionCountDocs] = await Promise.all([
      Year.find({}).select({ year: 1, set: 1, branch: 1 }).lean() as Promise<
        YearDoc[]
      >,
      Question.aggregate([
        {
          $group: {
            _id: {
              year: "$year",
              set: "$set",
              branch: "$branch",
            },
            questionCount: { $sum: 1 },
          },
        },
      ]) as Promise<QuestionCountDoc[]>,
    ]);

    const countMap = new Map<string, number>();
    questionCountDocs.forEach((doc) => {
      if (!doc?._id) return;
      countMap.set(
        paperKey(doc._id.year, doc._id.set, doc._id.branch ?? ""),
        Number(doc.questionCount ?? 0),
      );
    });
    const paperRowMap = new Map<
      string,
      { year: number; set: number; branch: string; questionCount: number }
    >();

    yearDocs.forEach((doc) => {
      const year = Number(doc.year);
      const set = Number(doc.set);
      const branch = String(doc.branch ?? "")
        .trim()
        .toLowerCase();
      if (!year || !set || !branch) return;

      const key = paperKey(year, set, branch);
      paperRowMap.set(key, {
        year,
        set,
        branch,
        questionCount: countMap.get(key) ?? 0,
      });
    });

    questionCountDocs.forEach((doc) => {
      const year = Number(doc?._id?.year);
      const set = Number(doc?._id?.set);
      const branch = String(doc?._id?.branch ?? "")
        .trim()
        .toLowerCase();
      if (!year || !set || !branch) return;

      const key = paperKey(year, set, branch);
      if (!paperRowMap.has(key)) {
        paperRowMap.set(key, {
          year,
          set,
          branch,
          questionCount: Number(doc.questionCount ?? 0),
        });
      }
    });

    const papers = Array.from(paperRowMap.values()).sort((left, right) => {
      if (right.year !== left.year) return right.year - left.year;
      if (left.set !== right.set) return left.set - right.set;
      return left.branch.localeCompare(right.branch);
    });

    const totalPapers = papers.length;
    const totalQuestions = papers.reduce(
      (sum, paper) => sum + Number(paper.questionCount ?? 0),
      0,
    );

    return NextResponse.json(
      {
        stats: {
          totalSubmissions,
          uniqueSubmissionStudents,
          averageScorePercent,
          todaySubmissions,
          totalUsers,
          adminUsers,
          totalPapers,
          totalQuestions,
        },
        submissions: submissions.map((submission) => ({
          id: String(submission._id),
          userId: submission.userId,
          userEmail: submission.userEmail ?? "",
          year: submission.year,
          set: submission.set,
          branch: submission.branch ?? "",
          score: roundTo2(Number(submission.score ?? 0)),
          maxScore: roundTo2(Number(submission.maxScore ?? 0)),
          attempted: submission.attempted ?? 0,
          correct: submission.correct ?? 0,
          incorrect: submission.incorrect ?? 0,
          unanswered: submission.unanswered ?? 0,
          submitReason: submission.submitReason ?? "manual",
          remarksCount: Array.isArray(submission.remarks)
            ? submission.remarks.length
            : 0,
          submittedAt: submission.submittedAt
            ? new Date(submission.submittedAt).toISOString()
            : null,
        })),
        users: users.map((user) => ({
          id: String(user._id),
          email: user.email ?? "",
          name: user.name ?? "",
          role: user.role === "admin" ? "admin" : "user",
          createdAt: user.createdAt
            ? new Date(user.createdAt).toISOString()
            : null,
        })),
        papers: papers.map((paper) => ({
          year: paper.year,
          set: paper.set,
          branch: paper.branch,
          questionCount: paper.questionCount,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError({
      context: "api.admin.GET",
      error,
    });
  }
}
