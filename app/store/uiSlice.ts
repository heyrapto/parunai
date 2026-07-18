import { StateCreator } from "zustand";
import { MomState, UiSlice } from "./types";

export const createUiSlice: StateCreator<MomState, [], [], UiSlice> = (set) => ({
  activeTimer: null,
  activeTab: "planner",
  isCreateModalOpen: false,

  setTheme: (theme: "light" | "dark") => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  },

  setActiveTimer: (timer) => set({ activeTimer: timer }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
});
