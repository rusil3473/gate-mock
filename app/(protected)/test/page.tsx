"use client";

import axios from "axios";
import { toUserFacingError } from "@/lib/client-error";
import { useRouter } from "next/navigation";
import { usePaper } from "@/store/PaperStore";
import { useAns, useQuestion } from "@/store/QuestionStore";
import type { FQuestion } from "@/types/appType";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AnswerValue = string | string[];
type PaletteStatus =
  | "not-visited"
  | "visited-unanswered"
  | "answered"
  | "marked-unanswered"
  | "answered-marked";
type SubmitReason =
  | "manual"
  | "time_up"
  | "fullscreen_exit"
  | "tab_switched"
  | "window_switched";

type SubmitOptions = {
  reason?: SubmitReason;
  force?: boolean;
  warningMessage?: string;
  remark?: string;
};

const hasAnswer = (answer: AnswerValue | undefined) => {
  if (typeof answer === "string") return answer.trim().length > 0;
  if (Array.isArray(answer)) return answer.length > 0;
  return false;
};

const paletteStatusStyles: Record<PaletteStatus, string> = {
  "not-visited": "bg-slate-100 text-slate-700 border-slate-200",
  "visited-unanswered": "bg-red-500 text-white border-red-500",
  answered: "bg-teal-600 text-white border-teal-600",
  "marked-unanswered": "bg-violet-600 text-white border-violet-600",
  "answered-marked": "bg-violet-600 text-white border-violet-600",
};

