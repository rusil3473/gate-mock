import { authOption } from "@/app/api/auth/[...nextauth]/route";
import { AppError, handleApiError } from "@/lib/api-error";
import { connectBD } from "@/lib/db";
import { Question } from "@/models/QuestionModel";
import { TestSubmission } from "@/models/TestSubmissionModel";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type SubmissionDoc = {
  _id: Types.ObjectId;
  userId: string;
  year: number;
  set: number;
  branch: string;
  score: number;
  maxScore: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  answers?: Record<string, string | string[]>;
  submittedAt?: Date;
};

type QuestionDoc = {
  QuesNo: number;
  Ques: string;
  Quetype: string;
  options?: Record<string, string> | Map<string, string>;
  subject?: string;
  ans: unknown;
  pos?: number;
  neg?: number;
};

type QuestionBreakdown = {
  quesNo: number;
  question: string;
  type: string;
  subject: string;
  options: Record<string, string>;
  selectedAnswer: string | string[];
  correctAnswer: string | string[];
  status: "correct" | "incorrect" | "unanswered";
  positiveMarks: number;
  negativeMarks: number;
  awarded: number;
};

const roundTo2 = (value: number) => Number(value.toFixed(2));

const normalizeOptions = (
  options: Record<string, string> | Map<string, string> | undefined,
) => {
  if (!options) return {};
  if (options instanceof Map) return Object.fromEntries(options.entries());
  return options;
};

const normalizeChoice = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const normalizeOptionList = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeChoice(item))
    .filter((item) => item.length > 0)
    .sort();
};

const areListsEqual = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};

const isAnswered = (value: string | string[] | undefined) => {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
};

const parseNumberish = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const isCorrectAnswer = (
  questionType: string,
  expectedAnswer: unknown,
  submittedAnswer: string | string[],
) => {
  const normalizedType = questionType.toUpperCase();

  if (normalizedType === "MSQ" || Array.isArray(expectedAnswer)) {
    return areListsEqual(
      normalizeOptionList(expectedAnswer),
      normalizeOptionList(submittedAnswer),
    );
  }

  if (normalizedType === "NAT") {
    const expectedNumber = parseNumberish(expectedAnswer);
    const submittedNumber = parseNumberish(submittedAnswer);

    if (expectedNumber === null || submittedNumber === null) {
      return normalizeChoice(expectedAnswer) === normalizeChoice(submittedAnswer);
    }

    return Math.abs(expectedNumber - submittedNumber) < 1e-9;
  }

  return normalizeChoice(expectedAnswer) === normalizeChoice(submittedAnswer);
};

