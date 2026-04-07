import { authOption } from "@/app/api/auth/[...nextauth]/route";
import { AppError, handleApiError } from "@/lib/api-error";
import { connectBD } from "@/lib/db";
import { Question } from "@/models/QuestionModel";
import { TestSubmission } from "@/models/TestSubmissionModel";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type AnswerValue = string | string[];

type SubmitPayload = {
  year?: number;
  set?: number;
  branch?: string;
  answers?: Record<string, AnswerValue>;
  reviewFlags?: Record<string, boolean>;
  visitedQuestions?: Record<string, boolean>;
  submitReason?: string;
  remarks?: string[];
};

const allowedSubmitReasons = new Set([
  "manual",
  "time_up",
  "fullscreen_exit",
  "tab_switched",
  "window_switched",
]);

type QuestionDoc = {
  QuesNo: number;
  Quetype?: string;
  ans: unknown;
  pos?: number;
  neg?: number;
};

const isAnswered = (value: AnswerValue | undefined) => {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
};

const normalizeChoice = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const normalizeOptionList = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeChoice(item)).sort();
};

const areListsEqual = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};

const parseNumberish = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const roundTo2 = (value: number) => Number(value.toFixed(2));

const isCorrectAnswer = (
  questionType: string | undefined,
  expectedAnswer: unknown,
  submittedAnswer: AnswerValue,
) => {
  const normalizedType = (questionType ?? "").toUpperCase();

  if (normalizedType === "MSQ" || Array.isArray(expectedAnswer)) {
    const expectedList = normalizeOptionList(expectedAnswer);
    const submittedList = normalizeOptionList(submittedAnswer);
    return areListsEqual(expectedList, submittedList);
  }

  if (normalizedType === "NAT") {
    const expectedNumber = parseNumberish(expectedAnswer);
    const submittedNumber = parseNumberish(submittedAnswer);
    if (expectedNumber === null || submittedNumber === null) {
      return (
        normalizeChoice(expectedAnswer) === normalizeChoice(submittedAnswer)
      );
    }
    return Math.abs(expectedNumber - submittedNumber) < 1e-9;
  }

  return normalizeChoice(expectedAnswer) === normalizeChoice(submittedAnswer);
};

