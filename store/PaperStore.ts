import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const usePaper = create(
  persist(
    (_set) => ({
      year: 0,
      branch: "",
      set: 0,
      setPaper: (branch: string, year: number, set: number) => {
        _set({ branch, year, set });
      },
      clearPaper: () => {
        _set({ branch: "", year: 0, set: 0 });
      },
    }),
    { name: "paper-storage", storage: createJSONStorage(() => localStorage) }
  )
);
