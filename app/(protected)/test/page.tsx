"use client";
import { useAns, useQuestion } from "@/store/QuestionStore";
import { FQuestion } from "@/types/appType";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";

export default function Test() {
  const { questions } = useQuestion() as { questions: FQuestion[] };
  const { answers, setAnswers } = useAns() as {
    answers: Record<string, string | string[]>;
    setAnswers: (key: string, value: string | string[]) => void;
  };

  const [currQuestionNo, setCurrQuestionNo] = useState<number>(1);
  const currQuestion = useMemo(
    () => questions[currQuestionNo - 1] as FQuestion | undefined,
    [questions, currQuestionNo],
  );

  const [localAns, setLocalAns] = useState<Record<string, any>>(answers || {});
  const [review, setReview] = useState<Record<number, boolean>>({});

  const [timeLeft, setTimeLeft] = useState<number | null>(180 * 60);

  useEffect(() => {
    if (timeLeft == null) return;
    const id = setInterval(() => {
      setTimeLeft((t) => (t && t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft !== null]);

  useEffect(() => {
    if (timeLeft === 0) {
      // Auto-submit placeholder - you can wire real submit here
      alert("Time is up! Submitting the test...");
    }
  }, [timeLeft]);

  const formatTime = (s: number | null) => {
    if (s == null) return "--:--";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  useEffect(() => {
    setLocalAns(answers || {});
  }, [answers]);

  useEffect(() => {
    if (questions.length >= 1 && currQuestionNo > questions.length) {
      setCurrQuestionNo(1);
    }
  }, [questions, currQuestionNo]);

  const total = questions.length;
  const answeredCount = Object.keys(localAns).filter((key) => {
    const ans = localAns[key];
    // Exclude empty strings and empty arrays
    if (typeof ans === "string") return ans.trim().length > 0;
    if (Array.isArray(ans)) return ans.length > 0;
    return true;
  }).length;
  const markedCount = Object.values(review).filter(Boolean).length;
  const answeredMarkedCount = Object.keys(localAns).filter(
    (k) => review[Number(k)],
  ).length;
  const notVisitedCount = Math.max(0, total - answeredCount);

  // persist changes to global store
  const persistAnswer = (qNo: number, value: string | string[]) => {
    const key = qNo.toString();
    setLocalAns((s) => ({
      ...s,
      [key]: value,
    }));
    setAnswers(key, value);
    setReview((r) => ({ ...r, [qNo]: false }));
  };

  const handleSelectMCQ = (qNo: number, optionKey: string) => {
    persistAnswer(qNo, optionKey);
  };

  const handleToggleMSQ = (
    qNo: number,
    optionKey: string,
    checked: boolean,
  ) => {
    const key = qNo.toString();
    const current = (localAns[key] as string[]) || [];
    const updated = checked
      ? [...current, optionKey]
      : current.filter((x) => x !== optionKey);
    persistAnswer(qNo, updated);
  };

  useEffect(() => {
    console.log(localAns);
  }, [localAns]);
  const handleChangeNAT = (qNo: number, value: number | null) => {
    persistAnswer(
      qNo,
      value === null || typeof value !== "string" || Number.isNaN(value)
        ? ""
        : value,
    );
  };

  const goTo = (n: number) => {
    if (n < 1 || n > total) return;
    setCurrQuestionNo(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => goTo(Math.min(total, currQuestionNo + 1));
  const prev = () => goTo(Math.max(1, currQuestionNo - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currQuestionNo, total]);

  const toggleReview = (n: number) => {
    setReview((r) => ({ ...r, [n]: !r[n] }));
  };
  // TO-DO Until prod

  // useEffect(() => {
  //   history.pushState(null, location.href);
  //   const ele = document.documentElement;
  //   const handleVisiblityChange = async () => {
  //     if (document.hidden) {
  //       alert("Tab Switched NO MERCY Test is submitted");
  //       //TO-Do answer submit
  //     }
  //   };
  //   const handleBlur = async () => {
  //     alert("Tab Switched NO MERCY Test is submitted");
  //     //TO-Do answer submit
  //   };
  //   const handleExit = async () => {
  //     if (document.fullscreenElement) {
  //       const isSubmit = window.confirm(
  //         "Are you sure you want to exit & submit ?"
  //       );
  //       if (!isSubmit) {
  //         await ele.requestFullscreen();
  //       }
  //       //TO-Do answer submit
  //     }
  //   };
  //   document.addEventListener("fullscreenchange", handleExit);
  //   document.addEventListener("visibilitychange", handleVisiblityChange);
  //   document.addEventListener("blur", handleBlur);

  //   return () => {
  //     document.removeEventListener("fullscreenchange", handleExit);
  //     document.removeEventListener("visibilitychange", handleVisiblityChange);
  //     document.removeEventListener("blur", handleBlur);
  //   };
  // }, []);

  const clearResponse = (currQuestionNo: number) => {
    persistAnswer(currQuestionNo, "");
  };
  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      <main className="w-full h-screen px-0 py-0 pb-28 bg-slate-50 overflow-hidden">
        {/* Top banner - GATE like */}
        <div className="w-full bg-white  overflow-hidden mb-4 shadow-sm">
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
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full flex-1 overflow-hidden px-6 h-[calc(100vh-8rem)]">
          <section className="md:flex-1 bg-white rounded-2xl shadow h-full flex flex-col overflow-hidden min-h-0">
            <div className="p-6 overflow-auto flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-500">Question</div>
                  <div className="text-xl font-semibold text-slate-800">
                    {currQuestion?.QuesNo ?? "-"}
                  </div>
                  <div className="text-sm text-slate-500">of {total}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="text-sm text-slate-500">Marks</div>
                    <div className="text-sm font-medium text-slate-700">
                      {currQuestion?.pos ?? "-"}
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
                  {currQuestion?.Ques ?? ""}
                </div>
              </div>

              {currQuestion?.basedonImage && currQuestion.ImageUrl ? (
                <div className="mb-4 flex justify-center">
                  <Image
                    src={currQuestion.ImageUrl}
                    alt="Question Image"
                    width={400}
                    height={240}
                    className="rounded-md border"
                  />
                </div>
              ) : null}

              <div className="space-y-3">
                {currQuestion?.Quetype?.toUpperCase() === "MCQ" && (
                  <div className="grid gap-3">
                    {Object.entries(currQuestion.options).map(([key, val]) => {
                      const selected =
                        localAns[currQuestion.QuesNo?.toString()] === key;
                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${selected ? "bg-teal-50 border-teal-200" : "bg-white border-slate-100"}`}
                        >
                          <input
                            type="radio"
                            name={String(currQuestion.QuesNo)}
                            checked={selected}
                            onChange={() =>
                              handleSelectMCQ(currQuestion.QuesNo, key)
                            }
                            className="h-4 w-4 text-teal-600"
                          />
                          <div className="text-slate-700 font-medium">
                            {key}.
                          </div>
                          <div className="text-slate-700">{val}</div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currQuestion?.Quetype?.toUpperCase() === "MSQ" && (
                  <div className="grid gap-3">
                    {Object.entries(currQuestion.options).map(([key, val]) => {
                      const current =
                        (localAns[
                          currQuestion.QuesNo?.toString()
                        ] as string[]) || [];
                      const checked = current.includes(key);
                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${checked ? "bg-teal-50 border-teal-200" : "bg-white border-slate-100"}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              handleToggleMSQ(
                                currQuestion.QuesNo,
                                key,
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 text-teal-600"
                          />
                          <div className="text-slate-700 font-medium">
                            {key}.
                          </div>
                          <div className="text-slate-700">{val}</div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currQuestion?.Quetype?.toUpperCase() === "NAT" && (
                  <div>
                    <input
                      type="number"
                      value={localAns[currQuestion.QuesNo?.toString()] ?? ""}
                      onChange={(e) =>
                        handleChangeNAT(
                          currQuestion.QuesNo,
                          e.target.valueAsNumber,
                        )
                      }
                      className="w-40 px-3 py-2 rounded-md border border-slate-200"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="text-sm text-slate-500">
                  You can use ← → arrow keys to navigate.
                </div>
                <div className="mt-2">
                  {review[currQuestionNo] && (
                    <span className="inline-block bg-yellow-400 text-white px-3 py-1 rounded">
                      Marked for review
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 border-t bg-white flex gap-2 items-center justify-center">
              <button
                onClick={() => {
                  setReview((r) => ({ ...r, [currQuestionNo]: true }));
                  next();
                }}
                className="flex-1 bg-yellow-400 text-white px-3 py-3 rounded-md text-center"
              >
                Mark for Review & Next
              </button>

              <button
                onClick={() => clearResponse(currQuestionNo)}
                className="flex-1 bg-white border border-slate-200 px-3 py-3 rounded-md text-center"
              >
                Clear Response
              </button>

              <button
                onClick={() => {
                  persistAnswer(
                    currQuestionNo,
                    localAns[currQuestionNo.toString()],
                  );
                  next();
                }}
                className="flex-1 bg-teal-600 text-white px-3 py-3 rounded-md text-center"
              >
                Save & Next
              </button>
            </div>
          </section>

          <aside className="w-full md:w-80 bg-white rounded-2xl p-0 shadow flex flex-col gap-0 md:sticky md:top-16 self-start h-full overflow-hidden min-h-0">
            <div className="p-4 flex items-start gap-3">
              <div className="w-14 h-14 bg-slate-200 rounded-full" />
              <div>
                <div className="text-sm font-medium">John Smith</div>
                <div className="text-xs text-slate-500">CS - GATE Mock</div>
              </div>
            </div>

            <div className="px-4">
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-teal-600 rounded" /> Answered{" "}
                  <span className="font-semibold ml-1">{answeredCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-slate-100 border rounded" /> Not
                  Answered{" "}
                  <span className="font-semibold ml-1">{notVisitedCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-400 rounded" /> Marked{" "}
                  <span className="font-semibold ml-1">{markedCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-slate-700 rounded" /> Ans & Marked{" "}
                  <span className="font-semibold ml-1">
                    {answeredMarkedCount}
                  </span>
                </div>
              </div>
              <div className="text-sm text-slate-500 py-1">
                Choose a Question
              </div>
            </div>

            <div className="p-3 overflow-y-auto flex-1 pr-2 min-h-0">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q) => {
                  const ans = localAns[q.QuesNo.toString()];
                  let isAnswered = false;
                  if (typeof ans === "string") {
                    isAnswered = ans.trim().length > 0;
                  } else if (Array.isArray(ans)) {
                    isAnswered = ans.length > 0;
                  }
                  const isCurrent = q.QuesNo === currQuestionNo;
                  const isMarked = !!review[q.QuesNo];
                  const base = isCurrent
                    ? "ring-2 ring-offset-1 ring-teal-300"
                    : "";
                  const bg = isMarked
                    ? "bg-yellow-400 text-white"
                    : isAnswered
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-700";
                  return (
                    <button
                      key={q.QuesNo}
                      onClick={() => goTo(q.QuesNo)}
                      className={`w-12 h-12 rounded ${bg} ${base} flex items-center justify-center`}
                    >
                      {q.QuesNo}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t">
              <button
                onClick={() => {
                  if (confirm("Submit test?")) {
                    alert("Submitted (placeholder)");
                  }
                }}
                className="w-full bg-blue-700 text-white py-2 rounded-md"
              >
                Submit
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