export default function Test() {
  const { questions } = useQuestion() as { questions: FQuestion[] };
  const router = useRouter();
  const { branch } = usePaper() as { branch: string };
  const { year, set, answers, setAnswers, clearAnswers } = useAns() as {
    year: number;
    set: number;
    answers: Record<string, AnswerValue>;
    setAnswers: (key: string, value: AnswerValue) => void;
    clearAnswers: () => void;
  };

  const [currentQuestionNo, setCurrentQuestionNo] = useState<number>(1);
  const [reviewFlags, setReviewFlags] = useState<Record<number, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<
    Record<number, boolean>
  >({ 1: true });
  const [timeLeft, setTimeLeft] = useState<number | null>(180 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const hasSubmittedRef = useRef(false);
  const submissionInProgressRef = useRef(false);
  const hasEnteredFullscreenRef = useRef(false);
  const remarksRef = useRef<string[]>([]);

  const totalQuestions = questions.length;
  const activeQuestionNo =
    totalQuestions === 0 ? 1 : Math.min(currentQuestionNo, totalQuestions);

  const currentQuestion = useMemo(
    () => questions[activeQuestionNo - 1] as FQuestion | undefined,
    [questions, activeQuestionNo],
  );

  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeLeft((previous) =>
        previous !== null && previous > 0 ? previous - 1 : previous,
      );
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const formatTime = (seconds: number | null) => {
    if (seconds == null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getQuestionStatus = (questionNo: number): PaletteStatus => {
    const answer = answers[questionNo.toString()];
    const isAnswered = hasAnswer(answer);
    const isMarked = !!reviewFlags[questionNo];
    const isVisited = !!visitedQuestions[questionNo];

    if (isMarked && isAnswered) return "answered-marked";
    if (isMarked && !isAnswered) return "marked-unanswered";
    if (isAnswered) return "answered";
    if (isVisited) return "visited-unanswered";
    return "not-visited";
  };

  const questionStatusCount = questions.reduce(
    (counts, question) => {
      const status = getQuestionStatus(question.QuesNo);
      if (status === "answered") counts.answered += 1;
      if (status === "visited-unanswered") counts.visitedUnanswered += 1;
      if (status === "marked-unanswered") counts.markedUnanswered += 1;
      if (status === "answered-marked") counts.answeredMarked += 1;
      if (status === "not-visited") counts.notVisited += 1;
      return counts;
    },
    {
      answered: 0,
      visitedUnanswered: 0,
      markedUnanswered: 0,
      answeredMarked: 0,
      notVisited: 0,
    },
  );

  const aptitudeQuestions = useMemo(
    () =>
      questions
        .filter((question) => question.QuesNo >= 1 && question.QuesNo <= 10)
        .sort((a, b) => a.QuesNo - b.QuesNo),
    [questions],
  );

  const branchQuestions = useMemo(
    () =>
      questions
        .filter((question) => question.QuesNo >= 11 && question.QuesNo <= 65)
        .sort((a, b) => a.QuesNo - b.QuesNo),
    [questions],
  );

  const persistAnswer = (questionNo: number, value: AnswerValue) => {
    const key = questionNo.toString();
    setAnswers(key, value);
    setReviewFlags((state) => ({ ...state, [questionNo]: false }));
    setVisitedQuestions((state) => ({ ...state, [questionNo]: true }));
  };

  const handleSelectMCQ = (questionNo: number, optionKey: string) => {
    persistAnswer(questionNo, optionKey);
  };

  const handleToggleMSQ = (
    questionNo: number,
    optionKey: string,
    checked: boolean,
  ) => {
    const key = questionNo.toString();
    const selectedOptions = (answers[key] as string[]) || [];
    const updatedOptions = checked
      ? [...selectedOptions, optionKey]
      : selectedOptions.filter((option) => option !== optionKey);
    persistAnswer(questionNo, updatedOptions);
  };

  const handleChangeNAT = (questionNo: number, value: string) => {
    persistAnswer(questionNo, value.trim() === "" ? "" : value);
  };

  const goTo = useCallback(
    (questionNo: number) => {
      if (questionNo < 1 || questionNo > totalQuestions) return;
      setCurrentQuestionNo(questionNo);
      setVisitedQuestions((state) => ({ ...state, [questionNo]: true }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [totalQuestions],
  );

  const next = useCallback(
    () => goTo(Math.min(totalQuestions, activeQuestionNo + 1)),
    [goTo, totalQuestions, activeQuestionNo],
  );

  const prev = useCallback(
    () => goTo(Math.max(1, activeQuestionNo - 1)),
    [goTo, activeQuestionNo],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, prev]);

  const markForReviewAndNext = () => {
    setReviewFlags((state) => ({ ...state, [activeQuestionNo]: true }));
    setVisitedQuestions((state) => ({ ...state, [activeQuestionNo]: true }));
    next();
  };

  const clearResponse = (questionNo: number) => {
    persistAnswer(questionNo, "");
  };

  const handleSubmitTest = useCallback(
    async ({
      reason = "manual",
      force = false,
      warningMessage,
      remark,
    }: SubmitOptions = {}) => {
      if (hasSubmittedRef.current || submissionInProgressRef.current) return;

      if (remark && !remarksRef.current.includes(remark)) {
        remarksRef.current = [...remarksRef.current, remark];
      }

      if (warningMessage) {
        alert(warningMessage);
      }

      if (!force && !confirm("Submit test?")) return;

      if (!year || !set) {
        setSubmitError("Paper details are missing. Please restart the test.");
        return;
      }

      try {
        setSubmitError("");
        submissionInProgressRef.current = true;
        setIsSubmitting(true);

        const response = await axios.post("/api/test/submit", {
          year,
          set,
          branch,
          answers,
          reviewFlags,
          visitedQuestions,
          submitReason: reason,
          remarks: remarksRef.current,
        });
        const submissionId = response.data?.submissionId as string | undefined;
        hasSubmittedRef.current = true;
        clearAnswers();

        if (!submissionId) {
          alert("Test submitted, but review data is unavailable.");
          return;
        }

        router.replace(`/test/review/${submissionId}`);
      } catch (error) {
        setSubmitError(
          toUserFacingError(
            error,
            "Unable to submit the test right now. Please try again.",
          ),
        );
      } finally {
        setIsSubmitting(false);
        submissionInProgressRef.current = false;
      }
    },
    [
      answers,
      branch,
      clearAnswers,
      reviewFlags,
      router,
      set,
      visitedQuestions,
      year,
    ],
  );

  useEffect(() => {
    if (timeLeft !== 0) return;

    void handleSubmitTest({
      reason: "time_up",
      force: true,
      warningMessage: "Time is up. Your test will be submitted now.",
      remark: "Auto-submitted: time limit ended.",
    });
  }, [timeLeft, handleSubmitTest]);

  useEffect(() => {
    const requestFullscreen = async () => {
      if (document.fullscreenElement || hasSubmittedRef.current) return;

      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.warn("Fullscreen request failed", error);
      }
    };

    void requestFullscreen();

    const handleFirstInteraction = () => {
      void requestFullscreen();
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        hasEnteredFullscreenRef.current = true;
        return;
      }

      if (!hasEnteredFullscreenRef.current) return;

      void handleSubmitTest({
        reason: "fullscreen_exit",
        force: true,
        warningMessage:
          "Fullscreen mode was exited. The test is being submitted automatically.",
        remark: "Auto-submitted: fullscreen was exited during test.",
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;

      void handleSubmitTest({
        reason: "tab_switched",
        force: true,
        warningMessage:
          "Tab switching was detected. The test is being submitted automatically.",
        remark: "Auto-submitted: browser tab was switched.",
      });
    };

    const handleWindowBlur = () => {
      if (document.visibilityState === "hidden") return;

      void handleSubmitTest({
        reason: "window_switched",
        force: true,
        warningMessage:
          "Window focus loss was detected. The test is being submitted automatically.",
        remark: "Auto-submitted: window focus changed during test.",
      });
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [handleSubmitTest]);

  const renderQuestionButton = (question: FQuestion) => {
    const status = getQuestionStatus(question.QuesNo);
    const isCurrent = question.QuesNo === activeQuestionNo;
    const isAnsweredMarked = status === "answered-marked";

    return (
      <button
        key={question.QuesNo}
        onClick={() => goTo(question.QuesNo)}
        className={[
          "relative w-11 h-11 rounded-md border text-sm font-semibold flex items-center justify-center transition-colors",
          paletteStatusStyles[status],
          isCurrent ? "ring-2 ring-offset-1 ring-teal-300" : "",
        ].join(" ")}
      >
        {question.QuesNo}
        {isAnsweredMarked && (
          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      <main className="w-full h-screen px-0 py-0 pb-28 bg-slate-50 overflow-hidden">
        <div className="w-full bg-white overflow-hidden mb-4 shadow-sm">
          <div className="bg-linear-to-r from-slate-800 to-slate-900 text-white px-4 py-2 text-center text-lg font-semibold">
            GRADUATE APTITUDE TEST IN ENGINEERING (GATE 2026)
          </div>
          <div className="bg-slate-900 text-white px-4 py-1 flex justify-between items-center">
            <div className="text-sm">
              CS 1 Computer Science and Information Technology Mock
            </div>
            <div className="text-sm">
              Time Left :{" "}
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 text-xs text-amber-800">
            Stay in fullscreen. Pressing Esc, switching tabs, or changing window
            focus will auto-submit this test and add a backend remark.
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full flex-1 overflow-hidden px-6 h-[calc(100vh-8rem)]">
          <section className="md:flex-1 bg-white rounded-2xl shadow h-full flex flex-col overflow-hidden min-h-0">
            <div className="p-6 overflow-auto flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-500">Question</div>
                  <div className="text-xl font-semibold text-slate-800">
                    {currentQuestion?.QuesNo ?? "-"}
                  </div>
                  <div className="text-sm text-slate-500">
                    of {totalQuestions}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="text-sm text-slate-500">Marks</div>
                    <div className="text-sm font-medium text-slate-700">
                      {currentQuestion?.pos ?? "-"}
                    </div>
                  </div>

                  <div
                    className={`font-mono px-3 py-1 rounded ${timeLeft !== null && timeLeft <= 60 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-800"}`}
                  >
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </div>

              <div className="prose max-w-none text-slate-800 mb-4">
                <div className="text-lg font-medium">
                  {currentQuestion?.Ques ?? ""}
                </div>
              </div>

              {currentQuestion?.basedonImage && currentQuestion.ImageUrl ? (
                <div className="mb-4 flex justify-center">
                  <Image
                    src={currentQuestion.ImageUrl}
                    alt="Question Image"
                    width={400}
                    height={240}
                    className="rounded-md border"
                  />
                </div>
              ) : null}

              <div className="space-y-3">
                {currentQuestion?.Quetype?.toUpperCase() === "MCQ" && (
                  <div className="grid gap-3">
                    {Object.entries(currentQuestion.options).map(
                      ([optionKey, optionValue]) => {
                        const isSelected =
                          answers[currentQuestion.QuesNo?.toString()] ===
                          optionKey;

                        return (
                          <label
                            key={optionKey}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${isSelected ? "bg-teal-50 border-teal-200" : "bg-white border-slate-100"}`}
                          >
                            <input
                              type="radio"
                              name={String(currentQuestion.QuesNo)}
                              checked={isSelected}
                              onChange={() =>
                                handleSelectMCQ(
                                  currentQuestion.QuesNo,
                                  optionKey,
                                )
                              }
                              className="h-4 w-4 text-teal-600"
                            />
                            <div className="text-slate-700 font-medium">
                              {optionKey}.
                            </div>
                            <div className="text-slate-700">{optionValue}</div>
                          </label>
                        );
                      },
                    )}
                  </div>
                )}

                {currentQuestion?.Quetype?.toUpperCase() === "MSQ" && (
                  <div className="grid gap-3">
                    {Object.entries(currentQuestion.options).map(
                      ([optionKey, optionValue]) => {
                        const selectedOptions =
                          (answers[
                            currentQuestion.QuesNo?.toString()
                          ] as string[]) || [];
                        const checked = selectedOptions.includes(optionKey);

                        return (
                          <label
                            key={optionKey}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${checked ? "bg-teal-50 border-teal-200" : "bg-white border-slate-100"}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) =>
                                handleToggleMSQ(
                                  currentQuestion.QuesNo,
                                  optionKey,
                                  event.target.checked,
                                )
                              }
                              className="h-4 w-4 text-teal-600"
                            />
                            <div className="text-slate-700 font-medium">
                              {optionKey}.
                            </div>
                            <div className="text-slate-700">{optionValue}</div>
                          </label>
                        );
                      },
                    )}
                  </div>
                )}

                {currentQuestion?.Quetype?.toUpperCase() === "NAT" && (
                  <div>
                    <input
                      type="number"
                      value={answers[currentQuestion.QuesNo?.toString()] ?? ""}
                      onChange={(event) =>
                        handleChangeNAT(
                          currentQuestion.QuesNo,
                          event.target.value,
                        )
                      }
                      className="w-40 px-3 py-2 rounded-md border border-slate-200"
                      onWheel={(event) => event.currentTarget.blur()}
                    />
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="text-sm text-slate-500">
                  You can use left and right arrow keys to navigate.
                </div>
                <div className="mt-2">
                  {reviewFlags[activeQuestionNo] && (
                    <span className="inline-block bg-violet-600 text-white px-3 py-1 rounded">
                      Marked for review
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 border-t bg-white flex gap-2 items-center justify-center">
              <button
                onClick={markForReviewAndNext}
                className="flex-1 bg-violet-600 text-white px-3 py-3 rounded-md text-center"
              >
                Mark for Review & Next
              </button>

              <button
                onClick={() => clearResponse(activeQuestionNo)}
                className="flex-1 bg-white border border-slate-200 px-3 py-3 rounded-md text-center"
              >
                Clear Response
              </button>

              <button
                onClick={() => {
                  persistAnswer(
                    activeQuestionNo,
                    answers[activeQuestionNo.toString()] ?? "",
                  );
                  next();
                }}
                className="flex-1 bg-teal-600 text-white px-3 py-3 rounded-md text-center"
              >
                Save & Next
              </button>
            </div>
            {submitError ? (
              <div className="px-4 pb-3">
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {submitError}
                </p>
              </div>
            ) : null}
          </section>

          <aside className="w-full md:w-84 bg-white rounded-2xl p-0 shadow flex flex-col gap-0 md:sticky md:top-16 self-start h-full overflow-hidden min-h-0">
            <div className="p-4 flex items-start gap-3">
              <div className="w-14 h-14 bg-slate-200 rounded-full" />
              <div>
                <div className="text-sm font-medium">John Smith</div>
                <div className="text-xs text-slate-500">CS - GATE Mock</div>
              </div>
            </div>

            <div className="px-4">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-teal-600 rounded" />
                  Answered
                  <span className="font-semibold ml-1">
                    {questionStatusCount.answered}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded" />
                  Visited
                  <span className="font-semibold ml-1">
                    {questionStatusCount.visitedUnanswered}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-violet-600 rounded" />
                  Marked
                  <span className="font-semibold ml-1">
                    {questionStatusCount.markedUnanswered}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative w-3 h-3 bg-violet-600 rounded">
                    <span className="absolute -right-0.5 -bottom-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full border border-white" />
                  </span>
                  Ans & Marked
                  <span className="font-semibold ml-1">
                    {questionStatusCount.answeredMarked}
                  </span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <span className="w-3 h-3 bg-slate-100 border border-slate-300 rounded" />
                  Not Visited
                  <span className="font-semibold ml-1">
                    {questionStatusCount.notVisited}
                  </span>
                </div>
              </div>
              <div className="text-sm text-slate-500 py-2">
                Choose a Question
              </div>
            </div>

            <div className="p-3 overflow-y-auto flex-1 pr-2 min-h-0 space-y-4">
              <div>
                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase mb-2">
                  Aptitude (1-10)
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {aptitudeQuestions.length > 0 ? (
                    aptitudeQuestions.map(renderQuestionButton)
                  ) : (
                    <div className="col-span-full text-xs text-slate-400">
                      No aptitude questions
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase mb-2">
                  Branch Specific (11-65)
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {branchQuestions.length > 0 ? (
                    branchQuestions.map(renderQuestionButton)
                  ) : (
                    <div className="col-span-full text-xs text-slate-400">
                      No branch questions
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 border-t">
              <button
                onClick={() => void handleSubmitTest()}
                disabled={isSubmitting}
                className={`w-full text-white py-2 rounded-md transition-colors ${
                  isSubmitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-600"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
