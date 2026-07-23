"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Clock, Sparkles } from "lucide-react";
import { RecurrenceType, Schedule } from "../types";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (schedule: Partial<Omit<Schedule, "id" | "createdAt">>) => void;
  initialData?: Schedule | null;
}

const CATEGORIES = [
  { name: "Coding", icon: "💻" },
  { name: "Math", icon: "📚" },
  { name: "Gym & Fitness", icon: "💪" },
  { name: "Reading", icon: "📖" },
  { name: "Music", icon: "🎹" },
  { name: "Design & Art", icon: "🎨" },
  { name: "Language", icon: "🗣️" }
];

const WEEK_DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 }
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Coding");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("daily");
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description || "");
        setCategory(initialData.category);
        setRecurrence(initialData.recurrence);
        setWeeklyDays(initialData.weeklyDays || [1, 2, 3, 4, 5]);
        setMonthlyDay(initialData.monthlyDay || 1);
        setDurationMinutes(initialData.durationMinutes);
        setStartDate(initialData.startDate);
        setEndDate(initialData.endDate || "");
      } else {
        setTitle("");
        setDescription("");
        setCategory("Coding");
        setRecurrence("daily");
        setWeeklyDays([1, 2, 3, 4, 5]);
        setMonthlyDay(1);
        setDurationMinutes(60);
        setStartDate(new Date().toISOString().split("T")[0]);
        setEndDate("");
      }
    }
  }, [isOpen, initialData]);

  const toggleWeeklyDay = (day: number) => {
    if (weeklyDays.includes(day)) {
      setWeeklyDays(weeklyDays.filter(d => d !== day));
    } else {
      setWeeklyDays([...weeklyDays, day].sort());
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      recurrence,
      weeklyDays: recurrence === "weekly" ? weeklyDays : undefined,
      monthlyDay: recurrence === "monthly" ? monthlyDay : undefined,
      durationMinutes,
      startDate,
      endDate: endDate || undefined
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black"
          />

          <motion.div
            initial={{ scale: 0.9, y: 50, rotate: -2, opacity: 0 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              rotate: 0, 
              opacity: 1,
              transition: { type: "spring", stiffness: 300, damping: 22 }
            }}
            exit={{ scale: 0.95, y: 30, rotate: 1, opacity: 0 }}
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border-4 border-black bg-white p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black scrollbar"
          >
            <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-4">
              <h3 className="font-display text-2xl font-black uppercase italic flex items-center gap-2">
                <Sparkles className="w-6 h-6 animate-pulse" />
                {initialData ? "Edit Goal" : "Create Daily Goal"}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border-4 border-black p-1 hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-black uppercase tracking-tight mb-1">
                  What are you going to do? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Python everyday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border-4 border-black px-3.5 py-2.5 font-sans outline-none bg-white focus:bg-amber-50 focus:shadow-[4px_4px_0px_0px_#000] dark:focus:shadow-[4px_4px_0px_0px_#fff] transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase tracking-tight mb-1">
                  Brief description (Why must you do this?)
                </label>
                <textarea
                  placeholder="e.g. To get a high-paying job, make mom proud, and beat cousin Timmy."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border-4 border-black px-3.5 py-2.5 font-sans outline-none bg-white focus:bg-amber-50 h-20 resize-none transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-black uppercase tracking-tight mb-1">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-full border-4 border-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                        category === cat.name
                          ? "bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
                          : "bg-white text-black hover:bg-black/5"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-black uppercase tracking-tight mb-1">Recurrence Pattern</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                  className="w-full rounded-xl border-4 border-black px-3 py-2 bg-white font-sans font-black uppercase outline-none cursor-pointer"
                >
                  <option value="daily">Everyday (Daily)</option>
                  <option value="weekly">Specific Days (Weekly)</option>
                  <option value="monthly">Day of Month (Monthly)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black uppercase tracking-tight mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border-4 border-black px-3 py-1.5 bg-white font-sans outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black uppercase tracking-tight mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border-4 border-black px-3 py-1.5 bg-white font-sans outline-none font-bold"
                  />
                </div>
              </div>

              {recurrence === "weekly" && (
                <div className="p-3 bg-neutral-100 rounded-2xl border-4 border-black">
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-neutral-600">
                    Select Days of Week
                  </label>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {WEEK_DAYS.map((day) => {
                      const isSelected = weeklyDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleWeeklyDay(day.value)}
                          className={`w-full h-9 text-xs font-bold rounded-xl border-4 border-black flex items-center justify-center cursor-pointer transition-all ${
                            isSelected
                              ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                              : "bg-white text-black hover:bg-black/5"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {recurrence === "monthly" && (
                <div className="p-3 bg-neutral-100 rounded-2xl border-4 border-black">
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-neutral-600">
                    Day of the Month
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={monthlyDay}
                      onChange={(e) => setMonthlyDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                      className="w-20 rounded-xl border-4 border-black px-2 py-1 bg-white font-mono text-center font-bold"
                    />
                    <span className="text-xs font-medium text-neutral-500">
                      e.g., will repeat on the {monthlyDay} day of every month.
                    </span>
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-bold tracking-tight flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Daily Commitment Duration
                  </label>
                  <span className="font-mono text-sm font-extrabold bg-black text-white px-2 py-0.5 rounded-lg">
                    {durationMinutes} Min
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={240}
                  step={15}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  className="w-full accent-black cursor-pointer h-2 bg-neutral-200 rounded-lg appearance-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[30, 45, 60, 90, 120].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDurationMinutes(preset)}
                      className={`text-2xs px-2.5 py-1 rounded-lg border border-neutral-300 font-bold transition-all ${
                        durationMinutes === preset
                          ? "bg-black text-white border-black"
                          : "bg-white text-neutral-500 hover:border-black hover:text-black"
                      }`}
                    >
                      {preset >= 60 ? `${preset / 60} Hr` : `${preset} Min`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-3 rounded-2xl border-4 border-black text-sm font-black uppercase tracking-wider text-black hover:bg-neutral-50 cursor-pointer active:translate-y-px transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || (recurrence === "weekly" && weeklyDays.length === 0)}
                  className={`w-full sm:flex-1 py-3 rounded-2xl border-4 border-black text-sm font-black uppercase tracking-wider text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all ${
                    !title.trim() || (recurrence === "weekly" && weeklyDays.length === 0)
                      ? "bg-neutral-400 border-neutral-400 shadow-none cursor-not-allowed text-neutral-200"
                      : "bg-black hover:bg-neutral-900"
                  }`}
                >
                  {initialData ? "Save Changes" : "Create Goal"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
