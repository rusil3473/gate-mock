"use client";
import { usePaper } from "@/store/PaperStore";
import { useQuestion } from "@/store/QuestionStore";
import axios from "axios";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
export default function Test() {
  const [isAgree, setIsAgree] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

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
    try {
      const result = await axios.post("/api/questions", { year, branch, set });
      setQuestions(result.data.questions);
      setIsReady(true);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    if (!year || !branch || !set) {
      router.replace("/");
    }
    getQuestions();
  }, [year, branch, set, router]);

  const handleStart = async () => {
    const el = document.documentElement;
    try {
      // await el.requestFullscreen();
      router.push("/test");
    } catch (error) {
      console.log(error);
    }
  };

  if (!hydrated) return null;
  return (
    <div className="flex flex-col justify-center items-center h-lvh">
      <div className="bg-yellow-50 p-3 font-bold ">
        <h1>Instructions</h1>
        <ul className="px-3 py-1">
          <li>Full screen only </li>
          <li>
            No tab switch ,switch will submit test will not allow to submitt
            again
          </li>
        </ul>
        <div className="flex flex-row items-center py-2">
          <input
            type="checkbox"
            checked={isAgree}
            onChange={() => {
              setIsAgree((state) => !state);
            }}
          />
          <div className="px-2"> Do you Agree with Above conditions</div>
        </div>
      </div>
      <button
        className="bg-blue-700 rounded text-white my-9 p-3 disabled:bg-blue-300"
        disabled={!isAgree || !isReady}
        onClick={handleStart}
      >
        Start Test Now
      </button>
    </div>
  );
}
