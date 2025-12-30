import { connect } from "@/dbConfig/db";
import { Year } from "@/models/QuestionModel";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connect();
    const res = await Year.find();

    return NextResponse.json({ papers: res });
  } catch (error) {
    console.log(error);
  }
}
