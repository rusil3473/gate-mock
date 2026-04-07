"use client";

import { toUserFacingError } from "@/lib/client-error";
import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Submission = {
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

type SubjectAnalysis = {
  subject: string;
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  awarded: number;
  maxScore: number;
  accuracyPercent: number;
  scorePercent: number;
};

type QuestionAnalysis = {
  quesNo: number;
  question: string;
  type: string;
  subject: string;
  options: Record<string, string>;
  selectedAnswer: string | string[];
  correctAnswer: string | string[];
  status: "correct" | "incorrect" | "unanswered";
  positiveMarks: number;
  negativeMarks: number;
  awarded: number;
};

type AnalysisResponse = {
  submission: Submission;
  subjectAnalysis: SubjectAnalysis[];
  questions: QuestionAnalysis[];
};

type AnalyzeClientProps = {
  submissionId: string;
};

type Tab = "graph" | "questions";
const PIE_COLORS = ["#059669", "#e11d48", "#64748b"];

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", { hour12: true });
};

const toDisplayAnswer = (value: string | string[]) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "-";
};

const isSelectedOption = (
  selectedAnswer: string | string[],
  optionKey: string,
): boolean => {
  if (Array.isArray(selectedAnswer)) {
    return selectedAnswer.includes(optionKey);
  }
  return selectedAnswer.toUpperCase() === optionKey.toUpperCase();
};

const isCorrectOption = (
  correctAnswer: string | string[],
  optionKey: string,
): boolean => {
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.includes(optionKey);
  }
  return correctAnswer.toUpperCase() === optionKey.toUpperCase();
};

