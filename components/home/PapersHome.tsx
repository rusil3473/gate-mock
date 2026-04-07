"use client";

import Loading from "@/components/Loading";
import NavBar from "@/components/NavBar";
import { toUserFacingError } from "@/lib/client-error";
import PaperCard from "@/components/PaperCard";
import type { Paper } from "@/types/appType";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import PapersHeader, { type PapersSortOrder } from "./PapersHeader";

type PapersResponse = {
  papers: Paper[];
};

const matchesSearchTerm = (paper: Paper, searchTerm: string) => {
  if (!searchTerm) return true;

  return (
    paper.branch.toLowerCase().includes(searchTerm) ||
    String(paper.year).includes(searchTerm) ||
    String(paper.set).includes(searchTerm)
  );
};

const sortPapers = (papers: Paper[], sortOrder: PapersSortOrder) => {
  const sortedPapers = [...papers];

  if (sortOrder === "year-desc") {
    sortedPapers.sort((a, b) => b.year - a.year);
  } else {
    sortedPapers.sort((a, b) => a.year - b.year);
  }

  return sortedPapers;
};

export default function PapersHome() {
  const [paperList, setPaperList] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<PapersSortOrder>("year-desc");

  const fetchPapers = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await axios.get<PapersResponse>("/api/paper");
      setPaperList(response.data.papers ?? []);
    } catch (error) {
      setErrorMessage(
        toUserFacingError(
          error,
          "Unable to load papers right now. Please try again in a moment.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPapers();
  }, [fetchPapers]);

  const visiblePapers = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const filteredPapers = paperList.filter((paper) =>
      matchesSearchTerm(paper, normalizedSearchTerm),
    );

    return sortPapers(filteredPapers, sortOrder);
  }, [paperList, searchTerm, sortOrder]);

  const dashboardStats = useMemo(() => {
    const uniqueBranches = new Set(
      paperList.map((paper) => paper.branch.toLowerCase()),
    );
    const latestYear = paperList.reduce(
      (maxYear, paper) => Math.max(maxYear, paper.year),
      0,
    );

    return {
      totalPapers: paperList.length,
      branchCount: uniqueBranches.size,
      latestYear: latestYear || null,
    };
  }, [paperList]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSortOrder("year-desc");
  };

  return (
    <>
      <NavBar path="/" />
      <main className="relative min-h-screen overflow-hidden bg-slate-100 py-8 px-4 sm:px-8">
        <div
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-55"
          style={{
            background:
              "radial-gradient(circle, rgba(29,78,216,0.35) 0%, rgba(29,78,216,0) 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(20,184,166,0.35) 0%, rgba(20,184,166,0) 68%)",
          }}
          aria-hidden="true"
        />
        <div className="max-w-6xl mx-auto relative z-10">
          <PapersHeader
            searchTerm={searchTerm}
            sortOrder={sortOrder}
            totalPapers={dashboardStats.totalPapers}
            branchCount={dashboardStats.branchCount}
            latestYear={dashboardStats.latestYear}
            onSearchTermChange={setSearchTerm}
            onSortOrderChange={setSortOrder}
            onResetFilters={handleResetFilters}
          />
          {errorMessage ? (
            <section className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </section>
          ) : null}

          {isLoading ? (
            <Loading count={6} />
          ) : (
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-slate-800 font-semibold text-lg sm:text-xl">
                  Available Papers
                </h2>
                <div className="text-sm text-slate-600 rounded-full bg-white/80 border border-slate-200 px-3 py-1">
                  Showing {visiblePapers.length}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 place-items-stretch">
                {visiblePapers.length > 0 ? (
                  visiblePapers.map((paper) => (
                    <PaperCard
                      key={`${paper.branch}-${paper.year}-${paper.set}`}
                      year={paper.year}
                      set={paper.set}
                      branch={paper.branch}
                    />
                  ))
                ) : (
                  <div className="col-span-full rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-10 text-center animate-fade-up">
                    <p className="text-slate-700 font-medium text-lg">
                      No papers match your filters
                    </p>
                    <p className="mt-2 text-slate-500 text-sm">
                      Try another branch, year, or reset filters.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
