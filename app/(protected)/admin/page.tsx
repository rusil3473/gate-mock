"use client";

import NavBar from "@/components/NavBar";
import { toUserFacingError } from "@/lib/client-error";
import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type AdminStats = {
  totalSubmissions: number;
  uniqueSubmissionStudents: number;
  averageScorePercent: number;
  todaySubmissions: number;
  totalUsers: number;
  adminUsers: number;
  totalPapers: number;
  totalQuestions: number;
};

type AdminSubmission = {
  id: string;
  userId: string;
  userEmail: string;
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
  remarksCount: number;
  submittedAt: string | null;
};

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: string | null;
};

type AdminPaper = {
  year: number;
  set: number;
  branch: string;
  questionCount: number;
};

type AdminResponse = {
  stats: AdminStats;
  submissions: AdminSubmission[];
  users: AdminUser[];
  papers: AdminPaper[];
};

type UploadResponse = {
  message: string;
  paper: {
    year: number;
    set: number;
    branch: string;
  };
  fileCount?: number;
  insertedCount: number;
  removedCount: number;
};

type AdminModule = "submissions" | "users" | "papers";

const reasonBadgeStyles: Record<string, string> = {
  manual: "bg-slate-100 text-slate-700 border-slate-200",
  time_up: "bg-orange-100 text-orange-700 border-orange-200",
  fullscreen_exit: "bg-rose-100 text-rose-700 border-rose-200",
  tab_switched: "bg-rose-100 text-rose-700 border-rose-200",
  window_switched: "bg-rose-100 text-rose-700 border-rose-200",
};

const roleBadgeStyles: Record<"admin" | "user", string> = {
  admin: "bg-teal-100 text-teal-700 border-teal-200",
  user: "bg-slate-100 text-slate-700 border-slate-200",
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", { hour12: true });
};

const formatScore = (score: number, maxScore: number) =>
  `${score.toFixed(2)}/${maxScore.toFixed(2)}`;

