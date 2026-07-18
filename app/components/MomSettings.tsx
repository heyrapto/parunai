"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Play, RefreshCw, Send, CheckCircle2, ChevronRight, AlertTriangle, EyeOff, Sun, Moon, Bell } from "lucide-react";
import { EmailLog } from "../types";

interface MomSettingsProps {
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
  onToggleDarkMode: (enabled: boolean) => void;
  emailLogs: EmailLog[];
  onForceNag: () => Promise<{ nagMessage?: string; subject?: string; success: boolean }>;
  onForceRollover: () => Promise<{ rolledOverTasksCount: number; streakResetOccurred: boolean; currentStreak: number }>;
}

export const MomSettings: React.FC<MomSettingsProps> = ({
  notificationsEnabled,
  darkModeEnabled,
  onToggleNotifications,
  onToggleDarkMode,
  emailLogs,
  onForceNag,
  onForceRollover
}) => {
  // Loaders
  const [nagging, setNagging] = useState(false);
  const [rolling, setRolling] = useState(false);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const handleForceNag = async () => {
    setNagging(true);
    const result = await onForceNag();
    setNagging(false);
    if (result.success && result.nagMessage) {
      setSelectedLog({
        id: "temp_nag",
        timestamp: new Date().toISOString(),
        subject: result.subject || "⚠️ URGENT DISAPPOINTMENT",
        body: result.nagMessage,
        type: "upcoming_warning"
      });
    }
  };

  const handleForceRollover = async () => {
    if (!window.confirm("Are you sure you want to mock a next-day rollover? This will advance time, mark any uncompleted tasks from today as FAILED with a Red X, roll over missed hours to tomorrow, and reset your streak to 0 if anything was left incomplete!")) {
      return;
    }
    setRolling(true);
    await onForceRollover();
    setRolling(false);
  };

  return (
    <div className="space-y-6">
      {/* Simulation & testing center */}
      <div className="p-6 rounded-3xl border-4 border-black dark:border-white bg-amber-50 dark:bg-amber-950/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] text-black dark:text-white">
        <h3 className="font-display text-xl font-black tracking-tight mb-2 flex items-center gap-2 uppercase italic text-amber-900 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
          MOM'S SIMULATION COMMAND CENTER
        </h3>
        <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mb-4 font-sans max-w-2xl leading-relaxed">
          Schedules can take a full day to expire. Use these instant controls to test Mom's "harsh penalty" features right now! Watch how she scolds you via Gemini, marks incomplete items, and doubles your workload for the next day.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Button 1: Force Nag */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleForceNag}
            disabled={nagging}
            className="flex items-center justify-between p-4 rounded-2xl border-4 border-black dark:border-white bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] cursor-pointer disabled:opacity-50 text-left"
          >
            <div className="space-y-0.5">
              <span className="text-sm font-black uppercase tracking-tight block">👩 Force Mom to Nag Me</span>
              <span className="text-2xs text-neutral-500 dark:text-neutral-400 font-sans block">Runs AI scolding check on today's pending tasks</span>
            </div>
            {nagging ? (
              <RefreshCw className="w-5 h-5 animate-spin shrink-0 text-amber-600" />
            ) : (
              <Play className="w-5 h-5 shrink-0 text-amber-600 fill-amber-600" />
            )}
          </motion.button>

          {/* Button 2: Force Rollover */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleForceRollover}
            disabled={rolling}
            className="flex items-center justify-between p-4 rounded-2xl border-4 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-900 dark:hover:bg-neutral-100 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] dark:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] cursor-pointer disabled:opacity-50 text-left"
          >
            <div className="space-y-0.5">
              <span className="text-sm font-black uppercase tracking-tight block text-amber-400 dark:text-amber-600">🕒 Mock Next-Day Rollover</span>
              <span className="text-2xs text-neutral-400 dark:text-neutral-600 font-sans block">Converts missed items into Red Xs and doubles tomorrow's hours!</span>
            </div>
            {rolling ? (
              <RefreshCw className="w-5 h-5 animate-spin shrink-0 text-amber-400 dark:text-amber-600" />
            ) : (
              <Send className="w-5 h-5 shrink-0 text-amber-400 dark:text-amber-600" />
            )}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Config Toggle card */}
        <div className="p-6 rounded-3xl border-4 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] text-black dark:text-white">
          <h3 className="font-display text-xl font-black tracking-tight mb-2 flex items-center gap-2 uppercase italic">
            <Bell className="w-5 h-5 text-amber-500" />
            MOM'S ALERT & VISUAL CONTROLS
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mb-6 leading-relaxed">
            Customize how Mom monitors your attitude. Enable backend notifications or customize her room lighting layout.
          </p>

          <div className="space-y-4">
            {/* Toggle 1: Email Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl border-4 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800">
              <div className="space-y-1 pr-4">
                <label className="text-sm font-black uppercase tracking-tight block">
                  Email Notifications
                </label>
                <span className="text-2xs text-neutral-500 dark:text-neutral-400 font-sans block">
                  Receive persistent tough-love notifications on missed tasks.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onToggleNotifications(!notificationsEnabled)}
                className={`w-14 h-8 rounded-full border-4 border-black p-0.5 transition-colors cursor-pointer flex items-center shrink-0 ${
                  notificationsEnabled ? "bg-green-400 justify-end" : "bg-neutral-300 dark:bg-neutral-600 justify-start"
                }`}
              >
                <motion.div
                  layout
                  className="w-5 h-5 rounded-full bg-white border-2 border-black"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Toggle 2: Theme Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl border-4 border-black dark:border-white bg-neutral-50 dark:bg-neutral-800">
              <div className="space-y-1 pr-4">
                <label className="text-sm font-black uppercase tracking-tight block flex items-center gap-1.5">
                  {darkModeEnabled ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  Theme Mode
                </label>
                <span className="text-2xs text-neutral-500 dark:text-neutral-400 font-sans block">
                  Switch the overall dashboard look between high-contrast Light and Dark mode.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onToggleDarkMode(!darkModeEnabled)}
                className={`w-14 h-8 rounded-full border-4 border-black p-0.5 transition-colors cursor-pointer flex items-center shrink-0 ${
                  darkModeEnabled ? "bg-amber-400 justify-end" : "bg-neutral-300 dark:bg-neutral-600 justify-start"
                }`}
              >
                <motion.div
                  layout
                  className="w-5 h-5 rounded-full bg-white border-2 border-black"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Outbox Log List */}
        <div className="p-6 rounded-3xl border-4 border-black dark:border-white bg-white dark:bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] text-black dark:text-white flex flex-col h-[400px]">
          <h3 className="font-display text-xl font-black tracking-tight mb-2 flex items-center gap-2 shrink-0 uppercase italic">
            <Mail className="w-5 h-5 text-amber-500" />
            MOM'S ANGRY OUTBOX LOGS
          </h3>
          <p className="text-2xs text-neutral-500 dark:text-neutral-400 font-sans mb-3 leading-relaxed shrink-0">
            A secure record of Mom's persistent alerts, reminders, and harsh penalties. Click on an alert log to read the full nagging content!
          </p>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 scrollbar">
            {emailLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="w-10 h-10 text-neutral-300 mb-2" />
                <span className="text-xs font-bold text-neutral-400 block font-sans">No outbox logs yet!</span>
                <span className="text-2xs text-neutral-400 block font-sans">Mom is silent for now...</span>
              </div>
            ) : (
              emailLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3 rounded-xl border-4 border-black dark:border-white bg-white dark:bg-neutral-800 hover:bg-amber-50/20 dark:hover:bg-neutral-700 cursor-pointer transition-all flex items-center justify-between text-left group`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      {/* Category Label */}
                      <span className={`text-3xs font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono ${
                        log.type === "missed_rollover" ? "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400" :
                        log.type === "upcoming_warning" ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400" :
                        "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                      }`}>
                        {log.type === "missed_rollover" ? "PENALTY 😡" :
                         log.type === "upcoming_warning" ? "WARNING ⚠️" : "ALERT 👩"}
                      </span>
                      <span className="text-3xs text-neutral-400 dark:text-neutral-500 font-mono font-medium">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs leading-snug font-sans group-hover:underline text-black dark:text-neutral-100">
                      {log.subject}
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, rotate: 1 }}
              animate={{ scale: 1, opacity: 1, rotate: 0, transition: { type: "spring", stiffness: 350, damping: 22 } }}
              exit={{ scale: 0.95, opacity: 0, rotate: -1 }}
              className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-4 border-black dark:border-white bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] text-black dark:text-white scrollbar"
            >
              <div className="flex justify-between items-center border-b-4 border-black dark:border-white pb-3 mb-3">
                <div className="space-y-0.5 text-left">
                  <span className="text-3xs font-extrabold uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded font-mono">
                    EMAIL INBOX LOG
                  </span>
                  <h4 className="font-display font-black text-base uppercase italic">{selectedLog.subject}</h4>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg border-4 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
                >
                  <EyeOff className="w-4 h-4 text-black dark:text-white hover:text-white dark:hover:text-black" />
                </button>
              </div>

              <div className="p-4 bg-amber-50/50 dark:bg-neutral-800 rounded-2xl border-4 border-black dark:border-white text-left h-[220px] overflow-y-auto mb-4 scrollbar">
                <p className="font-sans text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 font-medium whitespace-pre-wrap italic">
                  "{selectedLog.body}"
                </p>
              </div>

              <div className="text-right">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 rounded-xl border-4 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-900 dark:hover:bg-neutral-100 font-black uppercase tracking-wider text-xs cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                >
                  Close Message
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
