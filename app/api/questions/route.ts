import { connect } from "@/dbConfig/db";
import { Question } from "@/models/QuestionModel";
import { IQuestion } from "@/types/appType";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    connect();
    const { year, branch, set } = await req.json();
    if (!year || !branch || !set)
      return NextResponse.json({ message: "Incomplete Data" }, { status: 400 });
    const questions: IQuestion[] = await Question.find({ year, set });
    let fQuestions = questions.map((a) => {
      return {
        QuesNo: a.QuesNo,
        Ques: a.Ques,
        Quetype: a.Quetype,
        options: a.options,
        basedonImage: a.basedonImage,
        ImageUrl: a.ImageUrl,
        year: a.year,
        set: a.set,
        pos: a.pos,
      };
    });
    fQuestions = fQuestions.sort((a, b) => a.QuesNo - b.QuesNo);
    return NextResponse.json({ questions: fQuestions }, { status: 200 });
  } catch (error) {
    console.log(error);
  }
}