export default function AdminPage() {
  const [activeModule, setActiveModule] = useState<AdminModule>("submissions");
  const [stats, setStats] = useState<AdminStats>({
    totalSubmissions: 0,
    uniqueSubmissionStudents: 0,
    averageScorePercent: 0,
    todaySubmissions: 0,
    totalUsers: 0,
    adminUsers: 0,
    totalPapers: 0,
    totalQuestions: 0,
  });
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [papers, setPapers] = useState<AdminPaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionReasonFilter, setSubmissionReasonFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [paperSearch, setPaperSearch] = useState("");

  const [uploadYear, setUploadYear] = useState("");
  const [uploadSet, setUploadSet] = useState("");
  const [uploadBranch, setUploadBranch] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await axios.get<AdminResponse>("/api/admin");
      setStats(response.data.stats);
      setSubmissions(response.data.submissions ?? []);
      setUsers(response.data.users ?? []);
      setPapers(response.data.papers ?? []);
    } catch (error) {
      setErrorMessage(
        toUserFacingError(
          error,
          "Unable to load admin dashboard. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAdminData();
  }, [fetchAdminData]);

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = submissionSearch.trim().toLowerCase();
    return submissions.filter((submission) => {
      const matchesReason =
        submissionReasonFilter === "all" ||
        submission.submitReason === submissionReasonFilter;
      if (!matchesReason) return false;
      if (!normalizedSearch) return true;

      return (
        submission.userEmail.toLowerCase().includes(normalizedSearch) ||
        submission.branch.toLowerCase().includes(normalizedSearch) ||
        String(submission.year).includes(normalizedSearch) ||
        String(submission.set).includes(normalizedSearch)

      );
    });
  }, [submissionReasonFilter, submissionSearch, submissions]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = userSearch.trim().toLowerCase();
    if (!normalizedSearch) return users;

    return users.filter((user) => {
      return (
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.role.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [userSearch, users]);

  const filteredPapers = useMemo(() => {
    const normalizedSearch = paperSearch.trim().toLowerCase();
    if (!normalizedSearch) return papers;

    return papers.filter((paper) => {
      return (
        paper.branch.toLowerCase().includes(normalizedSearch) ||
        String(paper.year).includes(normalizedSearch) ||
        String(paper.set).includes(normalizedSearch)
      );
    });
  }, [paperSearch, papers]);

  const handleUploadPaper = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setUploadMessage("");
    setUploadError("");

    const yearValue = Number(uploadYear);
    const setValue = Number(uploadSet);
    const branchValue = uploadBranch.trim().toLowerCase();

    if (!yearValue || !setValue || !branchValue) {
      setUploadError("Year, set, and branch are required.");
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      uploadFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("year", String(yearValue));
      formData.append("set", String(setValue));
      formData.append("branch", branchValue);
      formData.append("replaceExisting", String(replaceExisting));

      const response = await axios.post<UploadResponse>(
        "/api/admin/paper",
        formData,
      );

      setUploadMessage(
        `${response.data.message} Processed ${response.data.fileCount ?? uploadFiles.length} files and added ${response.data.insertedCount} questions.`,
      );
      setUploadFiles([]);
      setUploadYear("");
      setUploadSet("");
      setUploadBranch("");
      await fetchAdminData();
    } catch (error) {
      setUploadError(
        toUserFacingError(
          error,
          "Unable to upload and parse paper files right now.",
        ),
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <NavBar path="admin" />
      <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-8">
        <div
          className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(14,165,233,0.35) 0%, rgba(14,165,233,0) 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(20,184,166,0.30) 0%, rgba(20,184,166,0) 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Admin Control Panel
                </p>
                <h1 className="mt-1 text-3xl font-semibold text-slate-900">
                  Manage Platform Data
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Use modules below for submissions, users, and paper ingestion.
                </p>
              </div>
              <button
                onClick={() => void fetchAdminData()}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
              >
                Refresh Data
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <button
                onClick={() => setActiveModule("submissions")}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  activeModule === "submissions"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <p className="text-xs uppercase tracking-wide opacity-80">
                  Submission Management
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {stats.totalSubmissions}
                </p>
                <p className="mt-1 text-sm opacity-90">
                  Attempts | {stats.uniqueSubmissionStudents} unique students
                </p>
              </button>

              <button
                onClick={() => setActiveModule("users")}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  activeModule === "users"
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <p className="text-xs uppercase tracking-wide opacity-80">
                  User Management
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {stats.totalUsers}
                </p>
                <p className="mt-1 text-sm opacity-90">
                  Users | {stats.adminUsers} admin accounts
                </p>
              </button>

              <button
                onClick={() => setActiveModule("papers")}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  activeModule === "papers"
                    ? "border-indigo-700 bg-indigo-700 text-white"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <p className="text-xs uppercase tracking-wide opacity-80">
                  Paper Management
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {stats.totalPapers}
                </p>
                <p className="mt-1 text-sm opacity-90">
                  Papers | {stats.totalQuestions} total questions
                </p>
              </button>
            </div>
          </section>

          {errorMessage ? (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </section>
          ) : null}

          {activeModule === "submissions" ? (
            <section className="rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/80 p-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Submission Management
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Average score: {stats.averageScorePercent.toFixed(2)}% |
                  Today: {stats.todaySubmissions}
                </p>
              </div>

              <div className="p-4 border-b border-slate-200">
                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    value={submissionSearch}
                    onChange={(event) =>
                      setSubmissionSearch(event.target.value)
                    }
                    placeholder="Search email, branch, year, set"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500"
                  />
                  <select
                    value={submissionReasonFilter}
                    onChange={(event) =>
                      setSubmissionReasonFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500"
                  >
                    <option value="all">All Reasons</option>
                    <option value="manual">Manual</option>
                    <option value="time_up">Time Up</option>
                    <option value="fullscreen_exit">Fullscreen Exit</option>
                    <option value="tab_switched">Tab Switched</option>
                    <option value="window_switched">Window Switched</option>
                  </select>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Showing {filteredSubmissions.length} submissions
                </p>
              </div>

              {isLoading ? (
                <div className="p-6 text-sm text-slate-600">
                  Loading submissions...
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="p-6 text-sm text-slate-600">
                  No submissions found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[980px] w-full">
                    <thead className="bg-slate-100/80 text-left text-xs uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Submitted At</th>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Paper</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">C / I / U</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Remarks</th>
                        <th className="px-4 py-3">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.map((submission) => (
                        <tr
                          key={submission.id}
                          className="border-t border-slate-200 text-sm text-slate-700 hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateTime(submission.submittedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">
                              {submission.userEmail || "Unknown"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {submission.userId}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {(submission.branch || "-").toUpperCase()}{" "}
                            {submission.year} Set {submission.set}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                            {formatScore(submission.score, submission.maxScore)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-emerald-700">
                              {submission.correct}
                            </span>{" "}
                            /{" "}
                            <span className="text-rose-700">
                              {submission.incorrect}
                            </span>{" "}
                            /{" "}
                            <span className="text-slate-700">
                              {submission.unanswered}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium uppercase ${
                                reasonBadgeStyles[submission.submitReason] ??
                                "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {submission.submitReason.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {submission.remarksCount}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link
                              href={`/test/review/${submission.id}`}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                            >
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}

          {activeModule === "users" ? (
            <section className="rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/80 p-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  User Management
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Monitor registered users and role distribution.
                </p>
              </div>

              <div className="p-4 border-b border-slate-200">
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search by name, email, role"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Showing {filteredUsers.length} users
                </p>
              </div>

              {isLoading ? (
                <div className="p-6 text-sm text-slate-600">
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-6 text-sm text-slate-600">
                  No users found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full">
                    <thead className="bg-slate-100/80 text-left text-xs uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-t border-slate-200 text-sm text-slate-700 hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {user.name || "Unknown"}
                          </td>
                          <td className="px-4 py-3">{user.email || "-"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium uppercase ${roleBadgeStyles[user.role]}`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateTime(user.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}

          {activeModule === "papers" ? (
            <section className="space-y-4">
              <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Paper Management
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Upload 2 or more files (questions + answers). Gemini combines
                  them, extracts final questions, and stores paper data.
                </p>

                <form
                  onSubmit={handleUploadPaper}
                  className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5"
                >
                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={uploadYear}
                    onChange={(event) => setUploadYear(event.target.value)}
                    placeholder="Year"
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500"
                  />
                  <input
                    type="number"
                    min={1}
                    value={uploadSet}
                    onChange={(event) => setUploadSet(event.target.value)}
                    placeholder="Set"
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500"
                  />
                  <input
                    type="text"
                    value={uploadBranch}
                    onChange={(event) => setUploadBranch(event.target.value)}
                    placeholder="Branch (e.g. cse)"
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500"
                  />
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                    onChange={(event) =>
                      setUploadFiles(Array.from(event.target.files ?? []))
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${
                      isUploading
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-indigo-700 hover:bg-indigo-600"
                    }`}
                  >
                    {isUploading ? "Uploading..." : "Add Paper"}
                  </button>
                </form>

                <p className="mt-2 text-xs text-slate-500">
                  {uploadFiles.length > 0
                    ? `${uploadFiles.length} files selected: ${uploadFiles
                        .map((file) => file.name)
                        .join(", ")}`
                    : "No files selected"}
                </p>

                <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(event) =>
                      setReplaceExisting(event.target.checked)
                    }
                  />
                  Replace existing questions for same year/set/branch
                </label>

                {uploadMessage ? (
                  <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {uploadMessage}
                  </p>
                ) : null}
                {uploadError ? (
                  <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {uploadError}
                  </p>
                ) : null}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/80 p-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    Available Papers
                  </h3>
                </div>
                <div className="p-4 border-b border-slate-200">
                  <input
                    value={paperSearch}
                    onChange={(event) => setPaperSearch(event.target.value)}
                    placeholder="Search by branch, year, set"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-500"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Showing {filteredPapers.length} papers
                  </p>
                </div>

                {isLoading ? (
                  <div className="p-6 text-sm text-slate-600">
                    Loading papers...
                  </div>
                ) : filteredPapers.length === 0 ? (
                  <div className="p-6 text-sm text-slate-600">
                    No papers found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-[640px] w-full">
                      <thead className="bg-slate-100/80 text-left text-xs uppercase tracking-wide text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Branch</th>
                          <th className="px-4 py-3">Year</th>
                          <th className="px-4 py-3">Set</th>
                          <th className="px-4 py-3">Questions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPapers.map((paper) => (
                          <tr
                            key={`${paper.branch}-${paper.year}-${paper.set}`}
                            className="border-t border-slate-200 text-sm text-slate-700 hover:bg-slate-50/80"
                          >
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {paper.branch.toUpperCase()}
                            </td>
                            <td className="px-4 py-3">{paper.year}</td>
                            <td className="px-4 py-3">{paper.set}</td>
                            <td className="px-4 py-3">{paper.questionCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}
