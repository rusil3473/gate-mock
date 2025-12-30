import mongoose, { mongo, Schema, set } from "mongoose";
import { Mona_Sans } from "next/font/google";

export const questionSchema = new mongoose.Schema({
  QuesNo: Number,
  Ques: String,
  Quetype: String,
  options: { type: Map, of: String },
  subject: String,
  ans: {
    type: Schema.Types.Mixed,
  },
  basedonImage: Boolean,
  ImageUrl: String,
  year: Number,
  set: Number,
  pos: Number,
  neg: Number,
});

export const answerSchema = new Schema({
  quesNo: Number,
  year: Number,
  ans: { type: Schema.Types.Mixed },
  set: Number,
});
export const yearSchema = new Schema({
  year: Number,
  branch: String,
  set: Number,
});
export const Question =
  mongoose.models.question || mongoose.model("question", questionSchema);
export const Ans = mongoose.models.ans || mongoose.model("ans", answerSchema);
export const Year = mongoose.models.year || mongoose.model("year", yearSchema);
