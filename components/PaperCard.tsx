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
    <div className="m-15 border-2 w-fit rounded-xl flex flex-col justify-center py-2 ">
      <div className="p-0 m-1 pr-7">
        <div className="text-xl font-medium">{branch}</div>
        <div className="text-xl font-medium">{year}</div>
        <div className="text-xl font-medium">Set: {set}</div>
      </div>
      <button
        className="bg-blue-500 rounded w-fit mt-5 text-white p-1 mx-7"
        onClick={handleTest}
      >
        Go To Test
      </button>
    </div>
  );
}
