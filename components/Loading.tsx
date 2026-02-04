"use client";

export default function Loading({ count = 6 }: { count?: number }) {
  return (
    <section className="py-8">
      <div className="flex justify-center mb-6">
        <div
          role="status"
          className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"
          aria-hidden="true"
        />
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 place-items-stretch">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="h-36 bg-white border border-slate-100 rounded-2xl p-4 animate-pulse"
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
