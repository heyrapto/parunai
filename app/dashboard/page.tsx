"use client";

import { RefreshCw, Sparkles, ShieldCheck, AlertTriangle, Flame, Calendar, Trophy, Settings, LogOut, XCircle, Pause, Play } from "lucide-react";
import { Schedule } from "motion";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { CreateScheduleModal } from "../components/CreateScheduleModal";
import { Leaderboard } from "../components/Leaderboard";
import { MomSettings } from "../components/MomSettings";
import { TimetableGrid } from "../components/TimetableGrid";
import { useToast } from "../components/Toast";
import { useTheme } from "../hooks/useTheme";
import { useMomStore } from "../store/useMomStore";
import { TaskLog, EmailLog } from "../types";
import { playSound } from "../utils/audio";

// Initial static mock database configurations
const DEFAULT_PROFILE = {
  email: "kalejaiyecaleb@gmail.com",
  name: "Lazy Child",
  streak: 0,
  lastActiveDate: null
};

const DEFAULT_SCHEDULES: Schedule[] = [
  {
    id: "schedule_1",
    title: "Code Python everyday",
    description: "Must stay sharp with Python scripting!",
    category: "Coding",
    recurrence: "daily",
    durationMinutes: 60,
    startDate: "2026-07-15",
    createdAt: new Date().toISOString()
  },
  {
    id: "schedule_2",
    title: "Solve Math Problems",
    description: "Cousin Timmy solves Calculus in his sleep. I must do algebra.",
    category: "Math",
    recurrence: "weekly",
    weeklyDays: [1, 3, 5], // Mon, Wed, Fri
    durationMinutes: 45,
    startDate: "2026-07-15",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_LOGS: TaskLog[] = [
  {
    id: "schedule_1_2026-07-15",
    scheduleId: "schedule_1",
    date: "2026-07-15",
    completed: true,
    durationRequired: 60,
    durationLogged: 60,
    rolledOver: false,
    rolledOverToNextDay: false
  },
  {
    id: "schedule_2_2026-07-15",
    scheduleId: "schedule_2",
    date: "2026-07-15",
    completed: true,
    durationRequired: 45,
    durationLogged: 45,
    rolledOver: false,
    rolledOverToNextDay: false
  }
];

const DEFAULT_EMAIL_LOGS: EmailLog[] = [
  {
    id: "email_welcome",
    timestamp: new Date().toISOString(),
    subject: "Your mother is watching you now.",
    body: "Son, I heard you want to be productive. Don't make me regret supporting you. Finish your schedules, or feel my wrath. Little Timmy already has a 210-day streak! Love, Mom.",
    type: "test"
  }
];

// Helper to determine if a schedule was active on a given date (YYYY-MM-DD)
const isScheduleActiveOnDate = (schedule: Schedule, dateStr: string): boolean => {
  if (schedule.startDate > dateStr) return false;
  if (schedule.endDate && schedule.endDate < dateStr) return false;

  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay(); // 0 is Sun, 1 is Mon, etc.

  if (schedule.recurrence === "daily") {
    return true;
  } else if (schedule.recurrence === "weekly") {
    return schedule.weeklyDays ? schedule.weeklyDays.includes(dayOfWeek) : false;
  } else if (schedule.recurrence === "monthly") {
    const dayOfMonth = date.getDate();
    return schedule.monthlyDay ? schedule.monthlyDay === dayOfMonth : false;
  }
  return false;
};

// Generate list of dates between two dates inclusive
const getDatesBetween = (startDateStr: string, endDateStr: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(endDateStr + "T00:00:00");
  const current = new Date(start);

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export default function Dashboard() {
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();

  // Selected state and actions from the Zustand store
  const {
    profile,
    schedules,
    logs,
    emailLogs,
    smtp,
    leaderboard,
    loading,
    activeTimer,
    activeTab,
    isCreateModalOpen,
    setActiveTimer,
    setActiveTab,
    setIsCreateModalOpen,
    init,
    signIn,
    logout,
    createSchedule,
    deleteSchedule,
    logTaskEffort,
    toggleNotifications,
    toggleDarkMode,
    forceNag,
    forceRollover,
  } = useMomStore();

  // Auth Inputs (local UI state only)
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  // Initialize and sync store on mount
  useEffect(() => {
    init(addToast);
  }, [init]);

  // Sync Timer countdown in background
  useEffect(() => {
    let intervalId: any = null;
    if (activeTimer && activeTimer.isRunning) {
      intervalId = setInterval(() => {
        const current = useMomStore.getState().activeTimer;
        if (!current) {
          clearInterval(intervalId);
          return;
        }
        if (current.secondsRemaining <= 1) {
          clearInterval(intervalId);
          handleTimerComplete(current.scheduleId, current.date, Math.ceil(current.totalSeconds / 60));
        } else {
          setActiveTimer({
            ...current,
            secondsRemaining: current.secondsRemaining - 1
          });
        }
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTimer?.isRunning]);

  // Auth Sign-In handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) return;

    setSigningIn(true);
    await signIn(authEmail, authName, addToast);
    setSigningIn(false);
  };

  // Logout handler
  const handleLogout = () => {
    logout(addToast);
  };

  // Create Goal Schedule
  const handleCreateSchedule = (newSched: any) => {
    createSchedule(newSched, addToast);
  };

  // Delete Goal Schedule
  const handleDeleteSchedule = (id: string) => {
    deleteSchedule(id, addToast);
  };

  // Log Task Effort manually or via buttons
  const handleLogTask = (
    scheduleId: string,
    date: string,
    completed: boolean,
    durationLogged: number,
    durationRequired: number
  ) => {
    logTaskEffort(scheduleId, date, completed, durationLogged, durationRequired, addToast);
  };

  // Timer Handlers passed into selected task card
  const handleStartTimer = (scheduleId: string, scheduleTitle: string, date: string, durationMinutes: number) => {
    setActiveTimer({
      scheduleId,
      scheduleTitle,
      date,
      totalSeconds: durationMinutes * 60,
      secondsRemaining: durationMinutes * 60,
      isRunning: true
    });
    playSound('start');
    addToast(`Countdown started for "${scheduleTitle}". Stay focused! 🔌`, "info");
  };

  const handlePauseTimer = () => {
    if (activeTimer) {
      setActiveTimer({ ...activeTimer, isRunning: false });
      addToast("Timer paused.", "info");
    }
  };

  const handleResumeTimer = () => {
    if (activeTimer) {
      setActiveTimer({ ...activeTimer, isRunning: true });
      playSound('start');
      addToast("Timer resumed.", "info");
    }
  };

  const handleCancelTimer = () => {
    setActiveTimer(null);
    addToast("Timer cancelled.", "info");
  };

  const handleTimerComplete = (scheduleId: string, date: string, minsLogged: number) => {
    playSound('complete');
    addToast(`⏱️ Countdown session ended! Logged ${minsLogged} minutes!`, "success");

    const sched = schedules.find(s => s.id === scheduleId);
    if (!sched) return;

    const logId = `${scheduleId}_${date}`;
    const log = logs.find(l => l.id === logId);
    const durationRequired = log ? log.durationRequired : sched.durationMinutes;
    const oldDurationLogged = log ? log.durationLogged : 0;
    
    const newLogged = oldDurationLogged + minsLogged;
    const completed = newLogged >= durationRequired;

    logTaskEffort(scheduleId, date, completed, newLogged, durationRequired, addToast);
    setActiveTimer(null);
  };

  // Toggle Email Notifications
  const handleToggleNotifications = (enabled: boolean) => {
    toggleNotifications(enabled, addToast);
  };

  // Toggle Dark Mode Theme
  const handleToggleDarkMode = (enabled: boolean) => {
    toggleDarkMode(enabled, addToast);
  };

  // Force Mom Nag scolding message
  const handleForceNag = async () => {
    return await forceNag(addToast);
  };

  // Mock Rollover simulation
  const handleForceRollover = async () => {
    return await forceRollover(addToast);
  };

  // Time formatter MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-8 h-8 animate-spin text-foreground mb-3" />
        <span className="font-display font-black text-sm tracking-tight">Syncing calendar records...</span>
      </div>
    );
  }

  // Render Sign-In Page if no active user profile
  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-neutral-100 border border-neutral-200" />
        <div className="absolute -right-16 -bottom-16 w-60 h-60 rounded-full bg-neutral-100 border border-neutral-200" />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, rotate: -1 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className="w-full max-w-md bg-white border-4 border-black p-5 sm:p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center relative z-10"
        >
          <div className="w-16 h-16 bg-black text-white border-4 border-black rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
            <span className="text-3xl">👩</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight mb-2 uppercase italic">
            MOM PRODUCTIVITY
          </h2>
          <p className="text-neutral-500 text-xs px-1 sm:px-2 mb-6 leading-relaxed">
            Your mother is watching you now. Setup daily goals, log your active work, and stay productive. If you miss a task, she will roll over hours to tomorrow and scold you offline!
          </p>

          <form onSubmit={handleSignIn} className="space-y-4 text-left">
            <div>
              <label className="block text-2xs font-black uppercase tracking-wider mb-1">
                Your Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full rounded-xl border-4 border-black px-3 py-2 outline-none font-bold text-sm bg-neutral-50 focus:bg-white focus:shadow-[2px_2px_0px_0px_#000] transition-all"
              />
            </div>

            <div>
              <label className="block text-2xs font-black uppercase tracking-wider mb-1">
                Your Preferred Name
              </label>
              <input
                type="text"
                placeholder="Lazy Child (or your real name)"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                className="w-full rounded-xl border-4 border-black px-3 py-2 outline-none font-bold text-sm bg-neutral-50 focus:bg-white focus:shadow-[2px_2px_0px_0px_#000] transition-all"
              />
            </div>

            <div className="pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-3.5 rounded-2xl border-4 border-black bg-black text-white hover:bg-neutral-900 text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {signingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Enter Mom's House
                  </>
                )}
              </motion.button>
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-4 border-black border-dashed" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase">
              <span className="bg-white px-3 border-4 border-black rounded-lg uppercase font-black">OR ENTER QUICKLY</span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setAuthEmail("kalejaiyecaleb@gmail.com");
              setAuthName("Caleb");
              addToast("Google credentials simulated! Press 'Enter Mom's House'.", "info");
            }}
            className="w-full py-3 rounded-2xl border-4 border-black bg-white text-black hover:bg-neutral-50 text-xs font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <ShieldCheck className="w-4 h-4 text-green-600" />
            Auto-Fill Simulated Profile
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-16 relative">
      <div className="bg-black text-amber-300 py-2.5 px-4 border-b-4 border-black text-center text-2xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Finish your timetables! Mom is calculating failures & penalties!
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-4 mt-6">
        <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 rounded-3xl border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-black border-4 border-black text-white flex items-center justify-center font-display font-black text-xl rotate-3 shrink-0">
              👩
            </div>
            <div className="min-w-0">
              <span className="text-3xs font-extrabold font-mono text-neutral-400 block uppercase leading-none mb-1">
                Active Ward
              </span>
              <h2 className="font-display font-black text-sm sm:text-base tracking-tight leading-none flex items-center flex-wrap gap-1.5">
                <span className="truncate">{profile.name}</span>
                <span className="text-3xs bg-neutral-100 border-2 border-black px-2 py-0.5 rounded-full text-neutral-500 font-mono truncate max-w-[140px] sm:max-w-none">
                  {profile.email}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-orange-100 text-orange-800 border-4 border-orange-500 px-3 py-1.5 rounded-2xl shadow-[2px_2px_0px_0px_#f97316] shrink-0">
              <Flame className="w-4 h-4 animate-pulse fill-orange-500 text-orange-500" />
              <span className="font-mono font-black text-xs">{profile.streak} DAY STREAK</span>
            </div>

            <div className="flex items-center border-4 border-black p-0.5 rounded-2xl bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-0">
              <button
                onClick={() => setActiveTab("planner")}
                className={`p-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === "planner" ? "bg-black text-white" : "hover:bg-neutral-50"
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="hidden min-[420px]:inline">Timetables</span>
                <span className="inline min-[420px]:hidden">Goals</span>
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`p-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === "leaderboard" ? "bg-black text-white" : "hover:bg-neutral-50"
                }`}
              >
                <Trophy className="w-4 h-4 shrink-0" />
                <span className="hidden min-[420px]:inline">Leaderboard</span>
                <span className="inline min-[420px]:hidden">Ranks</span>
              </button>
              <button
                onClick={() => setActiveTab("mom")}
                className={`p-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === "mom" ? "bg-black text-white" : "hover:bg-neutral-50"
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span className="hidden min-[420px]:inline">Mom's Room</span>
                <span className="inline min-[420px]:hidden">Mom</span>
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-2xl border-4 border-black p-2 bg-white hover:bg-red-50 text-red-600 cursor-pointer active:translate-y-px transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === "planner" && (
              <motion.div
                key="planner-tab"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] gap-4">
                  <div>
                    <h3 className="font-display font-black text-xl tracking-tight mb-1 flex items-center gap-1.5 uppercase italic">
                      <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" />
                      YOUR RECURRING DAILY SCHEDULE
                    </h3>
                    <p className="text-xs text-neutral-500 font-sans leading-relaxed max-w-xl">
                      Create schedules, click on entries to log daily minutes, or activate countdown timers to study 100% offline and block distractions.
                    </p>
                  </div>
                  
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCreateModalOpen(true)}
                    className="py-3 px-5 rounded-2xl border-4 border-black bg-black text-white font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-900 active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer shrink-0"
                  >
                    + Add Timetable Goal
                  </motion.button>
                </div>

                <TimetableGrid
                  schedules={schedules}
                  logs={logs}
                  onLogTask={handleLogTask}
                  onDeleteSchedule={handleDeleteSchedule}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  activeTimer={activeTimer}
                  onStartTimer={handleStartTimer}
                  onPauseTimer={handlePauseTimer}
                  onResumeTimer={handleResumeTimer}
                  onCancelTimer={handleCancelTimer}
                />
              </motion.div>
            )}

            {activeTab === "leaderboard" && (
              <motion.div
                key="leaderboard-tab"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
              >
                <Leaderboard leaderboard={leaderboard} profile={profile} />
              </motion.div>
            )}

            {activeTab === "mom" && (
              <motion.div
                key="mom-tab"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
              >
                <MomSettings
                  notificationsEnabled={profile?.notificationsEnabled ?? true}
                  darkModeEnabled={profile?.darkModeEnabled ?? false}
                  onToggleNotifications={handleToggleNotifications}
                  onToggleDarkMode={handleToggleDarkMode}
                  emailLogs={emailLogs}
                  onForceNag={handleForceNag}
                  onForceRollover={handleForceRollover}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Persistent Global Floating Timer Widget */}
      <AnimatePresence>
        {activeTimer && (
          <motion.div
            initial={{ y: 80, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 80, scale: 0.9, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl border-4 border-black bg-amber-50 text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm w-[90vw] flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold uppercase text-neutral-500 tracking-wider">
                🔌 Offline Study Session
              </span>
              <button
                onClick={handleCancelTimer}
                className="p-1 rounded-lg border-2 border-black bg-white hover:bg-neutral-100 text-red-500 cursor-pointer"
                title="Discard Timer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white rounded-xl border-4 border-black flex items-center justify-center font-mono font-black text-xl select-none">
                ⏱️
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs truncate leading-tight">
                  {activeTimer.scheduleTitle}
                </h4>
                <p className="text-3xs text-neutral-500 leading-tight">
                  Keep working! Screen locked for deep focus.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1.5 border-t-2 border-dashed border-black/20">
              <div className="font-mono font-black text-2xl tracking-tight leading-none bg-black text-white px-2.5 py-1 rounded-xl border-2 border-black">
                {formatTime(activeTimer.secondsRemaining)}
              </div>

              <div className="flex gap-2">
                {activeTimer.isRunning ? (
                  <button
                    onClick={handlePauseTimer}
                    className="p-2 rounded-xl border-3 border-black bg-white text-black hover:bg-neutral-100 cursor-pointer flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-px"
                    title="Pause Session"
                  >
                    <Pause className="w-4 h-4 fill-black" />
                  </button>
                ) : (
                  <button
                    onClick={handleResumeTimer}
                    className="p-2 rounded-xl border-3 border-black bg-black text-white hover:bg-neutral-900 cursor-pointer flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,0.15)] active:translate-y-px"
                    title="Resume Session"
                  >
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                )}
                
                <button
                  onClick={() => {
                    const elapsedMins = Math.ceil((activeTimer.totalSeconds - activeTimer.secondsRemaining) / 60);
                    if (elapsedMins > 0) {
                      if (window.confirm(`Stop timer now and claim ${elapsedMins} logged minutes?`)) {
                        handleTimerComplete(activeTimer.scheduleId, activeTimer.date, elapsedMins);
                      }
                    } else {
                      handleCancelTimer();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border-3 border-black bg-white text-black hover:bg-neutral-100 font-black text-2xs uppercase tracking-wider cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-y-px"
                >
                  Save & End
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSchedule}
      />
    </div>
  );
}
