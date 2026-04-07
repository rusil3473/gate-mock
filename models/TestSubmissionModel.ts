import mongoose, { Schema } from "mongoose";

const questionResultSchema = new Schema(
  {
    quesNo: Number,
    status: String,
    awarded: Number,
    submittedAnswer: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: false },
);

const testSubmissionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, default: "" },
    year: { type: Number, required: true, index: true },
    set: { type: Number, required: true, index: true },
    branch: { type: String, default: "" },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    attempted: { type: Number, required: true },
    correct: { type: Number, required: true },
    incorrect: { type: Number, required: true },
    unanswered: { type: Number, required: true },
    answers: {
      type: Schema.Types.Mixed,
      default: {},
    },
    reviewFlags: {
      type: Schema.Types.Mixed,
      default: {},
    },
    visitedQuestions: {
      type: Schema.Types.Mixed,
      default: {},
    },
    submitReason: {
      type: String,
      default: "manual",
    },
    remarks: {
      type: [String],
      default: [],
    },
    correctQuestionNos: {
      type: [Number],
      default: [],
    },
    incorrectQuestionNos: {
      type: [Number],
      default: [],
    },
    unansweredQuestionNos: {
      type: [Number],
      default: [],
    },
    questionResults: {
      type: [questionResultSchema],
      default: [],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

export const TestSubmission =
  mongoose.models.test_submission ||
  mongoose.model("test_submission", testSubmissionSchema);
