"use client";

export default function Loading({ count = 6 }: { count?: number }) {
  return (
    <section className="py-2 sm:py-4 animate-fade-up">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div
          role="status"
          className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-700 animate-spin"
          aria-hidden="true"
        />
        <span className="text-sm text-slate-500">Loading papers...</span>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 place-items-stretch">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="h-56 rounded-3xl border border-slate-200 bg-white/80 p-5 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Loading papers
      </p>
    </section>
  );
}
