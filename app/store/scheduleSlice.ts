import { StateCreator } from "zustand";
import { MomState, ScheduleSlice } from "./types";
import { playSound } from "../utils/audio";
import { syncLocalAndState } from "./helpers";
import { Schedule } from "../types";

export const createScheduleSlice: StateCreator<MomState, [], [], ScheduleSlice> = (set, get) => ({
  schedules: [],

  createSchedule: async (scheduleData: Omit<Schedule, "id" | "createdAt">, addToast: (msg: string, type: string) => void) => {
    const tempId = "schedule_" + Date.now();
    const formattedSched: Schedule = {
      ...scheduleData,
      id: tempId,
      createdAt: new Date().toISOString()
    };

    const updatedSchedules = [...get().schedules, formattedSched];
    syncLocalAndState(set, { schedules: updatedSchedules });

    playSound('achievement');
    addToast(`Goal "${formattedSched.title}" established!`, "success");

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedSched)
      });
      if (res.ok) {
        const { schedule } = await res.json();
        if (schedule) {
          const serverSchedules = get().schedules.map(s => s.id === tempId ? schedule : s);
          syncLocalAndState(set, { schedules: serverSchedules });
        }
      }
    } catch (err) {
      console.log("Server schedule creation deferred (offline):", err);
    }
  },

  deleteSchedule: async (id: string, addToast: (msg: string, type: string) => void) => {
    const filteredSchedules = get().schedules.filter(s => s.id !== id);
    const filteredLogs = get().logs.filter(l => l.scheduleId !== id);

    syncLocalAndState(set, {
      schedules: filteredSchedules,
      logs: filteredLogs
    });

    if (get().activeTimer && get().activeTimer?.scheduleId === id) {
      set({ activeTimer: null });
    }

    addToast("Goal removed from active timetables.", "info");

    try {
      await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    } catch (err) {
      console.log("Server schedule deletion deferred (offline):", err);
    }
  }
});