const normalizeDisplayAnswer = (
  questionType: string,
  value: unknown,
): string | string[] => {
  if (questionType.toUpperCase() === "MSQ") {
    return normalizeOptionList(value);
  }
  if (Array.isArray(value)) {
    return normalizeOptionList(value);
  }
  return String(value ?? "").trim();
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ submissionId: string }> },
) {
  try {
    const session = await getServerSession(authOption);
    if (!session?.user?.id) {
      throw new AppError({
        message: "You need to sign in to view analysis.",
        status: 401,
        code: "UNAUTHORIZED",
      });
    }

    const resolvedParams = await context.params;
    const submissionId = resolvedParams.submissionId?.trim();
    if (!submissionId || !Types.ObjectId.isValid(submissionId)) {
      throw new AppError({
        message: "A valid submission id is required.",
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }

    await connectBD();

    const ownerFilter =
      session.user.role === "admin" ? {} : { userId: session.user.id };

    const submission = (await TestSubmission.findOne({
      _id: submissionId,
      ...ownerFilter,
    })
      .select({
        userId: 1,
        year: 1,
        set: 1,
        branch: 1,
        score: 1,
        maxScore: 1,
        attempted: 1,
        correct: 1,
        incorrect: 1,
        unanswered: 1,
        answers: 1,
        submittedAt: 1,
      })
      .lean()) as SubmissionDoc | null;

    if (!submission) {
      throw new AppError({
        message: "Submission was not found.",
        status: 404,
        code: "NOT_FOUND",
      });
    }

    const questionDocs = (await Question.find({
      year: submission.year,
      set: submission.set,
      branch: submission.branch,
    })
      .select({
        QuesNo: 1,
        Ques: 1,
        Quetype: 1,
        options: 1,
        subject: 1,
        ans: 1,
        pos: 1,
        neg: 1,
      })
      .sort({ QuesNo: 1 })
      .lean()) as QuestionDoc[];

    if (questionDocs.length === 0) {
      throw new AppError({
        message: "Questions for this submission could not be found.",
        status: 404,
        code: "NOT_FOUND",
      });
    }

    const answers = submission.answers ?? {};
    const perQuestion: QuestionBreakdown[] = questionDocs.map((question) => {
      const questionNo = Number(question.QuesNo);
      const submittedAnswer = answers[String(questionNo)];
      const answered = isAnswered(submittedAnswer);
      const positiveMarks = Number(question.pos ?? 0);
      const negativeMarks = Math.abs(Number(question.neg ?? 0));

      if (!answered) {
        return {
          quesNo: questionNo,
          question: String(question.Ques ?? ""),
          type: String(question.Quetype ?? ""),
          subject: String(question.subject ?? "General"),
          options: normalizeOptions(question.options),
          selectedAnswer: "",
          correctAnswer: normalizeDisplayAnswer(question.Quetype, question.ans),
          status: "unanswered",
          positiveMarks,
          negativeMarks,
          awarded: 0,
        };
      }

      const correct = isCorrectAnswer(
        String(question.Quetype ?? ""),
        question.ans,
        submittedAnswer,
      );

      return {
        quesNo: questionNo,
        question: String(question.Ques ?? ""),
        type: String(question.Quetype ?? ""),
        subject: String(question.subject ?? "General"),
        options: normalizeOptions(question.options),
        selectedAnswer: normalizeDisplayAnswer(question.Quetype, submittedAnswer),
        correctAnswer: normalizeDisplayAnswer(question.Quetype, question.ans),
        status: correct ? "correct" : "incorrect",
        positiveMarks,
        negativeMarks,
        awarded: correct ? positiveMarks : -negativeMarks,
      };
    });

    const bySubjectMap = new Map<
      string,
      {
        subject: string;
        total: number;
        attempted: number;
        correct: number;
        incorrect: number;
        unanswered: number;
        awarded: number;
        maxScore: number;
      }
    >();

    perQuestion.forEach((question) => {
      const key = question.subject.trim() || "General";
      const current = bySubjectMap.get(key) ?? {
        subject: key,
        total: 0,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        awarded: 0,
        maxScore: 0,
      };

      current.total += 1;
      current.maxScore += question.positiveMarks;
      current.awarded += question.awarded;

      if (question.status === "correct") {
        current.attempted += 1;
        current.correct += 1;
      } else if (question.status === "incorrect") {
        current.attempted += 1;
        current.incorrect += 1;
      } else {
        current.unanswered += 1;
      }

      bySubjectMap.set(key, current);
    });

    const subjectAnalysis = Array.from(bySubjectMap.values())
      .map((entry) => ({
        ...entry,
        accuracyPercent:
          entry.attempted > 0 ? roundTo2((entry.correct / entry.attempted) * 100) : 0,
        scorePercent:
          entry.maxScore > 0 ? roundTo2((entry.awarded / entry.maxScore) * 100) : 0,
        awarded: roundTo2(entry.awarded),
        maxScore: roundTo2(entry.maxScore),
      }))
      .sort((left, right) => left.subject.localeCompare(right.subject));

    return NextResponse.json(
      {
        submission: {
          id: String(submission._id),
          year: submission.year,
          set: submission.set,
          branch: submission.branch,
          score: roundTo2(Number(submission.score ?? 0)),
          maxScore: roundTo2(Number(submission.maxScore ?? 0)),
          attempted: submission.attempted,
          correct: submission.correct,
          incorrect: submission.incorrect,
          unanswered: submission.unanswered,
          submittedAt: submission.submittedAt
            ? new Date(submission.submittedAt).toISOString()
            : null,
        },
        subjectAnalysis,
        questions: perQuestion,
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError({
      context: "api.test.analysis.GET",
      error,
    });
  }
}
