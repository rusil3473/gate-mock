import { IQuestion } from "@/types/appType";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useQuestion = create(
  persist(
    (set, get) => ({
      questions: [],
      setQuestions: (que: IQuestion[]) => {
        set({ questions: que });
      },
    }),
    {
      name: "question-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
