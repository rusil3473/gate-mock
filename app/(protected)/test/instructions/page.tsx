"use client";
import NavBar from "@/components/NavBar";
import Loading from "@/components/Loading";
import { usePaper } from "@/store/PaperStore";
import { useQuestion } from "@/store/QuestionStore";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Test() {
  const [isAgree, setIsAgree] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [qCount, setQCount] = useState<number | null>(null);

  const { year, branch, set } = usePaper() as {
    year?: number;
    branch?: string;
    set?: number;
  };

  const hydrated = usePaper.persist?.hasHydrated?.();
  const router = useRouter();

  const { setQuestions } = useQuestion() as {
    setQuestions: (questions: any[]) => void;
  };

  const getQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const result = await axios.get("/api/questions", {
        params: { year, branch, set },
      });
      const questions = result.data.questions || [];
      setQuestions(questions);
      setQCount(questions.length);
      setIsReady(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    if (!year || !branch || !set) {
      router.replace("/");
      return;
    }
    getQuestions();
  }, [hydrated, year, branch, set, router]);

  const handleStart = async () => {
    try {
      // optionally request fullscreen here if desired
      router.push("/test");
    } catch (error) {
      console.log(error);
    }
  };

  const estMinutes = 180;

  if (!hydrated) return <Loading count={0} />;

  return (
    <>
      <NavBar path="test" />

      <main
        className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8 flex items-center justify-center"
        onKeyDown={(e) => {
          if (e.key === "Enter" && isAgree && isReady) handleStart();
        }}
      >
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="md:col-span-2 bg-white rounded-2xl p-6 shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  Test Instructions
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Please read the instructions carefully before starting the
                  test.
                </p>
              </div>

              <div className="text-sm">
                {loadingQuestions ? (
                  <div className="text-slate-500">Preparing questions…</div>
                ) : (
                  <div
                    className={`font-medium ${isReady ? "text-teal-600" : "text-slate-500"}`}
                  >
                    {isReady ? "Ready" : "Preparing"}
                  </div>
                )}
              </div>
            </div>

            <ol className="space-y-3 text-slate-700 list-decimal list-inside">
              <li className="flex gap-3 items-start">
                <span className="text-teal-600 mt-0.5">✅</span>
                <span>
                  Keep a stable internet connection. Loss of connectivity may
                  affect your test.
                </span>
              </li>

              <li className="flex gap-3 items-start">
                <span className="text-teal-600 mt-0.5">🔒</span>
                <span>
                  Do not switch tabs or windows. Switching may submit or lock
                  the test.
                </span>
              </li>

              <li className="flex gap-3 items-start">
                <span className="text-teal-600 mt-0.5">🕒</span>
                <span>
                  Time is limited. Keep an eye on the timer and manage your time
                  well.
                </span>
              </li>

              <li className="flex gap-3 items-start">
                <span className="text-teal-600 mt-0.5">📵</span>
                <span>
                  Silence notifications and avoid interruptions for the best
                  experience.
                </span>
              </li>

              <li className="flex gap-3 items-start">
                <span className="text-teal-600 mt-0.5">✍️</span>
                <span>
                  Your answers will be saved automatically as you proceed.
                </span>
              </li>
            </ol>

            <div className="mt-6 flex items-center gap-3">
              <input
                id="agree"
                type="checkbox"
                checked={isAgree}
                onChange={() => setIsAgree((s) => !s)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="agree" className="text-sm text-slate-700">
                I agree to the instructions and understand the rules
              </label>
            </div>

            <div className="mt-6">
              <details className="bg-slate-50 p-3 rounded-md text-sm text-slate-600">
                <summary className="font-medium">
                  More details about test rules
                </summary>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>No back navigation during the test</li>
                  <li>
                    Attempt carefully — you can change answers until submission
                  </li>
                  <li>Contact support if you face issues</li>
                </ul>
              </details>
            </div>
          </section>

          <aside className="bg-white rounded-2xl p-6 shadow flex flex-col justify-between">
            <div>
              <div className="text-sm text-slate-500">Paper</div>
              <div className="mt-2 text-lg font-semibold text-slate-800">
                {branch ?? "-"} • {year ?? "-"}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Set {set ?? "-"}
              </div>

              <hr className="my-4" />

              <div className="text-sm text-slate-600">Questions</div>
              <div className="mt-1 text-lg font-medium text-slate-800">
                {qCount ?? "-"}
              </div>

              <div className="mt-4 text-sm text-slate-600">Estimated time</div>
              <div className="mt-1 text-lg font-medium text-slate-800">
                {estMinutes ? `${estMinutes} mins` : "-"}
              </div>

              <div className="mt-4 text-sm text-slate-500">
                Tip: Use a desktop for best experience
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleStart}
                disabled={!isAgree || !isReady}
                className="w-full bg-teal-600 disabled:bg-slate-300 text-white py-2 rounded-md"
              >
                Start Test
              </button>

              <button
                onClick={() => router.push("/")}
                className="mt-3 w-full bg-transparent border border-slate-200 rounded-md py-2 text-slate-700"
              >
                Back
              </button>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
