import { connect } from "@/dbConfig/db";
import { Question } from "@/models/QuestionModel";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    connect();
    const { year, branch, set } = await req.json();
    if (!year || !branch || !set)
      return NextResponse.json({ message: "Incomplete Data" }, { status: 400 });
    const questions = await Question.find({ year, set });
    console.log("done");
    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {}
}
