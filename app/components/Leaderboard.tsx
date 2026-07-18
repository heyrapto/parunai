import React from "react";
import { motion } from "motion/react";
import { Trophy, Award, Flame, FlameKindling, Skull, Info, Star } from "lucide-react";
import { LeaderboardEntry, UserProfile } from "../types";

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  profile: UserProfile | null;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ leaderboard, profile }) => {
  const userStreak = profile ? profile.streak : 0;

  // Mother's evaluation of your streak
  const getMomEvaluation = () => {
    if (userStreak === 0) {
      return {
        status: "🚨 CATASTROPHE LEVEL DISAPPOINTMENT",
        message: "Your streak is 0! Cousin Timmy was born with a 100-day streak. Complete your tasks before midnight or do not call me your mother.",
        color: "bg-red-100 text-red-700 border-red-700",
        icon: <Skull className="w-8 h-8 text-red-700 animate-bounce" />
      };
    } else if (userStreak < 3) {
      return {
        status: "⚠️ MINIMAL SUSPECTED EFFORT",
        message: "Fine, you did tasks for a couple of days. Is that supposed to impress me? Call me when you get to 50 days, then maybe I will put your drawing on the fridge.",
        color: "bg-amber-100 text-amber-800 border-amber-800",
        icon: <FlameKindling className="w-8 h-8 text-amber-800" />
      };
    } else if (userStreak < 7) {
      return {
        status: "📈 ACCURATE HUMAN IMITATION",
        message: "You are actually completing tasks for nearly a week! Very good, although Timmy completed a computer science degree during his first week on earth. Keep it up.",
        color: "bg-blue-100 text-blue-800 border-blue-800",
        icon: <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
      };
    } else {
      return {
        status: "🌟 MOM'S GOLDEN CHILD IN TRAINING",
        message: "Over a 7-day streak! I actually told your aunt about you yesterday (though she reminded me Timmy just got knighted). I am very proud of you! Keep this streak alive!",
        color: "bg-green-100 text-green-800 border-green-800",
        icon: <Star className="w-8 h-8 text-yellow-500 animate-spin" style={{ animationDuration: '6s' }} />
      };
    }
  };

  const momEval = getMomEvaluation();

  return (
    <div className="space-y-6">
      {/* Playful Mom Evaluation Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        className={`p-6 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${momEval.color} flex flex-col md:flex-row items-start md:items-center gap-5`}
      >
        <div className="p-3 bg-white rounded-2xl border-4 border-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {momEval.icon}
        </div>
        <div className="space-y-1">
          <div className="text-2xs font-extrabold uppercase tracking-widest bg-black text-white px-2.5 py-0.5 rounded-full inline-block mb-1">
            MOM'S VERDICT
          </div>
          <h4 className="font-display text-xl font-black tracking-tight uppercase italic">{momEval.status}</h4>
          <p className="font-sans text-sm leading-relaxed opacity-90 italic">
            "{momEval.message}"
          </p>
        </div>
      </motion.div>

      {/* Leaderboard layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-3xl border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black">
            <h3 className="font-display text-2xl font-black tracking-tight mb-4 flex items-center gap-2 uppercase italic">
              <Trophy className="w-6 h-6 text-yellow-500" />
              MOM'S GOLDEN KIDS LEADERBOARD
            </h3>
            
            <p className="text-xs text-neutral-500 mb-6 font-sans">
              Ranked entirely by streak duration. If your streak breaks, you go straight to the bottom and Cousin Timmy laughs at you.
            </p>

            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.name}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: index * 0.1 } }}
                  whileHover={{ scale: 1.01 }}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-2xl border-4 border-black gap-3 transition-all ${
                    entry.isCurrentUser
                      ? "bg-amber-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-white hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Circle */}
                    <div className={`w-8 h-8 rounded-xl border-4 border-black flex items-center justify-center font-mono font-black text-sm shrink-0 ${
                      entry.rank === 1 ? "bg-yellow-400 text-neutral-900" :
                      entry.rank === 2 ? "bg-neutral-300 text-black" :
                      entry.rank === 3 ? "bg-amber-600 text-white" : "bg-white text-black"
                    }`}>
                      {entry.rank}
                    </div>

                    {/* Avatar */}
                    <span className="text-2xl shrink-0">{entry.avatar}</span>

                    {/* Name / Achievement */}
                    <div className="min-w-0">
                      <h4 className="font-bold flex items-center gap-1.5 text-sm">
                        {entry.name}
                        {entry.isCurrentUser && (
                          <span className="text-2xs bg-black text-white px-2 py-0.5 rounded-full font-mono uppercase tracking-wider scale-90">
                            YOU
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-neutral-500 font-sans max-w-sm leading-tight">
                        {entry.achievement}
                      </p>
                    </div>
                  </div>

                  {/* Streak Count */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <Flame className="w-5 h-5 text-orange-500 animate-pulse fill-orange-500" />
                    <span className="font-mono font-black text-base">{entry.streak}</span>
                    <span className="text-2xs font-extrabold text-neutral-400 font-mono">DAYS</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Side rules / Comparison card */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border-4 border-black bg-black text-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
            <h3 className="font-display text-xl font-black tracking-tight mb-4 flex items-center gap-2 uppercase italic">
              <Award className="w-5 h-5 text-yellow-400 animate-bounce" />
              TIMMY'S LATEST ACHIEVEMENTS
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed font-sans mb-4">
              Our mother's pride and joy. Cousin Timmy has been having a flawless year. Let's compare your performance to keep your ego in check:
            </p>

            <ul className="space-y-3 font-sans text-xs">
              <li className="flex items-start gap-2">
                <span className="text-lg">🏆</span>
                <div>
                  <strong>Acquired 3rd Venture Capital:</strong>
                  <p className="text-neutral-300">Timmy just raised $20M for his AI toaster startup before lunch.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lg">⚡</span>
                <div>
                  <strong>Woke up at 3:15 AM:</strong>
                  <p className="text-neutral-300">Did 100 miles of running, designed a new CPU, and meditated for 4 hours.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lg">🧠</span>
                <div>
                  <strong>Solved Cancer (part-time):</strong>
                  <p className="text-neutral-300">He is just doing this on his Sunday afternoon breaks between playing violin.</p>
                </div>
              </li>
            </ul>

            <div className="mt-6 p-3 bg-neutral-900 rounded-2xl border-2 border-neutral-700 text-center text-2xs text-amber-300 font-black uppercase tracking-wider">
              "Why can't you be more like him?"
            </div>
          </div>

          <div className="p-6 rounded-3xl border-4 border-black bg-white text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="font-display font-black text-sm flex items-center gap-1.5 mb-2 uppercase italic">
              <Info className="w-4 h-4" />
              STREAK CONSTRAINTS
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              Completing daily goals before 11:59 PM increments your streak. Failing to complete even a single goal for a scheduled day resets your streak back to <strong>0</strong> and triggers an angry rollover event from Mom. There are no excuses!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
