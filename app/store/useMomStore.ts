import { create } from "zustand";
import { ActiveTimer } from "../types";

export interface MomUiState {
  activeTimer: ActiveTimer | null;
  activeTab: "planner" | "leaderboard" | "mom";
  isCreateModalOpen: boolean;
  setTheme: (theme: "light" | "dark") => void;
  setActiveTimer: (timer: ActiveTimer | null) => void;
  setActiveTab: (tab: "planner" | "leaderboard" | "mom") => void;
  setIsCreateModalOpen: (open: boolean) => void;
}

export const useMomStore = create<MomUiState>()((set) => ({
  activeTimer: null,
  activeTab: "planner",
  isCreateModalOpen: false,
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  },
  setActiveTimer: (timer) => set({ activeTimer: timer }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
}));