export default function AnalyzeClient({ submissionId }: AnalyzeClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("graph");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>([]);
  const [questions, setQuestions] = useState<QuestionAnalysis[]>([]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await axios.get<AnalysisResponse>(
          `/api/test/analysis/${submissionId}`,
        );
        setSubmission(response.data.submission);
        setSubjectAnalysis(response.data.subjectAnalysis ?? []);
        setQuestions(response.data.questions ?? []);
      } catch (error) {
        setErrorMessage(
          toUserFacingError(
            error,
            "Unable to load analysis right now. Please try again.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAnalysis();
  }, [submissionId]);

  const questionsBySubject = useMemo(() => {
    const grouped = new Map<string, QuestionAnalysis[]>();
    questions.forEach((question) => {
      const key = question.subject || "General";
      const current = grouped.get(key) ?? [];
      current.push(question);
      grouped.set(key, current);
    });
    return Array.from(grouped.entries())
      .map(([subject, subjectQuestions]) => ({
        subject,
        questions: subjectQuestions.sort(
          (left, right) => left.quesNo - right.quesNo,
        ),
      }))
      .sort((left, right) => left.subject.localeCompare(right.subject));
  }, [questions]);

  const attemptDistribution = useMemo(
    () => [
      { name: "Correct", value: submission?.correct ?? 0 },
      { name: "Incorrect", value: submission?.incorrect ?? 0 },
      { name: "Unanswered", value: submission?.unanswered ?? 0 },
    ],
    [submission],
  );

  const subjectBarData = useMemo(
    () =>
      subjectAnalysis.map((subject) => ({
        subject: subject.subject,
        accuracy: Number(subject.accuracyPercent.toFixed(2)),
        score: Number(subject.scorePercent.toFixed(2)),
      })),
    [subjectAnalysis],
  );

  const subjectRadarData = useMemo(
    () =>
      subjectAnalysis.map((subject) => ({
        subject: subject.subject,
        strength: Number(subject.accuracyPercent.toFixed(2)),
        score: Number(subject.scorePercent.toFixed(2)),
      })),
    [subjectAnalysis],
  );

  const subjectQuestionStatsData = useMemo(
    () =>
      subjectAnalysis.map((subject) => ({
        subject: subject.subject,
        total: subject.total,
        answered: subject.attempted,
        wrong: subject.incorrect,
      })),
    [subjectAnalysis],
  );

  const questionStackData = useMemo(() => {
    const totalQuestions = questions.length;
    const wrong = submission?.incorrect ?? 0;
    const attempted = submission?.attempted ?? 0;
    const attemptedCorrect = Math.max(0, attempted - wrong);
    const notAttempted = Math.max(0, totalQuestions - attempted);

    return [
      {
        label: "Questions",
        wrong,
        attemptedCorrect,
        notAttempted,
        totalQuestions,
      },
    ];
  }, [questions.length, submission]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          Loading analysis...
        </div>
      </main>
    );
  }

  if (!submission) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Analysis Unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {errorMessage || "Submission analysis is not available."}
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Back To Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Detailed Analysis
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {(submission.branch || "-").toUpperCase()} {submission.year} Set{" "}
                {submission.set} | Submitted{" "}
                {formatDateTime(submission.submittedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/test/review/${submission.id}`}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Review
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
              >
                Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Score</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {submission.score.toFixed(2)}/{submission.maxScore.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Attempted</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {submission.attempted}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Correct</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">
                {submission.correct}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Incorrect</p>
              <p className="mt-1 text-lg font-semibold text-rose-700">
                {submission.incorrect}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Unanswered</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {submission.unanswered}
              </p>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </section>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              className={`rounded-xl px-4 py-2 text-sm ${
                activeTab === "graph"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab("graph")}
            >
              Graph / Subject-wise Analysis
            </button>
            <button
              className={`rounded-xl px-4 py-2 text-sm ${
                activeTab === "questions"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab("questions")}
            >
              Questions / Subject-wise Analysis
            </button>
          </div>
        </section>

        {activeTab === "graph" ? (
          <section className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Subject-wise Total, Answered, Wrong
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Compare total questions with answered and wrong attempts per
                subject.
              </p>
              {subjectQuestionStatsData.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  No subject data available.
                </p>
              ) : (
                <>
                  <div className="mt-4 h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={subjectQuestionStatsData}
                        margin={{ left: 10, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="total"
                          name="Total Questions"
                          fill="#f59e0b"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="answered"
                          name="Answered"
                          fill="#16a34a"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="wrong"
                          name="Wrong"
                          fill="#dc2626"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-[680px] w-full">
                      <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Subject</th>
                          <th className="px-4 py-3">Total Questions</th>
                          <th className="px-4 py-3">Answered</th>
                          <th className="px-4 py-3">Wrong</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectQuestionStatsData.map((row) => (
                          <tr
                            key={`subject-stats-${row.subject}`}
                            className="border-t border-slate-200 text-sm text-slate-700"
                          >
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {row.subject}
                            </td>
                            <td className="px-4 py-3">{row.total}</td>
                            <td className="px-4 py-3 text-emerald-700">
                              {row.answered}
                            </td>
                            <td className="px-4 py-3 text-rose-700">
                              {row.wrong}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Attempt Distribution
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Quick view of correct vs incorrect vs unanswered questions.
              </p>
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attemptDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={110}
                      dataKey="value"
                      nameKey="name"
                      paddingAngle={3}
                    >
                      {attemptDistribution.map((entry, index) => (
                        <Cell
                          key={`slice-${entry.name}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Subject Accuracy vs Score
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Compare subject-level accuracy and score percentage.
              </p>
              {subjectBarData.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  No subject data available.
                </p>
              ) : (
                <div className="mt-4 h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={subjectBarData}
                      margin={{ left: 10, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="accuracy"
                        name="Accuracy %"
                        fill="#059669"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="score"
                        name="Score %"
                        fill="#0284c7"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Strength vs Weakness Radar
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Wider area indicates stronger subject performance.
              </p>
              {subjectRadarData.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  No subject data available.
                </p>
              ) : (
                <div className="mt-4 h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={subjectRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <Tooltip />
                      <Legend />
                      <Radar
                        name="Accuracy %"
                        dataKey="strength"
                        stroke="#059669"
                        fill="#059669"
                        fillOpacity={0.25}
                      />
                      <Radar
                        name="Score %"
                        dataKey="score"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.18}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Subject Summary
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {subjectAnalysis.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    No subject data available.
                  </p>
                ) : (
                  subjectAnalysis.map((subject) => (
                    <article
                      key={subject.subject}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <h3 className="font-semibold text-slate-900">
                        {subject.subject}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Correct {subject.correct} | Incorrect{" "}
                        {subject.incorrect} | Unanswered {subject.unanswered}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Accuracy {subject.accuracyPercent.toFixed(2)}% | Score{" "}
                        {subject.awarded.toFixed(2)}/
                        {subject.maxScore.toFixed(2)}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </section>
        ) : (
          <section className="space-y-4">
            {questionsBySubject.length === 0 ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-600">
                  No question data available.
                </p>
              </section>
            ) : (
              questionsBySubject.map((group) => (
                <section
                  key={group.subject}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-slate-900">
                    {group.subject}
                  </h2>
                  <div className="mt-4 space-y-4">
                    {group.questions.map((question) => (
                      <article
                        key={question.quesNo}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="font-medium text-slate-900">
                            Q{question.quesNo}. {question.question}
                          </h3>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium uppercase ${
                              question.status === "correct"
                                ? "bg-emerald-100 text-emerald-700"
                                : question.status === "incorrect"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {question.status}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          Type: {question.type} | Marks: +
                          {question.positiveMarks} / -{question.negativeMarks} |
                          Awarded: {question.awarded.toFixed(2)}
                        </p>

                        {Object.keys(question.options).length > 0 ? (
                          <div className="mt-3 grid gap-2">
                            {Object.entries(question.options).map(
                              ([optionKey, optionValue]) => {
                                const selected = isSelectedOption(
                                  question.selectedAnswer,
                                  optionKey,
                                );
                                const correct = isCorrectOption(
                                  question.correctAnswer,
                                  optionKey,
                                );

                                return (
                                  <div
                                    key={`${question.quesNo}-${optionKey}`}
                                    className={`rounded-lg border px-3 py-2 text-sm ${
                                      correct
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                        : selected
                                          ? "border-rose-300 bg-rose-50 text-rose-900"
                                          : "border-slate-200 bg-white text-slate-700"
                                    }`}
                                  >
                                    <span className="font-semibold">
                                      {optionKey}.
                                    </span>{" "}
                                    {optionValue}
                                    {selected ? (
                                      <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                                        Your choice
                                      </span>
                                    ) : null}
                                    {correct ? (
                                      <span className="ml-2 rounded bg-emerald-200 px-2 py-0.5 text-xs text-emerald-900">
                                        Correct
                                      </span>
                                    ) : null}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        ) : (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                            <p>
                              Your Answer:{" "}
                              <span
                                className={`font-semibold ${
                                  question.status === "correct"
                                    ? "text-emerald-700"
                                    : question.status === "incorrect"
                                      ? "text-rose-700"
                                      : "text-slate-700"
                                }`}
                              >
                                {toDisplayAnswer(question.selectedAnswer)}
                              </span>
                            </p>
                            <p className="mt-1">
                              Correct Answer:{" "}
                              <span className="font-semibold text-emerald-700">
                                {toDisplayAnswer(question.correctAnswer)}
                              </span>
                            </p>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </section>
        )}
      </div>
    </main>
  );
}
