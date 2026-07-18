import { UserProfile, Schedule, TaskLog, EmailLog } from "../types";

export const DEFAULT_PROFILE: UserProfile = {
  email: "kalejaiyecaleb@gmail.com",
  name: "Lazy Child",
  streak: 0,
  lastActiveDate: null,
  notificationsEnabled: true,
  darkModeEnabled: false,
};

export const DEFAULT_SCHEDULES: Schedule[] = [
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

export const DEFAULT_LOGS: TaskLog[] = [
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

export const DEFAULT_EMAIL_LOGS: EmailLog[] = [
  {
    id: "email_welcome",
    timestamp: new Date().toISOString(),
    subject: "Your mother is watching you now.",
    body: "Son, I heard you want to be productive. Don't make me regret supporting you. Finish your schedules, or feel my wrath. Little Timmy already has a 210-day streak! Love, Mom.",
    type: "test"
  }
];

export const isScheduleActiveOnDate = (schedule: Schedule, dateStr: string): boolean => {
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

export const getDatesBetween = (startDateStr: string, endDateStr: string): string[] => {
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

export const syncLocalAndState = (set: any, updates: any) => {
  set(updates);
  if (updates.profile !== undefined) {
    if (updates.profile) {
      localStorage.setItem("mom_profile", JSON.stringify(updates.profile));
    } else {
      localStorage.removeItem("mom_profile");
    }
  }
  if (updates.schedules !== undefined) {
    localStorage.setItem("mom_schedules", JSON.stringify(updates.schedules));
  }
  if (updates.logs !== undefined) {
    localStorage.setItem("mom_logs", JSON.stringify(updates.logs));
  }
  if (updates.emailLogs !== undefined) {
    localStorage.setItem("mom_email_logs", JSON.stringify(updates.emailLogs));
  }
  if (updates.smtp !== undefined) {
    if (updates.smtp) {
      localStorage.setItem("mom_smtp", JSON.stringify(updates.smtp));
    } else {
      localStorage.removeItem("mom_smtp");
    }
  }
};
