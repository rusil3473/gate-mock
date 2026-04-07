import mongoose, { Schema } from "mongoose";

const questionSchema = new Schema({
  QuesNo: Number,
  Ques: String,
  Quetype: {
    type: String,
    enum: ["MCQ", "MSQ", "NAT"],
  },
  options: { type: Map, of: String },
  subject: String,
  ans: {
    type: Schema.Types.Mixed,
    validate: {
      validator: function (
        this: { Quetype?: string },
        value: unknown,
      ) {
        switch (this.Quetype) {
          case "MCQ":
            return typeof value === "string";

          case "MSQ":
            return (
              Array.isArray(value) && value.every((v) => typeof v === "string")
            );

          case "NAT":
            return typeof value === "number";

          default:
            return false;
        }
      },
    },
  },
  basedonImage: Boolean,
  ImageUrl: String,
  year: Number,
  set: Number,
  branch: String,
  pos: Number,
  neg: Number,
});

const answerSchema = new Schema({
  quesNo: Number,
  year: Number,
  ans: { type: Schema.Types.Mixed },
  set: Number,
  date: Schema.Types.Date,
});

const yearSchema = new Schema({
  year: Number,
  branch: String,
  set: Number,
});

export const Question =
  mongoose.models.question || mongoose.model("question", questionSchema);
export const Ans = mongoose.models.ans || mongoose.model("ans", answerSchema);
export const Year = mongoose.models.year || mongoose.model("year", yearSchema);
