"use client";

import axios from "axios";
import { toUserFacingError } from "@/lib/client-error";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SubmissionResponse = {
  submission: SubmissionData;
};

type SubmissionData = {
  id: string;
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
  submitReason: string;
  remarks: string[];
  correctQuestionNos: number[];
  incorrectQuestionNos: number[];
  unansweredQuestionNos: number[];
  submittedAt: string | null;
};

const formatQuestionNos = (questionNos: number[] = []) =>
  questionNos.length > 0 ? questionNos.join(", ") : "-";

const formatScore = (value: number) => value.toFixed(2);

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", { hour12: true });
};

type ReviewClientProps = {
  submissionId: string;
};

export default function ReviewClient({ submissionId }: ReviewClientProps) {
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await axios.get<SubmissionResponse>(
          "/api/test/submit",
          {
            params: { submissionId },
          },
        );
        setSubmission(response.data.submission);
      } catch (error) {
        setErrorMessage(
          toUserFacingError(
            error,
            "Unable to load submission details right now.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSubmission();
  }, [submissionId]);

  const accuracy = useMemo(() => {
    if (!submission || submission.attempted <= 0) return "0.00";
    return ((submission.correct / submission.attempted) * 100).toFixed(2);
  }, [submission]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-600">
          Loading submission...
        </div>
      </main>
    );
  }

  if (!submission) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Review Unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {errorMessage || "Submission was not found."}
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Back To Papers
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Test Review
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {submission.branch?.toUpperCase() || "BRANCH"} {submission.year}{" "}
                Set {submission.set}
              </p>
            </div>
            <div className="text-sm text-slate-500">
              Submitted: {formatDateTime(submission.submittedAt)}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Score</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {formatScore(submission.score)}/
                {formatScore(submission.maxScore)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Attempted</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {submission.attempted}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Correct</div>
              <div className="mt-1 text-xl font-semibold text-emerald-700">
                {submission.correct}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Incorrect</div>
              <div className="mt-1 text-xl font-semibold text-rose-700">
                {submission.incorrect}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Unanswered</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {submission.unanswered}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Accuracy</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {accuracy}%
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 col-span-2">
              <div className="text-xs text-slate-500">Submit Reason</div>
              <div className="mt-1 text-sm font-medium text-slate-800 uppercase">
                {submission.submitReason || "manual"}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Question Number Breakdown
          </h2>
          <div>
            <div className="text-sm font-medium text-emerald-700">Correct</div>
            <p className="mt-1 text-sm text-slate-700 break-words">
              {formatQuestionNos(submission.correctQuestionNos)}
            </p>
          </div>
          <div>
            <div className="text-sm font-medium text-rose-700">Incorrect</div>
            <p className="mt-1 text-sm text-slate-700 break-words">
              {formatQuestionNos(submission.incorrectQuestionNos)}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Proctoring Remarks
          </h2>
          {submission.remarks && submission.remarks.length > 0 ? (
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 space-y-1">
              {submission.remarks.map((remark, index) => (
                <li key={`${remark}-${index}`}>{remark}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No remarks recorded.</p>
          )}
        </section>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Back To Papers
          </Link>
          <Link
            href={`/test/analyze/${submission.id}`}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-600"
          >
            Analyze
          </Link>
          <Link
            href="/test/instructions"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Attempt Another
          </Link>
        </div>
      </div>
    </main>
  );
}
