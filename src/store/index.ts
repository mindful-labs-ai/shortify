import { create } from "zustand";
import type { ImageConcept, Job, Pdf } from "../lib/api";

type AppState = {
  pdf: Pdf | null;
  jobs: Job[];
  imageConcepts: ImageConcept[];
  setPdf: (p: Pdf | null) => void;
  setJobs: (j: Job[]) => void;
  upsertJob: (j: Job) => void;
  setImageConcepts: (c: ImageConcept[]) => void;
};

export const useAppStore = create<AppState>((set) => ({
  pdf: null,
  jobs: [],
  imageConcepts: [],
  setPdf: (pdf) => set({ pdf }),
  setJobs: (jobs) => set({ jobs }),
  upsertJob: (j) =>
    set((s) => ({
      jobs: s.jobs.some((x) => x.id === j.id)
        ? s.jobs.map((x) => (x.id === j.id ? j : x))
        : [...s.jobs, j],
    })),
  setImageConcepts: (imageConcepts) => set({ imageConcepts }),
}));
