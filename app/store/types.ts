import { UserProfile, Schedule, TaskLog, EmailLog, LeaderboardEntry, SmtpConfig, ActiveTimer } from "../types";

export interface UiSlice {
  activeTimer: ActiveTimer | null;
  activeTab: "planner" | "leaderboard" | "mom";
  isCreateModalOpen: boolean;
  setTheme: (theme: "light" | "dark") => void;
  setActiveTimer: (timer: ActiveTimer | null) => void;
  setActiveTab: (tab: "planner" | "leaderboard" | "mom") => void;
  setIsCreateModalOpen: (open: boolean) => void;
}

export interface ProfileSlice {
  profile: UserProfile | null;
  smtp: SmtpConfig | null;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  signIn: (email: string, name: string, addToast: (msg: string, type: string) => void) => Promise<void>;
  logout: (addToast: (msg: string, type: string) => void) => Promise<void>;
  toggleNotifications: (enabled: boolean, addToast: (msg: string, type: string) => void) => Promise<void>;
  toggleDarkMode: (enabled: boolean, addToast: (msg: string, type: string) => void) => Promise<void>;
  saveSmtp: (config: SmtpConfig, addToast: (msg: string, type: string) => void) => Promise<void>;
  updateLeaderboardEntries: (streak: number, name: string) => void;
}

export interface ScheduleSlice {
  schedules: Schedule[];
  createSchedule: (scheduleData: Omit<Schedule, "id" | "createdAt">, addToast: (msg: string, type: string) => void) => Promise<void>;
  deleteSchedule: (id: string, addToast: (msg: string, type: string) => void) => Promise<void>;
}

export interface LogSlice {
  logs: TaskLog[];
  emailLogs: EmailLog[];
  init: (addToast: (msg: string, type: string) => void) => Promise<void>;
  logTaskEffort: (
    scheduleId: string,
    date: string,
    completed: boolean,
    durationLogged: number,
    durationRequired: number,
    addToast: (msg: string, type: string) => void
  ) => Promise<void>;
  forceNag: (addToast: (msg: string, type: string) => void) => Promise<{ success: boolean; nagMessage?: string; subject?: string }>;
  forceRollover: (addToast: (msg: string, type: string) => void) => Promise<{ rolledOverTasksCount: number; streakResetOccurred: boolean; currentStreak: number }>;
  runLocalDayRollover: (
    currProfile: UserProfile,
    currSchedules: Schedule[],
    currLogs: TaskLog[],
    currEmailLogs: EmailLog[],
    addToast: (msg: string, type: string) => void
  ) => void;
}

export type MomState = UiSlice & ProfileSlice & ScheduleSlice & LogSlice;
