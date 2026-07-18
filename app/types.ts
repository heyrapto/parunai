export interface UserProfile {
  email: string;
  name: string;
  streak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  notificationsEnabled?: boolean;
  darkModeEnabled?: boolean;
}

export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

export interface Schedule {
  id: string;
  title: string;
  description: string;
  category: string; // e.g. "Coding", "Gym", "Math"
  recurrence: RecurrenceType;
  // If weekly: array of day numbers (0 for Sun, 1 for Mon, etc.)
  weeklyDays?: number[];
  // If monthly: specific day of month (1-31)
  monthlyDay?: number;
  durationMinutes: number; // base daily requirement (e.g. 60 min)
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  createdAt: string;
}

export interface TaskLog {
  id: string; // scheduleId + "_" + date
  scheduleId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  durationRequired: number; // base duration + rolled over duration
  durationLogged: number;
  rolledOver: boolean; // whether this task was a rollover from a previous day
  rolledOverToNextDay: boolean; // whether this task rolled over to the next day
}

export interface EmailLog {
  id: string;
  timestamp: string;
  subject: string;
  body: string;
  type: 'upcoming_warning' | 'missed_rollover' | 'streak_congrats' | 'test';
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  streak: number;
  avatar: string;
  achievement: string;
  isCurrentUser?: boolean;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
}

export interface ActiveTimer {
  scheduleId: string;
  scheduleTitle: string;
  date: string; // YYYY-MM-DD
  totalSeconds: number; // original countdown session duration in seconds
  secondsRemaining: number;
  isRunning: boolean;
}

