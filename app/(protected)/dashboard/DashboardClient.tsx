"use client";

import { toUserFacingError } from "@/lib/client-error";
import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DashboardSubmission = {
  id: string;
  year: number;
  set: number;
  branch: string;
  score: number;
  maxScore: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  submittedAt: string | null;
};

type DashboardStats = {
  totalSubmissions: number;
  bestScorePercent: number;
  averageScorePercent: number;
};

type DashboardResponse = {
  stats: DashboardStats;
  submissions: DashboardSubmission[];
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", { hour12: true });
};

export default function DashboardClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSubmissionsPopup, setShowSubmissionsPopup] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    bestScorePercent: 0,
    averageScorePercent: 0,
  });
  const [submissions, setSubmissions] = useState<DashboardSubmission[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await axios.get<DashboardResponse>("/api/dashboard");
        setStats(response.data.stats);
        setSubmissions(response.data.submissions ?? []);
      } catch (error) {
        setErrorMessage(
          toUserFacingError(
            error,
            "Unable to load dashboard right now. Please try again.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  const latestSubmission = useMemo(() => submissions[0] ?? null, [submissions]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Student Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">
            Performance Overview
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Track all attempts and open review or deep analysis for each paper.
          </p>
        </section>

        {errorMessage ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setShowSubmissionsPopup(true)}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:bg-slate-50"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total Papers Given
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {isLoading ? "-" : stats.totalSubmissions}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Click to view all submissions
            </p>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Best Score
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">
              {isLoading ? "-" : `${stats.bestScorePercent.toFixed(2)}%`}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Average Score
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {isLoading ? "-" : `${stats.averageScorePercent.toFixed(2)}%`}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Latest Attempt</h2>
          {!latestSubmission ? (
            <p className="mt-3 text-sm text-slate-600">
              No submissions yet. Attempt a paper to see your performance.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-900">
                  {(latestSubmission.branch || "-").toUpperCase()}{" "}
                  {latestSubmission.year} - Set {latestSubmission.set}
                </p>
                <p className="text-sm text-slate-600">
                  Score {latestSubmission.score.toFixed(2)}/
                  {latestSubmission.maxScore.toFixed(2)} |{" "}
                  {formatDateTime(latestSubmission.submittedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/test/review/${latestSubmission.id}`}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Review
                </Link>
                <Link
                  href={`/test/analyze/${latestSubmission.id}`}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700"
                >
                  Analyze
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>

      {showSubmissionsPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  All Submissions
                </h3>
                <p className="text-sm text-slate-500">
                  Total: {submissions.length}
                </p>
              </div>
              <button
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => setShowSubmissionsPopup(false)}
              >
                Close
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto">
              {submissions.length === 0 ? (
                <p className="p-6 text-sm text-slate-600">No submissions found.</p>
              ) : (
                <table className="min-w-[980px] w-full">
                  <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Submitted At</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Set</th>
                      <th className="px-4 py-3">Marks</th>
                      <th className="px-4 py-3">C / I / U</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr
                        key={submission.id}
                        className="border-t border-slate-200 text-sm text-slate-700"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatDateTime(submission.submittedAt)}
                        </td>
                        <td className="px-4 py-3">
                          {(submission.branch || "-").toUpperCase()}
                        </td>
                        <td className="px-4 py-3">{submission.year}</td>
                        <td className="px-4 py-3">{submission.set}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {submission.score.toFixed(2)}/
                          {submission.maxScore.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-emerald-700">{submission.correct}</span>
                          {" / "}
                          <span className="text-rose-700">{submission.incorrect}</span>
                          {" / "}
                          <span>{submission.unanswered}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/test/review/${submission.id}`}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Review
                            </Link>
                            <Link
                              href={`/test/analyze/${submission.id}`}
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                            >
                              Analyze
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
