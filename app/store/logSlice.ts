import { StateCreator } from "zustand";
import { MomState, LogSlice } from "./types";
import { playSound } from "../utils/audio";
import {
  DEFAULT_PROFILE,
  DEFAULT_SCHEDULES,
  DEFAULT_LOGS,
  DEFAULT_EMAIL_LOGS,
  isScheduleActiveOnDate,
  getDatesBetween,
  syncLocalAndState,
} from "./helpers";
import { EmailLog, TaskLog, UserProfile, Schedule } from "../types";

export const createLogSlice: StateCreator<MomState, [], [], LogSlice> = (set, get) => ({
  logs: [],
  emailLogs: [],

  init: async (addToast: (msg: string, type: string) => void) => {
    set({ loading: true });
    try {
      const sessionRes = await fetch("/api/session");
      if (sessionRes.ok) {
        const { profile } = await sessionRes.json();
        if (profile) {
          set({ profile });
          get().setTheme(profile.darkModeEnabled ? "dark" : "light");

          const [schedulesRes, logsRes, emailLogsRes, leaderboardRes] = await Promise.all([
            fetch("/api/schedules").then(res => res.json()).catch(() => ({ schedules: null })),
            fetch("/api/logs").then(res => res.json()).catch(() => ({ logs: null })),
            fetch("/api/mom/sent-logs").then(res => res.json()).catch(() => ({ emailLogs: null })),
            fetch("/api/leaderboard").then(res => res.json()).catch(() => ({ leaderboard: null }))
          ]);

          const schedules = schedulesRes.schedules || [];
          const logs = logsRes.logs || [];
          const emailLogs = emailLogsRes.emailLogs || [];
          const leaderboard = leaderboardRes.leaderboard || [];

          set({
            schedules,
            logs,
            emailLogs,
            leaderboard: leaderboard.length ? leaderboard : get().leaderboard
          });

          get().runLocalDayRollover(profile, schedules, logs, emailLogs, addToast);
          set({ loading: false });
          return;
        }
      }
    } catch (err) {
      console.error("Backend fetch initialization failed, falling back to localStorage:", err);
    }

    // Offline/local fallback
    try {
      const storedProfile = localStorage.getItem("mom_profile");
      const storedSchedules = localStorage.getItem("mom_schedules");
      const storedLogs = localStorage.getItem("mom_logs");
      const storedEmailLogs = localStorage.getItem("mom_email_logs");
      const storedSmtp = localStorage.getItem("mom_smtp");

      let currentProfile: UserProfile | null = null;
      if (storedProfile) {
        currentProfile = JSON.parse(storedProfile);
        set({ profile: currentProfile });
        get().setTheme(currentProfile?.darkModeEnabled ? "dark" : "light");
      }

      const currentSchedules = storedSchedules ? JSON.parse(storedSchedules) : DEFAULT_SCHEDULES;
      const currentLogs = storedLogs ? JSON.parse(storedLogs) : DEFAULT_LOGS;
      const currentEmailLogs = storedEmailLogs ? JSON.parse(storedEmailLogs) : DEFAULT_EMAIL_LOGS;
      const currentSmtp = storedSmtp ? JSON.parse(storedSmtp) : null;

      set({
        schedules: currentSchedules,
        logs: currentLogs,
        emailLogs: currentEmailLogs,
        smtp: currentSmtp,
      });

      get().updateLeaderboardEntries(currentProfile?.streak || 0, currentProfile?.name || "Lazy Child");

      if (currentProfile) {
        get().runLocalDayRollover(currentProfile, currentSchedules, currentLogs, currentEmailLogs, addToast);
      }
    } catch (err) {
      console.error("Local storage initialization failed:", err);
      addToast("Failed to load local offline records.", "error");
    } finally {
      set({ loading: false });
    }
  },

  logTaskEffort: async (
    scheduleId: string,
    date: string,
    completed: boolean,
    durationLogged: number,
    durationRequired: number,
    addToast: (msg: string, type: string) => void
  ) => {
    const logId = `${scheduleId}_${date}`;
    const existing = get().logs.find(l => l.id === logId);

    const newLog: TaskLog = {
      id: logId,
      scheduleId,
      date,
      completed,
      durationLogged,
      durationRequired,
      rolledOver: existing?.rolledOver ?? false,
      rolledOverToNextDay: existing?.rolledOverToNextDay ?? false
    };

    const updatedLogs = [...get().logs];
    const idx = updatedLogs.findIndex(l => l.id === logId);
    if (idx > -1) {
      updatedLogs[idx] = newLog;
    } else {
      updatedLogs.push(newLog);
    }

    syncLocalAndState(set, { logs: updatedLogs });

    if (completed) {
      playSound('achievement');
      addToast("Task complete! Mom is momentarily calm.", "success");

      const todayStr = new Date().toISOString().split("T")[0];
      const profile = get().profile;
      if (date === todayStr && profile) {
        const activeSchedules = get().schedules.filter(s => isScheduleActiveOnDate(s, todayStr));
        const allDone = activeSchedules.every(s => {
          const lId = `${s.id}_${todayStr}`;
          const currentItem = (lId === logId) ? newLog : updatedLogs.find(item => item.id === lId);
          return currentItem && currentItem.completed;
        });

        if (allDone && activeSchedules.length > 0) {
          const updatedProfile = { ...profile, streak: profile.streak + 1 };
          syncLocalAndState(set, { profile: updatedProfile });
          get().updateLeaderboardEntries(updatedProfile.streak, updatedProfile.name);
          playSound('achievement');
          addToast("🌟 ALL DAILY GOALS COMPLETE! Streak increased!", "success");

          try {
            fetch("/api/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: profile.email,
                name: profile.name,
                streak: updatedProfile.streak
              })
            });
          } catch (err) {
            console.log("Streak sync postponed:", err);
          }
        }
      }
    } else {
      addToast("Task performance updated.", "info");
    }

    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLog)
      });
    } catch (err) {
      console.log("Server log sync deferred (offline):", err);
    }
  },

  forceNag: async (addToast: (msg: string, type: string) => void) => {
    const profile = get().profile;
    if (!profile) return { success: false };

    const todayStr = new Date().toISOString().split("T")[0];
    const activeSchedules = get().schedules.filter(s => isScheduleActiveOnDate(s, todayStr));
    const pending = activeSchedules.filter(s => {
      const lId = `${s.id}_${todayStr}`;
      const log = get().logs.find(l => l.id === lId);
      return !log || !log.completed;
    });

    if (pending.length === 0) {
      addToast("Mom is momentarily satisfied. No goals left to nag you about!", "info");
      return { success: false };
    }

    try {
      const res = await fetch("/api/mom/nag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todayDate: todayStr })
      });
      if (res.ok) {
        const data = await res.json();
        const emailLogsRes = await fetch("/api/mom/sent-logs");
        if (emailLogsRes.ok) {
          const { emailLogs } = await emailLogsRes.json();
          syncLocalAndState(set, { emailLogs });
        }
        playSound('fail');
        addToast(`Mom sent a real warning alert! Check Mom's Room.`, "mom");
        return {
          success: true,
          nagMessage: data.nagMessage,
          subject: data.subject
        };
      }
    } catch (err) {
      console.error("Backend nag call failed, using offline fallback:", err);
    }

    const targetSched = pending[Math.floor(Math.random() * pending.length)];
    const logId = `${targetSched.id}_${todayStr}`;
    const log = get().logs.find(l => l.id === logId);
    const reqMins = log ? log.durationRequired : targetSched.durationMinutes;

    const offlineNags = [
      `Listen to me, ${profile.name}. I didn't work 3 jobs and walk uphill both ways in the snow just for you to procrastinate on "${targetSched.title}"! Cousin Timmy already has a 210-day streak, coding 14 hours daily while studying at MIT. You? You've logged 0 minutes today. Zero! Go complete your ${reqMins} minutes now!`,
      `Are you sleeping again, ${profile.name}? The electricity is running, the internet bill is paid, and what are you doing? Staring at memes instead of doing your "${targetSched.title}"! Cousin Timmy just bought a house for his parents and codes in his sleep. Log your ${reqMins} minutes right now!`,
      `Extremely disappointed in you. Your daily task "${targetSched.title}" is still incomplete. Do you think success grows on trees? Timmy solved a Rubik's cube with his feet while building his third SaaS startup, and here you are procrastinating. Complete your ${reqMins} minutes or else!`,
      `Why are you playing video games? Your streak is at risk! "${targetSched.title}" is completely neglected. Cousin Timmy already finished his Calculus homework, gym session, and launched a rocket. If you don't log your ${reqMins} minutes, I am rolling it over with double penalty!`,
      `I called Timmy's mother today. She said Timmy runs 10 miles and codes in five languages before breakfast. Meanwhile, you can't even complete your ${reqMins} minutes of "${targetSched.title}". What a disgrace! Get off social media and work!`
    ];

    const message = offlineNags[Math.floor(Math.random() * offlineNags.length)];
    const subject = `⚠️ URGENT DISAPPOINTMENT: Complete your "${targetSched.title}"!`;

    const newEmail: EmailLog = {
      id: "email_" + Date.now(),
      timestamp: new Date().toISOString(),
      subject,
      body: message,
      type: "upcoming_warning"
    };

    const updatedEmailLogs = [newEmail, ...get().emailLogs];
    syncLocalAndState(set, { emailLogs: updatedEmailLogs });
    playSound('fail');

    addToast(`Mom sent an offline warning alert about "${targetSched.title}"!`, "mom");

    return {
      success: true,
      nagMessage: message,
      subject
    };
  },

  forceRollover: async (addToast: (msg: string, type: string) => void) => {
    const profile = get().profile;
    if (!profile) return { rolledOverTasksCount: 0, streakResetOccurred: false, currentStreak: 0 };
    
    addToast("Simulating a next-day rollover...", "info");
    const todayStr = new Date().toISOString().split("T")[0];

    try {
      const res = await fetch("/api/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todayDate: todayStr })
      });
      if (res.ok) {
        const data = await res.json();
        const [sessionRes, schedulesRes, logsRes, emailLogsRes, leaderboardRes] = await Promise.all([
          fetch("/api/session").then(r => r.json()),
          fetch("/api/schedules").then(r => r.json()),
          fetch("/api/logs").then(r => r.json()),
          fetch("/api/mom/sent-logs").then(r => r.json()),
          fetch("/api/leaderboard").then(r => r.json())
        ]);

        syncLocalAndState(set, {
          profile: sessionRes.profile,
          schedules: schedulesRes.schedules,
          logs: logsRes.logs,
          emailLogs: emailLogsRes.emailLogs,
          leaderboard: leaderboardRes.leaderboard
        });

        addToast("Rollover checked and synced with backend successfully!", "success");
        return {
          rolledOverTasksCount: data.rolledOverTasksCount,
          streakResetOccurred: data.streakResetOccurred,
          currentStreak: data.currentStreak
        };
      }
    } catch (err) {
      console.error("Backend rollover request failed, processing offline simulation:", err);
    }

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const pastDateStr = pastDate.toISOString().split("T")[0];

    const shiftedProfile = {
      ...profile,
      lastActiveDate: pastDateStr
    };

    get().runLocalDayRollover(shiftedProfile, get().schedules, get().logs, get().emailLogs, addToast);
    addToast("Mock Rollover processed! Missed tasks have doubled onto today.", "success");

    return {
      rolledOverTasksCount: 1,
      streakResetOccurred: true,
      currentStreak: 0
    };
  },

  runLocalDayRollover: (
    currProfile: UserProfile,
    currSchedules: Schedule[],
    currLogs: TaskLog[],
    currEmailLogs: EmailLog[],
    addToast: (msg: string, type: string) => void
  ) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const lastActive = currProfile.lastActiveDate;

    if (!lastActive) {
      const updatedProfile = { ...currProfile, lastActiveDate: todayStr };
      syncLocalAndState(set, { profile: updatedProfile });
      return;
    }

    if (lastActive >= todayStr) {
      return;
    }

    const datesToCheck = getDatesBetween(lastActive, todayStr);
    datesToCheck.pop();

    let rolledOverTasksCount = 0;
    let streakResetOccurred = false;
    const workingLogs = [...currLogs];
    const workingEmailLogs = [...currEmailLogs];
    let workingStreak = currProfile.streak;

    for (const dateStr of datesToCheck) {
      const activeSchedulesOnDate = currSchedules.filter(s => isScheduleActiveOnDate(s, dateStr));
      let allCompletedOnDate = true;

      for (const schedule of activeSchedulesOnDate) {
        const logId = `${schedule.id}_${dateStr}`;
        let log = workingLogs.find(l => l.id === logId);

        if (!log || !log.completed) {
          allCompletedOnDate = false;

          const durationRequired = log ? log.durationRequired : schedule.durationMinutes;
          const durationLogged = log ? log.durationLogged : 0;
          const missedMins = Math.max(0, durationRequired - durationLogged);

          if (!log) {
            log = {
              id: logId,
              scheduleId: schedule.id,
              date: dateStr,
              completed: false,
              durationRequired,
              durationLogged,
              rolledOver: false,
              rolledOverToNextDay: true
            };
            workingLogs.push(log);
          } else {
            log.completed = false;
            log.rolledOverToNextDay = true;
          }

          const datesRemaining = getDatesBetween(dateStr, todayStr);
          const nextDayDate = datesRemaining[1] || todayStr;
          const nextLogId = `${schedule.id}_${nextDayDate}`;
          const nextLog = workingLogs.find(l => l.id === nextLogId);

          if (nextLog) {
            nextLog.durationRequired += missedMins;
            nextLog.rolledOver = true;
          } else {
            workingLogs.push({
              id: nextLogId,
              scheduleId: schedule.id,
              date: nextDayDate,
              completed: false,
              durationRequired: schedule.durationMinutes + missedMins,
              durationLogged: 0,
              rolledOver: true,
              rolledOverToNextDay: false
            });
          }

          rolledOverTasksCount++;

          const emailSubject = `😡 FAILURE PENALTY: Rollover of ${missedMins} minutes applied!`;
          const emailBody = `Since you didn't finish "${schedule.title}" on ${dateStr}, your mother has officially rolled over your missed ${missedMins} minutes to tomorrow. You now have double work! Your streak is DEAD. Cousin Timmy is laughing.`;

          workingEmailLogs.unshift({
            id: `rollover_${Date.now()}_${schedule.id}`,
            timestamp: new Date().toISOString(),
            subject: emailSubject,
            body: emailBody,
            type: "missed_rollover"
          });
        }
      }

      if (activeSchedulesOnDate.length > 0) {
        if (allCompletedOnDate) {
          workingStreak++;
        } else {
          if (workingStreak > 0) {
            workingStreak = 0;
            streakResetOccurred = true;
          }
        }
      }
    }

    const updatedProfile = {
      ...currProfile,
      streak: workingStreak,
      lastActiveDate: todayStr
    };

    syncLocalAndState(set, {
      profile: updatedProfile,
      logs: workingLogs,
      emailLogs: workingEmailLogs
    });

    get().updateLeaderboardEntries(workingStreak, updatedProfile.name);

    if (rolledOverTasksCount > 0) {
      playSound('fail');
      addToast(`Mom applied ${rolledOverTasksCount} task penalty rollovers!`, "error");
    }
    if (streakResetOccurred) {
      addToast("MOM BROKE YOUR STREAK! Reset to 0 😡", "error");
    }
  }
});
