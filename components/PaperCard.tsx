"use client";

import { useRouter } from "next/navigation";
import { usePaper } from "@/store/PaperStore";
import { useAns } from "@/store/QuestionStore";
import type { Paper } from "@/types/appType";

export default function PaperCard(props: Paper) {
  const { year, branch, set: paperSet } = props;
  const router = useRouter();

  const { setPaper } = usePaper() as {
    setPaper: (branch: string, year: number, set: number) => void;
  };

  const { setYearSet } = useAns() as {
    setYearSet: (year: number, set: number) => void;
  };

  const handleStartTest = () => {
    setPaper(branch, year, paperSet);
    setYearSet(year, paperSet);
    router.push("/test/instructions");
  };

  return (
    <article className="group relative w-full h-full overflow-hidden rounded-3xl border border-slate-200 bg-white/85 backdrop-blur-sm p-5 sm:p-6 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(15,23,42,0.65)]">
      <div
        className="pointer-events-none absolute -top-16 right-2 h-28 w-28 rounded-full blur-2xl opacity-70 transition-transform duration-500 group-hover:scale-125"
        style={{
          background:
            "radial-gradient(circle, rgba(20,184,166,0.35) 0%, rgba(20,184,166,0) 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Mock Paper
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">
            {branch.toUpperCase()}
          </h3>
          <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs px-2.5 py-1">
            Set {paperSet}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          <span className="rounded-full bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-1">
            {year}
          </span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">
            Latest Ready
          </span>
        </div>
      </div>

      <p className="relative text-sm text-slate-600 leading-relaxed">
        Full-length paper with exam-like flow, section timing, and instant test
        navigation.
      </p>

      <div className="relative mt-6 flex items-center justify-between gap-3">
        <button
          className="w-full sm:w-auto rounded-xl bg-slate-900 text-white py-2.5 px-4 flex items-center justify-center gap-2 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300"
          onClick={handleStartTest}
          aria-label={`Start test ${branch} ${year} set ${paperSet}`}
        >
          <span>Start Paper</span>
          <span aria-hidden="true">{">"}</span>
        </button>

        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          className="hidden sm:inline-block text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          Details
        </a>
      </div>
    </article>
  );
}
