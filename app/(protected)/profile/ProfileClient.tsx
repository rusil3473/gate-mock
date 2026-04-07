"use client";

import { toUserFacingError } from "@/lib/client-error";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type DashboardStats = {
  totalSubmissions: number;
  bestScorePercent: number;
  averageScorePercent: number;
};

type DashboardResponse = {
  stats: DashboardStats;
};

export default function ProfileClient() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    bestScorePercent: 0,
    averageScorePercent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await axios.get<DashboardResponse>("/api/dashboard");
        setStats(response.data.stats);
      } catch (error) {
        setErrorMessage(
          toUserFacingError(
            error,
            "Unable to load profile stats right now. Please try again.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboardStats();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Profile
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">
            {session?.user?.name || "Student"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {session?.user?.email || "-"}
          </p>
          <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase text-slate-700">
            Role: {session?.user?.role ?? "user"}
          </p>
        </section>

        {errorMessage ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Tests Attempted
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {isLoading ? "-" : stats.totalSubmissions}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Best Score
            </p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">
              {isLoading ? "-" : `${stats.bestScorePercent.toFixed(2)}%`}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Average Score
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {isLoading ? "-" : `${stats.averageScorePercent.toFixed(2)}%`}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
