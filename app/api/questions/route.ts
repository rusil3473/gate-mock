import { connectBD } from "@/lib/db";
import { AppError, handleApiError } from "@/lib/api-error";
import { Question } from "@/models/QuestionModel";
import { FQuestion } from "@/types/appType";
import { NextRequest, NextResponse } from "next/server";

type QuestionDoc = {
  QuesNo: number;
  Ques: string;
  Quetype: string;
  options?: Map<string, string> | Record<string, string>;
  basedonImage: boolean;
  ImageUrl?: string;
  year: number;
  set: number;
  branch?: string;
  pos: number;
};

const normalizeOptions = (
  options: Map<string, string> | Record<string, string> | undefined,
) => {
  if (!options) return {};
  if (options instanceof Map) return Object.fromEntries(options.entries());
  return options;
};

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const year = Number(params.get("year"));
    const set = Number(params.get("set"));
    const branch =
      typeof params.get("branch") === "string" ? params.get("branch") : "";

    if (!year || !branch || !set) {
      throw new AppError({
        message: "Year, branch, and set are required.",
        status: 400,
        code: "VALIDATION_ERROR",
        details: "Missing query params. Expected: year, branch, set.",
      });
    }

    await connectBD();
    const questions = (await Question.find({ year, set, branch })
      .sort({ QuesNo: 1 })
      .lean()) as QuestionDoc[];

    if (questions.length === 0) {
      throw new AppError({
        message: "No questions found for the selected paper.",
        status: 404,
        code: "NOT_FOUND",
        details: `No records for year=${year}, set=${set}, branch=${branch}.`,
      });
    }

    const formattedQuestions: FQuestion[] = questions.map((question) => ({
      QuesNo: question.QuesNo,
      Ques: question.Ques,
      Quetype: question.Quetype,
      options: normalizeOptions(question.options),
      basedonImage: question.basedonImage,
      ImageUrl: question.ImageUrl,
      year: question.year,
      set: question.set,
      pos: question.pos,
    }));

    return NextResponse.json(
      { questions: formattedQuestions },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError({
      context: "api.questions.GET",
      error,
    });
  }
}
