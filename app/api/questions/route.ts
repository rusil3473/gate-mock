import { connectBD } from "@/lib/db";
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
      return NextResponse.json({ message: "Incomplete Data" }, { status: 400 });
    }

    await connectBD();
    const questions = (await Question.find({ year, set })
      .sort({ QuesNo: 1 })
      .lean()) as QuestionDoc[];

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
    console.error("Failed to fetch questions", error);
    return NextResponse.json(
      { message: "Failed to fetch questions" },
      { status: 500 },
    );
  }
}
