import { connectBD } from "@/lib/db";
import { Year } from "@/models/QuestionModel";
import { Paper } from "@/types/appType";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectBD();
    const papers = (await Year.find().sort({ year: -1, set: 1 }).lean()) as Paper[];
    return NextResponse.json({ papers }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch papers", error);
    return NextResponse.json(
      { message: "Failed to fetch papers" },
      { status: 500 },
    );
  }
}