type StoredSubmission = {
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
  submitReason?: string;
  remarks?: string[];
  correctQuestionNos?: number[];
  incorrectQuestionNos?: number[];
  unansweredQuestionNos?: number[];
  submittedAt?: Date;
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOption);
    if (!session?.user?.id) {
      throw new AppError({
        message: "You need to sign in to view this submission.",
        status: 401,
        code: "UNAUTHORIZED",
      });
    }

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get("submissionId")?.trim() ?? "";

    if (!submissionId || !Types.ObjectId.isValid(submissionId)) {
      throw new AppError({
        message: "A valid submission id is required.",
        status: 400,
        code: "VALIDATION_ERROR",
        details: "Query param `submissionId` is missing or invalid.",
      });
    }

    await connectBD();

    const ownerFilter =
      session.user.role === "admin"
        ? {}
        : {
            userId: session.user.id,
          };

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
        submitReason: 1,
        remarks: 1,
        correctQuestionNos: 1,
        incorrectQuestionNos: 1,
        unansweredQuestionNos: 1,
        submittedAt: 1,
      })
      .lean()) as StoredSubmission | null;

    if (!submission) {
      throw new AppError({
        message: "Submission was not found.",
        status: 404,
        code: "NOT_FOUND",
      });
    }

    return NextResponse.json(
      {
        submission: {
          id: String(submission._id),
          userId: submission.userId,
          year: submission.year,
          set: submission.set,
          branch: submission.branch,
          score: roundTo2(Number(submission.score ?? 0)),
          maxScore: roundTo2(Number(submission.maxScore ?? 0)),
          attempted: submission.attempted,
          correct: submission.correct,
          incorrect: submission.incorrect,
          unanswered: submission.unanswered,
          submitReason: submission.submitReason ?? "manual",
          remarks: submission.remarks ?? [],
          correctQuestionNos: submission.correctQuestionNos ?? [],
          incorrectQuestionNos: submission.incorrectQuestionNos ?? [],
          unansweredQuestionNos: submission.unansweredQuestionNos ?? [],
          submittedAt: submission.submittedAt
            ? submission.submittedAt.toISOString()
            : null,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError({
      context: "api.test.submit.GET",
      error,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOption);
    if (!session?.user?.id) {
      throw new AppError({
        message: "You need to sign in to submit the test.",
        status: 401,
        code: "UNAUTHORIZED",
      });
    }

    const body = (await req.json()) as SubmitPayload;
    const year = Number(body?.year);
    const set = Number(body?.set);
    const branch = typeof body?.branch === "string" ? body.branch : "";
    const answers = body?.answers ?? {};
    const reviewFlags = body?.reviewFlags ?? {};
    const visitedQuestions = body?.visitedQuestions ?? {};
    const submitReasonRaw =
      typeof body?.submitReason === "string" ? body.submitReason.trim() : "";
    const submitReason = allowedSubmitReasons.has(submitReasonRaw)
      ? submitReasonRaw
      : "manual";
    const remarks = Array.isArray(body?.remarks)
      ? body.remarks
          .filter((remark): remark is string => typeof remark === "string")
          .map((remark) => remark.trim())
          .filter((remark) => remark.length > 0)
      : [];

    if (!year || !set) {
      throw new AppError({
        message: "Year and set are required.",
        status: 400,
        code: "VALIDATION_ERROR",
        details: "Payload must include numeric `year` and `set`.",
      });
    }
    if (!branch) {
      throw new AppError({
        message: "Branch is required.",
        status: 400,
        code: "VALIDATION_ERROR",
        details: "Payload must include non-empty `branch`.",
      });
    }

    await connectBD();

    const questionDocs = (await Question.find({ year, set, branch })
      .select({ QuesNo: 1, Quetype: 1, ans: 1, pos: 1, neg: 1 })
      .sort({ QuesNo: 1 })
      .lean()) as QuestionDoc[];

    if (questionDocs.length === 0) {
      throw new AppError({
        message: "No questions found for this paper.",
        status: 404,
        code: "NOT_FOUND",
        details: `No records for year=${year}, set=${set}, branch=${branch}.`,
      });
    }

    let score = 0;
    let maxScore = 0;
    let attempted = 0;
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const correctQuestionNos: number[] = [];
    const incorrectQuestionNos: number[] = [];
    const unansweredQuestionNos: number[] = [];

    const questionResults = questionDocs.map((question) => {
      const questionNo = question.QuesNo;
      const submittedAnswer = answers[questionNo.toString()];
      const positiveMarks = Number(question.pos ?? 0);
      const negativeMarks = Math.abs(Number(question.neg ?? 0));
      maxScore += positiveMarks;

      if (!isAnswered(submittedAnswer)) {
        unanswered += 1;
        unansweredQuestionNos.push(questionNo);
        return {
          quesNo: questionNo,
          status: "unanswered",
          awarded: 0,
          submittedAnswer: submittedAnswer ?? "",
        };
      }

      attempted += 1;
      const isCorrect = isCorrectAnswer(
        question.Quetype,
        question.ans,
        submittedAnswer,
      );
      if (isCorrect) {
        correct += 1;
        correctQuestionNos.push(questionNo);
        score += positiveMarks;
        return {
          quesNo: questionNo,
          status: "correct",
          awarded: positiveMarks,
          submittedAnswer,
        };
      }
      // console.log(
      //   `${question.QuesNo}  real ans is ${question.ans} your answer is ${submittedAnswer} `,
      // );
      incorrect += 1;
      incorrectQuestionNos.push(questionNo);
      score -= negativeMarks;
      return {
        quesNo: questionNo,
        status: "incorrect",
        awarded: -negativeMarks,
        submittedAnswer,
      };
    });

    const normalizedScore = roundTo2(score);

    const normalizedMaxScore = roundTo2(maxScore);
    const normalizedQuestionResults = questionResults.map((result) => ({
      ...result,
      awarded: roundTo2(Number(result.awarded ?? 0)),
    }));

    const submission = await TestSubmission.create({
      userId: session.user.id,
      userEmail: session.user.email ?? "",
      year,
      set,
      branch,
      score: normalizedScore,
      maxScore: normalizedMaxScore,
      attempted,
      correct,
      incorrect,
      unanswered,
      answers,
      reviewFlags,
      visitedQuestions,
      submitReason,
      remarks,
      correctQuestionNos,
      incorrectQuestionNos,
      unansweredQuestionNos,
      questionResults: normalizedQuestionResults,
      submittedAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "Test evaluated successfully",
        submissionId: String(submission._id),
        summary: {
          score: normalizedScore,
          maxScore: normalizedMaxScore,
          attempted,
          correct,
          incorrect,
          unanswered,
          total: questionDocs.length,
          submitReason,
          correctQuestionNos,
          incorrectQuestionNos,
          unansweredQuestionNos,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError({
      context: "api.test.submit.POST",
      error,
    });
  }
}
