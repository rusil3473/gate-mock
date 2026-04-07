"use client";
import { usePaper } from "@/store/PaperStore";
import { useAns } from "@/store/QuestionStore";
import { Paper } from "@/types/appType";
import { redirect } from "next/navigation";

export default function Papercard(props: Paper) {
  const { year, branch, set } = props;
  const { setPaper } = usePaper() as {
    setPaper: (branch: string, year: number, set: number) => void;
  };
  const { setYearSet } = useAns() as {
    setYearSet: (year: number, set: number) => void;
  };

  const handleTest = () => {
    setPaper(branch, year, set);
    setYearSet(year, set);
    redirect(`/test/instructions`);
    return;
  };

  return (
    <div className="w-full h-full bg-linear-to-br from-white to-slate-50 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between p-5 transform transition-transform duration-150 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-lg font-semibold text-slate-800">{branch}</div>
          <div className="mt-1 text-sm text-slate-500">
            Previous year paper •{" "}
            <span className="font-medium text-slate-700">Set {set}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full font-medium">
            {year}
          </span>
          <span className="text-sm text-slate-400">📄</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-300"
          onClick={handleTest}
          aria-label={`Start test ${branch} ${year} set ${set}`}
        >
          <span>Go To Test</span>
          <span aria-hidden>→</span>
        </button>

        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="hidden sm:inline-block text-sm text-slate-600 hover:text-slate-800"
        >
          Preview
        </a>
      </div>
    </div>
  );
}
