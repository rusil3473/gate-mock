import type { ChangeEvent } from "react";

export type PapersSortOrder = "year-desc" | "year-asc";

type PapersHeaderProps = {
  searchTerm: string;
  sortOrder: PapersSortOrder;
  totalPapers: number;
  branchCount: number;
  latestYear: number | null;
  onSearchTermChange: (value: string) => void;
  onSortOrderChange: (value: PapersSortOrder) => void;
  onResetFilters: () => void;
};

export default function PapersHeader({
  searchTerm,
  sortOrder,
  totalPapers,
  branchCount,
  latestYear,
  onSearchTermChange,
  onSortOrderChange,
  onResetFilters,
}: PapersHeaderProps) {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchTermChange(event.target.value);
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSortOrderChange(event.target.value as PapersSortOrder);
  };

  return (
    <header className="rounded-3xl border border-slate-200/80 bg-white/85 backdrop-blur-md p-5 sm:p-8 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.35)] animate-fade-up">
      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-center">
        <div>
          <p className="inline-flex items-center rounded-full bg-slate-900 text-white text-xs tracking-wider uppercase px-3 py-1">
            Practice Hub
          </p>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight text-slate-900">
            GATE Mock Papers
          </h1>
          <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-2xl">
            Pick your branch and jump into realistic papers with a clean,
            exam-focused flow.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-4 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider">
              Papers
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">
              {totalPapers}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-4 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider">
              Branches
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">
              {branchCount}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-4 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider">
              Latest
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">
              {latestYear ?? "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 pl-10 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
              placeholder="Search by branch, year or set"
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Search papers"
            />
            <span
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
          </div>

          <select
            className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300"
            value={sortOrder}
            onChange={handleSortChange}
            aria-label="Sort papers"
          >
            <option value="year-desc">Newest first</option>
            <option value="year-asc">Oldest first</option>
          </select>

          <button
            className="rounded-xl bg-slate-800 text-white px-4 py-2.5 hover:bg-slate-700 transition-colors"
            type="button"
            onClick={onResetFilters}
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
