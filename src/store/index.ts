import { create } from "zustand";
import type { ImageConcept, Job, Pdf } from "../lib/api";

export type View =
  | "drop"
  | "toc"
  | "image_picker"
  | "progress"
  | "library"
  | "settings";

type AppState = {
  view: View;
  setView: (v: View) => void;

  // Set true when the brand logo is clicked so DropView renders its full
  // "Start a new project" hero instead of the compact data-aware variant.
  // Cleared on DropView unmount.
  forceStart: boolean;
  setForceStart: (v: boolean) => void;

  pdf: Pdf | null;
  setPdf: (p: Pdf | null) => void;

  pendingJobIds: string[]; // 사용자가 막 만든 job 묶음 (image picker 대상)
  setPendingJobIds: (ids: string[]) => void;

  jobs: Job[];
  setJobs: (j: Job[]) => void;
  upsertJob: (j: Job) => void;

  imageConcepts: ImageConcept[];
  setImageConcepts: (c: ImageConcept[]) => void;
};

export const useAppStore = create<AppState>((set) => ({
  view: "drop",
  setView: (view) => set({ view }),

  forceStart: false,
  setForceStart: (forceStart) => set({ forceStart }),

  pdf: null,
  setPdf: (pdf) => set({ pdf }),

  pendingJobIds: [],
  setPendingJobIds: (pendingJobIds) => set({ pendingJobIds }),

  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  upsertJob: (j) =>
    set((s) => ({
      jobs: s.jobs.some((x) => x.id === j.id)
        ? s.jobs.map((x) => (x.id === j.id ? j : x))
        : [...s.jobs, j],
    })),

  imageConcepts: [],
  setImageConcepts: (imageConcepts) => set({ imageConcepts }),
}));
