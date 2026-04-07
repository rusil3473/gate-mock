import { IQuestion } from "@/types/appType";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useQuestion = create(
  persist(
    (set) => ({
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

export const useAns = create(
  persist(
    (_set) => {
      return {
        year: 0,
        set: 0,
        answers: {},
        setYearSet: (year: number, set: number) => {
          _set({ year: year, set: set, answers: {} });
        },
        setAnswers: (key: string, value: string | string[]) => {
          _set((state: { answers: Record<string, string | string[]> }) => ({
            answers: { ...state.answers, [key]: value },
          }));
        },
        clearAnswers: () => {
          _set({ answers: {} });
        },
      };
    },
    { name: "ans-storage", storage: createJSONStorage(() => localStorage) }
  )
);
