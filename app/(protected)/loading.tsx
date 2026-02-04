import NavBar from "@/components/NavBar";

export default function LoadingPage() {
  return (
    <>
      <NavBar path="/" />
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600" />
          </div>
          <p className="text-sm text-slate-600">Loading…</p>
        </div>
      </main>
    </>
  );
}
