"use client";

import Loading from "@/components/Loading";
import NavBar from "@/components/NavBar";
import Papercard from "@/components/PaperCard";
import { Paper } from "@/types/appType";
import axios from "axios";
import { useEffect, useState, useMemo } from "react";

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("year-desc");

  const getPapers = async () => {
    try {
      setLoading(true);
      const result = await axios.get("/api/paper");
      setPapers(result.data.papers);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getPapers();
  }, []);

  const filteredPapers = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = papers.filter((p) => {
      if (!q) return true;
      return (
        p.branch.toLowerCase().includes(q) ||
        String(p.year).includes(q) ||
        String(p.set).includes(q)
      );
    });

    if (sortBy === "year-desc") list = list.sort((a, b) => b.year - a.year);
    if (sortBy === "year-asc") list = list.sort((a, b) => a.year - b.year);

    return list;
  }, [papers, query, sortBy]);

  if (loading) {
    return (
      <>
        <NavBar path="/" />
        <main className="min-h-screen bg-slate-50 py-6 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto">
            <header className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 text-center">
                GATE Mock Tests
              </h1>
              <p className="mt-1 text-sm sm:text-base text-slate-600 text-center">
                Practice previous year papers — clean modern UI for quick
                practice.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <input
                  className="w-full sm:w-72 px-3 py-2 rounded-md border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                  placeholder="Search by branch, year or set"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search papers"
                />

                <select
                  className="w-full sm:w-48 px-3 py-2 rounded-md border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort papers"
                >
                  <option value="year-desc">Year: Newest</option>
                  <option value="year-asc">Year: Oldest</option>
                </select>
              </div>
            </header>

            <Loading count={100} />
          </div>
        </main>
      </>
    );
  }
  return (
    <>
      <NavBar path="/" />
      <main className="min-h-screen bg-slate-50 py-6 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 text-center">
              GATE Mock Tests
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-600 text-center">
              Practice previous year papers — clean modern UI for quick
              practice.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <input
                className="w-full sm:w-72 px-3 py-2 rounded-md border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                placeholder="Search by branch, year or set"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search papers"
              />

              <select
                className="w-full sm:w-48 px-3 py-2 rounded-md border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort papers"
              >
                <option value="year-desc">Year: Newest</option>
                <option value="year-asc">Year: Oldest</option>
              </select>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 place-items-stretch">
            {filteredPapers.length > 0 ? (
              filteredPapers.map((obj, i) => (
                <Papercard
                  key={i}
                  year={obj.year}
                  set={obj.set}
                  branch={obj.branch}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-slate-500 py-10">
                No matching papers
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
