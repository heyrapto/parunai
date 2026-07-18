import { StateCreator } from "zustand";
import { MomState, ProfileSlice } from "./types";
import { playSound } from "../utils/audio";
import {
  DEFAULT_SCHEDULES,
  DEFAULT_LOGS,
  DEFAULT_EMAIL_LOGS,
  syncLocalAndState,
} from "./helpers";
import { LeaderboardEntry, UserProfile } from "../types";

export const createProfileSlice: StateCreator<MomState, [], [], ProfileSlice> = (set, get) => ({
  profile: null,
  smtp: null,
  leaderboard: [],
  loading: true,

  updateLeaderboardEntries: (streak: number, name: string) => {
    const defaultLeaderboard: LeaderboardEntry[] = [
      { rank: 1, name: "Cousin Timmy", streak: 210, avatar: "👦", achievement: "PhD in Calculus & CEO of 3 Startups" },
      { rank: 2, name: "Productive Patty", streak: 84, avatar: "👧", achievement: "Perfect 5 AM Club Member" },
      { rank: 3, name: "Workaholic Walter", streak: 45, avatar: "👨", achievement: "Logged 12 hours of deep work daily" },
      { rank: 4, name: name, streak: streak, avatar: "🤦", achievement: "Your Mother's Favorite Project", isCurrentUser: true },
      { rank: 5, name: "Procrastinator Paul", streak: 2, avatar: "🤡", achievement: "Struggles to drink water daily" }
    ];

    defaultLeaderboard.sort((a, b) => b.streak - a.streak);
    defaultLeaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });
    set({ leaderboard: defaultLeaderboard });
  },

  signIn: async (email: string, name: string, addToast: (msg: string, type: string) => void) => {
    const targetEmail = email.trim().toLowerCase();
    const targetName = name.trim() || "Lazy Child";

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, name: targetName })
      });

      if (res.ok) {
        const { profile } = await res.json();
        if (profile) {
          const [schedulesRes, logsRes, emailLogsRes, leaderboardRes] = await Promise.all([
            fetch("/api/schedules").then(r => r.json()).catch(() => ({ schedules: [] })),
            fetch("/api/logs").then(r => r.json()).catch(() => ({ logs: [] })),
            fetch("/api/mom/sent-logs").then(r => r.json()).catch(() => ({ emailLogs: [] })),
            fetch("/api/leaderboard").then(r => r.json()).catch(() => ({ leaderboard: [] }))
          ]);

          const schedules = schedulesRes.schedules?.length ? schedulesRes.schedules : DEFAULT_SCHEDULES;
          const logs = logsRes.logs?.length ? logsRes.logs : DEFAULT_LOGS;
          const emailLogs = emailLogsRes.emailLogs?.length ? emailLogsRes.emailLogs : DEFAULT_EMAIL_LOGS;
          const leaderboard = leaderboardRes.leaderboard || [];

          syncLocalAndState(set, {
            profile,
            schedules,
            logs,
            emailLogs,
            leaderboard
          });

          get().setTheme(profile.darkModeEnabled ? "dark" : "light");
          get().runLocalDayRollover(profile, schedules, logs, emailLogs, addToast);

          playSound('start');
          addToast("Successfully authenticated & loaded!", "success");
          return;
        }
      }
    } catch (err) {
      console.error("Backend login failed, using local mode:", err);
    }

    // Offline login fallback
    const localProfile: UserProfile = {
      email: targetEmail,
      name: targetName,
      streak: 0,
      lastActiveDate: new Date().toISOString().split("T")[0]
    };

    const localSchedules = localStorage.getItem("mom_schedules") ? JSON.parse(localStorage.getItem("mom_schedules")!) : DEFAULT_SCHEDULES;
    const localLogs = localStorage.getItem("mom_logs") ? JSON.parse(localStorage.getItem("mom_logs")!) : DEFAULT_LOGS;
    const localEmailLogs = localStorage.getItem("mom_email_logs") ? JSON.parse(localStorage.getItem("mom_email_logs")!) : DEFAULT_EMAIL_LOGS;

    syncLocalAndState(set, {
      profile: localProfile,
      schedules: localSchedules,
      logs: localLogs,
      emailLogs: localEmailLogs,
    });

    get().updateLeaderboardEntries(0, targetName);
    playSound('start');
    addToast("Successfully logged in locally!", "success");

    get().runLocalDayRollover(localProfile, localSchedules, localLogs, localEmailLogs, addToast);
  },

  logout: async (addToast: (msg: string, type: string) => void) => {
    if (!window.confirm("Are you sure you want to log out? All your local data is preserved in your browser, but you won't see it until you log in again.")) return;

    try {
      await fetch("/api/session/logout", { method: "POST" });
    } catch (err) {
      console.error("Backend logout failed", err);
    }

    set({
      profile: null,
      activeTimer: null,
    });
    localStorage.removeItem("mom_profile");
    addToast("Logged out.", "info");
  },

  toggleNotifications: async (enabled: boolean, addToast: (msg: string, type: string) => void) => {
    const profile = get().profile;
    if (!profile) return;

    const updatedProfile = { ...profile, notificationsEnabled: enabled };
    syncLocalAndState(set, { profile: updatedProfile });

    addToast(enabled ? "Mom's email alerts are active! Prepare yourself. 👩" : "Mom's email alerts silenced. Enjoy your peace... 🕊️", "info");

    try {
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          name: profile.name,
          notificationsEnabled: enabled
        })
      });
    } catch (err) {
      console.log("Silent backend sync skipped:", err);
    }
  },

  toggleDarkMode: async (enabled: boolean, addToast: (msg: string, type: string) => void) => {
    const profile = get().profile;
    if (!profile) return;

    const updatedProfile = { ...profile, darkModeEnabled: enabled };
    syncLocalAndState(set, { profile: updatedProfile });
    get().setTheme(enabled ? "dark" : "light");

    addToast(enabled ? "Dark mode activated. Lights out!" : "Light mode activated.", "info");

    try {
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          name: profile.name,
          darkModeEnabled: enabled
        })
      });
    } catch (err) {
      console.log("Silent backend sync skipped:", err);
    }
  },

  saveSmtp: async (config, addToast: (msg: string, type: string) => void) => {
    syncLocalAndState(set, { smtp: config });
    addToast("SMTP Mail config updated successfully!", "success");

    try {
      await fetch("/api/mom/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
    } catch (err) {
      console.error("Failed to save SMTP config to server", err);
    }
  }
});
