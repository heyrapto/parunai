"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, CheckCircle2, XCircle, ArrowRight, Plus, ChevronLeft, ChevronRight, BookOpen, AlertTriangle } from "lucide-react";
import { Schedule, TaskLog, ActiveTimer } from "../types";

interface TimetableGridProps {
  schedules: Schedule[];
  logs: TaskLog[];
  onLogTask: (scheduleId: string, date: string, completed: boolean, durationLogged: number, durationRequired: number) => void;
  onDeleteSchedule: (id: string) => void;
  onOpenCreateModal: () => void;
  activeTimer: ActiveTimer | null;
  onStartTimer: (scheduleId: string, scheduleTitle: string, date: string, durationMinutes: number) => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onCancelTimer: () => void;
}

const WEEK_DAYS_LABELS = [
  { label: "Monday", short: "Mon", val: 1 },
  { label: "Tuesday", short: "Tue", val: 2 },
  { label: "Wednesday", short: "Wed", val: 3 },
  { label: "Thursday", short: "Thu", val: 4 },
  { label: "Friday", short: "Fri", val: 5 },
  { label: "Saturday", short: "Sat", val: 6 },
  { label: "Sunday", short: "Sun", val: 0 }
];

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  schedules,
  logs,
  onLogTask,
  onDeleteSchedule,
  onOpenCreateModal,
  activeTimer,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onCancelTimer
}) => {
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly");
  const [customTimerMinutes, setCustomTimerMinutes] = useState(25);
  
  // Date states - Target fixed July 2026 as per local clock
  const [currentDate, setCurrentDate] = useState(new Date("2026-07-17"));
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<{ schedule: Schedule; date: string } | null>(null);

  // Helper to format YYYY-MM-DD
  const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Helper to check if schedule is active on a date
  const isScheduleActiveOnDate = (schedule: Schedule, dateStr: string): boolean => {
    if (schedule.startDate > dateStr) return false;
    if (schedule.endDate && schedule.endDate < dateStr) return false;

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 is Sun, 1 is Mon, etc.

    if (schedule.recurrence === "daily") {
      return true;
    } else if (schedule.recurrence === "weekly") {
      return schedule.weeklyDays ? schedule.weeklyDays.includes(dayOfWeek) : false;
    } else if (schedule.recurrence === "monthly") {
      return schedule.monthlyDay ? schedule.monthlyDay === date.getDate() : false;
    }
    return false;
  };

  // Find or calculate details for a schedule log on a specific date
  const getLogForSchedule = (schedule: Schedule, dateStr: string): TaskLog => {
    const logId = `${schedule.id}_${dateStr}`;
    const foundLog = logs.find(l => l.id === logId);

    if (foundLog) return foundLog;

    // Return virtual log if none exists in db yet
    return {
      id: logId,
      scheduleId: schedule.id,
      date: dateStr,
      completed: false,
      durationRequired: schedule.durationMinutes,
      durationLogged: 0,
      rolledOver: false,
      rolledOverToNextDay: false
    };
  };

  // Get start of the current week (Monday)
  const getStartOfWeek = (d: Date): Date => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentDate);

  // Generate 7 days of the week
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  // Calculate monthly grid dates
  const getMonthlyDays = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay(); // 0 is Sun
    
    // Adjust startDay for Monday start (0=Mon, 1=Tue, ..., 6=Sun)
    const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

    const grid: (Date | null)[] = [];
    
    // Add empty slots for days of previous month
    for (let i = 0; i < adjustedStartDay; i++) {
      grid.push(null);
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push(new Date(year, month, i));
    }
    
    return grid;
  };

  const monthlyGrid = getMonthlyDays(currentDate);

  // Handle task log updates (e.g. increase minutes, toggle completion)
  const handleUpdateDuration = async (sched: Schedule, dateStr: string, minutesToAdd: number) => {
    const log = getLogForSchedule(sched, dateStr);
    const newLogged = Math.min(log.durationRequired, log.durationLogged + minutesToAdd);
    const completed = newLogged >= log.durationRequired;
    await onLogTask(sched.id, dateStr, completed, newLogged, log.durationRequired);
  };

  const handleToggleComplete = async (sched: Schedule, dateStr: string) => {
    const log = getLogForSchedule(sched, dateStr);
    const completed = !log.completed;
    const newLogged = completed ? log.durationRequired : 0;
    await onLogTask(sched.id, dateStr, completed, newLogged, log.durationRequired);
  };

  const handlePrevRange = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "weekly") {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextRange = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "weekly") {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const todayStr = "2026-07-17"; // Grounded local time

  return (
    <div className="space-y-6">
      {/* View switcher and navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Toggle */}
        <div className="rounded-2xl border-4 border-black p-1 bg-white flex self-start shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <button
            onClick={() => setViewMode("weekly")}
            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight cursor-pointer transition-all ${
              viewMode === "weekly"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-neutral-50"
            }`}
          >
            Weekly Timetable
          </button>
          <button
            onClick={() => setViewMode("monthly")}
            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight cursor-pointer transition-all ${
              viewMode === "monthly"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-neutral-50"
            }`}
          >
            Monthly Calendar
          </button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3 justify-center sm:justify-end">
          <button
            onClick={handlePrevRange}
            className="rounded-xl border-4 border-black p-2 bg-white hover:bg-neutral-50 active:translate-y-px transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <ChevronLeft className="w-4 h-4 font-black" />
          </button>
          
          <span className="font-display font-black text-sm text-center min-w-[150px] bg-white border-4 border-black px-4 py-2 rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {viewMode === "weekly" ? (
              <>
                {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {" - "}
                {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </>
            ) : (
              currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
            )}
          </span>

          <button
            onClick={handleNextRange}
            className="rounded-xl border-4 border-black p-2 bg-white hover:bg-neutral-50 active:translate-y-px transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <ChevronRight className="w-4 h-4 font-black" />
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <AnimatePresence mode="wait">
        {viewMode === "weekly" ? (
          /* WEEKLY GRID LAYOUT */
          <motion.div
            key="weekly"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4"
          >
            {weekDays.map((day) => {
              const dayStr = formatDateStr(day);
              const isToday = dayStr === todayStr;
              const isPast = dayStr < todayStr;
              
              const dayOfWeekVal = day.getDay();
              const dayLabel = WEEK_DAYS_LABELS.find(l => l.val === dayOfWeekVal);
              
              const activeSchedules = schedules.filter(s => isScheduleActiveOnDate(s, dayStr));

              return (
                <div
                  key={dayStr}
                  className={`flex flex-col p-4 rounded-3xl border-4 border-black bg-white transition-all min-h-[350px] ${
                    isToday
                      ? "bg-amber-50/40 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] ring-4 ring-black"
                      : "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  {/* Day Header */}
                  <div className="border-b-4 border-black pb-2.5 mb-3.5 flex flex-row xl:flex-col justify-between items-center xl:items-start">
                    <div>
                      <span className="font-display font-black text-sm tracking-tight uppercase italic block">
                        {dayLabel?.label}
                      </span>
                      <span className="font-mono text-2xs font-extrabold text-neutral-400 block">
                        {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    {isToday && (
                      <span className="text-3xs font-extrabold uppercase bg-black text-white px-2 py-0.5 rounded-full font-mono mt-1 tracking-wider animate-pulse">
                        TODAY
                      </span>
                    )}
                  </div>

                  {/* Day items */}
                  <div className="flex-1 space-y-3">
                    {activeSchedules.length === 0 ? (
                      <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-center p-2 border-4 border-dashed border-neutral-200 rounded-2xl">
                        <span className="text-3xs font-bold text-neutral-400">Rest Day 🛌</span>
                      </div>
                    ) : (
                      activeSchedules.map((sched) => {
                        const log = getLogForSchedule(sched, dayStr);
                        const isRolloverPenalty = log.durationRequired > sched.durationMinutes;

                        return (
                          <motion.div
                            key={sched.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedTaskDetails({ schedule: sched, date: dayStr })}
                            className={`p-3 rounded-2xl border-4 border-black cursor-pointer text-left relative overflow-hidden transition-all ${
                              log.completed
                                ? "bg-green-50/60 shadow-[2px_2px_0px_0px_#22c55e]"
                                : isPast
                                ? "bg-red-50/50 shadow-[2px_2px_0px_0px_#ef4444]"
                                : "bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            }`}
                          >
                            {/* Alert indicators */}
                            {isRolloverPenalty && !log.completed && (
                              <div className="absolute right-2 top-2 bg-red-100 text-red-700 p-0.5 rounded-md border-2 border-red-300">
                                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                              </div>
                            )}

                            <span className="text-3xs font-extrabold text-neutral-400 font-mono tracking-wider block uppercase mb-1">
                              {sched.category}
                            </span>
                            
                            <h4 className="font-display font-black text-xs leading-tight mb-2 truncate">
                              {sched.title}
                            </h4>

                            {/* Duration / Status Footer */}
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-mono text-3xs font-extrabold text-neutral-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0" />
                                {log.durationLogged}/{log.durationRequired}m
                              </span>

                              {log.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                              ) : isPast ? (
                                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                              ) : (
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          /* MONTHLY CALENDAR GRID */
          <motion.div
            key="monthly"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-3 sm:p-6 bg-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black overflow-hidden"
          >
            <div className="overflow-x-auto pb-2 scrollbar">
              <div className="min-w-[700px] xl:min-w-0">
                {/* Weekdays Labels */}
                <div className="grid grid-cols-7 gap-2 border-b-4 border-black pb-3 mb-3 text-center">
                  {WEEK_DAYS_LABELS.map((day) => (
                    <span key={day.val} className="font-display font-black text-xs md:text-sm uppercase italic">
                      {day.short}
                    </span>
                  ))}
                </div>

                {/* Grid days */}
                <div className="grid grid-cols-7 gap-2">
                  {monthlyGrid.map((day, idx) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="bg-neutral-50 border-4 border-dashed border-neutral-200 rounded-2xl min-h-[90px] md:min-h-[110px]"
                        />
                      );
                    }

                    const dayStr = formatDateStr(day);
                    const isToday = dayStr === todayStr;
                    const isPast = dayStr < todayStr;
                    const activeSchedules = schedules.filter(s => isScheduleActiveOnDate(s, dayStr));

                    return (
                      <div
                        key={dayStr}
                        className={`p-2 rounded-2xl border-4 border-black bg-white min-h-[90px] md:min-h-[110px] flex flex-col transition-all relative ${
                          isToday
                            ? "bg-amber-50/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ring-4 ring-black"
                            : "hover:bg-neutral-50/50"
                        }`}
                      >
                        {/* Day number */}
                        <span className={`font-mono font-extrabold text-xs mb-1 self-start px-1.5 py-0.5 rounded-lg ${
                          isToday ? "bg-black text-white" : "text-black"
                        }`}>
                          {day.getDate()}
                        </span>

                        {/* Schedule items indicator */}
                        <div className="flex-1 space-y-1.5 overflow-hidden">
                          {activeSchedules.map((sched) => {
                            const log = getLogForSchedule(sched, dayStr);
                            
                            return (
                              <div
                                key={sched.id}
                                onClick={() => setSelectedTaskDetails({ schedule: sched, date: dayStr })}
                                className={`px-1.5 py-0.5 rounded-md border-2 border-black text-[9px] md:text-[10px] font-black truncate cursor-pointer flex items-center justify-between gap-1 ${
                                  log.completed
                                    ? "bg-green-100 text-green-900 border-green-400"
                                    : isPast
                                    ? "bg-red-100 text-red-900 border-red-400"
                                    : "bg-neutral-100 text-neutral-900 border-neutral-400"
                                }`}
                                title={`${sched.title} (${log.durationLogged}/${log.durationRequired} mins)`}
                              >
                                <span className="truncate">{sched.title}</span>
                                {log.completed ? (
                                  <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-green-700" />
                                ) : isPast ? (
                                  <XCircle className="w-2.5 h-2.5 shrink-0 text-red-700" />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-in details modal for a single task */}
      <AnimatePresence>
        {selectedTaskDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskDetails(null)}
              className="fixed inset-0 bg-black"
            />

            <motion.div
              initial={{ scale: 0.9, y: 50, rotate: -1, opacity: 0 }}
              animate={{ scale: 1, y: 0, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 350, damping: 22 } }}
              exit={{ scale: 0.95, y: 30, rotate: 1, opacity: 0 }}
              className="relative z-10 w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl border-4 border-black bg-white p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black text-left scrollbar"
            >
              {/* Category */}
              <div className="flex justify-between items-start mb-2">
                <span className="text-3xs font-mono font-extrabold uppercase tracking-widest bg-black text-white px-2.5 py-1 rounded-lg">
                  {selectedTaskDetails.schedule.category}
                </span>
                
                <span className="text-2xs font-mono font-bold text-neutral-400">
                  {new Date(selectedTaskDetails.date).toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" })}
                </span>
              </div>

              {/* Title & Desc */}
              <h3 className="font-display font-black text-xl leading-tight mb-2">
                {selectedTaskDetails.schedule.title}
              </h3>
              
              <p className="font-sans text-xs text-neutral-600 mb-4">
                {selectedTaskDetails.schedule.description || "No goal description provided."}
              </p>

              {/* Log Stats Card */}
              {(() => {
                const log = getLogForSchedule(selectedTaskDetails.schedule, selectedTaskDetails.date);
                const isPast = selectedTaskDetails.date < todayStr;
                const isToday = selectedTaskDetails.date === todayStr;
                const isRollover = log.durationRequired > selectedTaskDetails.schedule.durationMinutes;

                return (
                  <div className="space-y-4 font-sans text-xs">
                    <div className="p-4 rounded-2xl border-4 border-black bg-neutral-50 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black uppercase text-neutral-500">Base Requirement:</span>
                        <span className="font-mono font-black">{selectedTaskDetails.schedule.durationMinutes} Min</span>
                      </div>
                      {isRollover && (
                        <div className="flex justify-between items-center text-xs text-red-700 font-black bg-red-50 p-1.5 rounded-lg border-2 border-red-700">
                          <span className="flex items-center gap-1 uppercase">
                            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> Penalty Rollover:
                          </span>
                          <span className="font-mono font-black">+{log.durationRequired - selectedTaskDetails.schedule.durationMinutes} Min</span>
                        </div>
                      )}
                      <div className="border-t-2 border-black my-1 pb-1" />
                      <div className="flex justify-between items-center font-black">
                        <span className="uppercase">Total Required Today:</span>
                        <span className="font-mono text-sm">{log.durationRequired} Min</span>
                      </div>
                      <div className="flex justify-between items-center font-black">
                        <span className="uppercase">Completed logged:</span>
                        <span className="font-mono">{log.durationLogged} Min</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-2xs font-mono font-black text-neutral-400">
                        <span className="uppercase">Progress</span>
                        <span>{Math.round((log.durationLogged / log.durationRequired) * 100)}%</span>
                      </div>
                      <div className="w-full h-3 bg-neutral-100 border-4 border-black rounded-full overflow-hidden">
                        <div
                           className="h-full bg-black transition-all duration-300"
                           style={{ width: `${Math.min(100, (log.durationLogged / log.durationRequired) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Interactive Log Controls (Visible only for today or future) */}
                    {(isToday || !isPast) ? (
                      <div className="space-y-4 pt-1.5 border-t border-neutral-100">
                        {/* IN-APP COUNTDOWN TIMER INTERFACE */}
                        <div className="p-3 sm:p-4 rounded-2xl border-4 border-black bg-amber-50 space-y-3">
                          <span className="block font-black text-2xs uppercase tracking-wider text-amber-800">
                            ⏱️ IN-APP INTERACTIVE TIMER (OFFLINE)
                          </span>

                          {activeTimer && activeTimer.scheduleId === selectedTaskDetails.schedule.id ? (
                            // Active Timer for this task!
                            <div className="space-y-3 text-center">
                              <div className="font-mono font-black text-3xl bg-black text-white px-4 py-2 rounded-2xl border-4 border-black inline-block shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)]">
                                {(() => {
                                  const m = Math.floor(activeTimer.secondsRemaining / 60);
                                  const s = activeTimer.secondsRemaining % 60;
                                  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                                })()}
                              </div>
                              <p className="text-3xs text-amber-900 font-extrabold animate-pulse uppercase tracking-wider">
                                🔌 Focus Mode active. Internet/Distractions CUT OFF!
                              </p>

                              <div className="flex gap-2 justify-center">
                                {activeTimer.isRunning ? (
                                  <button
                                    onClick={onPauseTimer}
                                    className="py-1.5 px-3.5 rounded-xl border-3 border-black bg-white hover:bg-neutral-50 text-xs font-black uppercase cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px"
                                  >
                                    Pause
                                  </button>
                                ) : (
                                  <button
                                    onClick={onResumeTimer}
                                    className="py-1.5 px-3.5 rounded-xl border-3 border-black bg-black hover:bg-neutral-900 text-white text-xs font-black uppercase cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] active:translate-y-px"
                                  >
                                    Resume
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const elapsed = Math.ceil((activeTimer.totalSeconds - activeTimer.secondsRemaining) / 60);
                                    if (elapsed > 0) {
                                      if (window.confirm(`Stop session and log ${elapsed} completed minutes?`)) {
                                        onLogTask(
                                          activeTimer.scheduleId,
                                          activeTimer.date,
                                          (log.durationLogged + elapsed) >= log.durationRequired,
                                          log.durationLogged + elapsed,
                                          log.durationRequired
                                        );
                                        onCancelTimer();
                                      }
                                    } else {
                                      onCancelTimer();
                                    }
                                  }}
                                  className="py-1.5 px-3.5 rounded-xl border-3 border-black bg-red-100 hover:bg-red-200 text-red-700 text-xs font-black uppercase cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px"
                                >
                                  End & Save
                                </button>
                              </div>
                            </div>
                          ) : activeTimer ? (
                            // Active Timer for another task!
                            <div className="p-2.5 bg-red-50 border-3 border-red-400 text-red-900 rounded-xl text-center">
                              <p className="text-3xs font-extrabold uppercase leading-tight text-red-700">
                                ⚠️ Another timer is active for:
                              </p>
                              <p className="text-xs font-black truncate leading-tight my-1">
                                "{activeTimer.scheduleTitle}"
                              </p>
                              <p className="text-3xs text-neutral-500">
                                Please end or cancel that timer first to start a session here.
                              </p>
                            </div>
                          ) : (
                            // No Active Timer: Allow starting one!
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-3xs font-black text-neutral-500 uppercase">
                                  <span>Choose Session Time:</span>
                                  <span className="font-mono text-black text-xs font-black">
                                    {customTimerMinutes} Min
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="120"
                                  value={customTimerMinutes}
                                  onChange={(e) => setCustomTimerMinutes(parseInt(e.target.value))}
                                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-black"
                                />
                                <div className="flex gap-1.5 flex-wrap">
                                  {[15, 25, 45, Math.max(1, log.durationRequired - log.durationLogged)].map((preset) => (
                                    <button
                                      key={preset}
                                      onClick={() => setCustomTimerMinutes(preset)}
                                      className="py-1 px-2.5 rounded-lg border-2 border-black bg-white hover:bg-neutral-50 text-3xs font-bold font-mono cursor-pointer transition-all"
                                    >
                                      {preset}m
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  onStartTimer(
                                    selectedTaskDetails.schedule.id,
                                    selectedTaskDetails.schedule.title,
                                    selectedTaskDetails.date,
                                    customTimerMinutes
                                  );
                                }}
                                className="w-full py-2.5 rounded-xl border-4 border-black bg-black text-white hover:bg-neutral-900 text-xs font-black uppercase tracking-wider cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-px"
                              >
                                Start Focused Session ⏱️
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Traditional Manual Adjustments */}
                        <div className="space-y-2.5 pt-1.5 border-t-2 border-dashed border-black/10">
                          <span className="block font-black text-2xs uppercase tracking-wider text-neutral-400">
                            Manual Quick Adjustments
                          </span>
                          <div className="flex flex-wrap sm:flex-nowrap gap-2">
                            <button
                              onClick={() => handleUpdateDuration(selectedTaskDetails.schedule, selectedTaskDetails.date, 15)}
                              className="flex-1 py-2 rounded-xl border-4 border-black text-2xs font-black uppercase tracking-wider bg-white text-black hover:bg-neutral-50 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px"
                            >
                              +15 Mins
                            </button>
                            <button
                              onClick={() => handleUpdateDuration(selectedTaskDetails.schedule, selectedTaskDetails.date, 30)}
                              className="flex-1 py-2 rounded-xl border-4 border-black text-2xs font-black uppercase tracking-wider bg-white text-black hover:bg-neutral-50 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px"
                            >
                              +30 Mins
                            </button>
                            <button
                              onClick={() => handleToggleComplete(selectedTaskDetails.schedule, selectedTaskDetails.date)}
                              className={`flex-1 py-2 rounded-xl border-4 border-black text-2xs font-black uppercase tracking-wider cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-px ${
                                log.completed ? "bg-green-100 text-green-800 border-green-600 shadow-[2px_2px_0px_0px_#16a34a]" : "bg-black text-white hover:bg-neutral-900"
                              }`}
                            >
                              {log.completed ? "Incomplete" : "Mark Done ✅"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Past days results indicator (Red X Penalty message) */
                      <div className="p-3 bg-red-100/50 border-4 border-red-500 rounded-2xl flex items-start gap-2.5 text-red-900">
                        {log.completed ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            <p className="text-2xs font-bold leading-relaxed font-sans">
                              Excellent! You finished this task on time. Mom was momentarily content and didn't mention adoption.
                            </p>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                            <p className="text-2xs font-bold leading-relaxed font-sans">
                              RED X OF SHAME IS ACTIVE! You failed this daily task. These missed {log.durationRequired - log.durationLogged} minutes were rolled over with double penalties to tomorrow!
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {/* Footer Delete option */}
                    <div className="flex gap-2 pt-2 border-t border-neutral-100 mt-2">
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to permanently delete this recurring schedule? All past logs will be deleted!")) {
                            onDeleteSchedule(selectedTaskDetails.schedule.id);
                            setSelectedTaskDetails(null);
                          }
                        }}
                        className="text-2xs text-red-500 font-bold hover:underline cursor-pointer"
                      >
                        Delete Goal & Timetable Pattern
                      </button>
                      <span className="text-neutral-300 ml-auto font-bold font-mono text-3xs">ID: {selectedTaskDetails.schedule.id}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-5 text-right">
                <button
                  onClick={() => setSelectedTaskDetails(null)}
                  className="px-5 py-2 rounded-xl border-4 border-black bg-black text-white hover:bg-neutral-900 font-black uppercase tracking-wider text-xs cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
