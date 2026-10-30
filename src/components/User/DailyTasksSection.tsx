'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, CalendarCheck, Tv, Compass, Heart, MessageSquare, PenTool, 
  Bookmark, Check, Award, Coins, ChevronRight, Zap, Crown
} from 'lucide-react';
import { 
  DailyTask, StreakState, getStreakState, claimDailyCheckIn, 
  getDailyTasksState, claimTaskReward, STREAK_REWARDS 
} from '@/lib/dailyTasks';
import { playGummyPop, playGummyTap, playSquishyJelly } from '@/lib/audioManager';
import { toast } from '@/lib/toast';
import { motion } from 'framer-motion';

interface DailyTasksSectionProps {
  userId?: string;
  onCoinsUpdated?: () => void;
}

const TASK_ICONS: Record<string, React.ReactNode> = {
  CalendarCheck: <CalendarCheck size={16} className="text-emerald-400" />,
  Tv: <Tv size={16} className="text-cyan-400" />,
  Compass: <Compass size={16} className="text-blue-400" />,
  Heart: <Heart size={16} className="text-rose-400" />,
  MessageSquare: <MessageSquare size={16} className="text-amber-400" />,
  PenTool: <PenTool size={16} className="text-purple-400" />,
  Bookmark: <Bookmark size={16} className="text-violet-400" />,
  Crown: <Crown size={16} className="text-amber-400" />,
  Layers: <Award size={16} className="text-indigo-400" />,
};

export default function DailyTasksSection({ userId = 'guest', onCoinsUpdated }: DailyTasksSectionProps) {
  const [streak, setStreak] = useState<StreakState>(() => getStreakState(userId));
  const [tasks, setTasks] = useState<DailyTask[]>(() => getDailyTasksState(userId));

  const refreshState = () => {
    setStreak(getStreakState(userId));
    setTasks(getDailyTasksState(userId));
    onCoinsUpdated?.();
  };

  useEffect(() => {
    const handleUpdate = () => refreshState();
    window.addEventListener('shadow-daily-tasks-updated', handleUpdate);
    window.addEventListener('shadow-coins-updated', handleUpdate);
    return () => {
      window.removeEventListener('shadow-daily-tasks-updated', handleUpdate);
      window.removeEventListener('shadow-coins-updated', handleUpdate);
    };
  }, [userId]);

  const handleCheckIn = () => {
    playGummyPop();
    const res = claimDailyCheckIn(userId);
    if (res.success) {
      toast.success(`🎉 Day ${res.newStreak} Check-in Claimed! +${res.coinsAwarded} Coins!`);
      refreshState();
    } else {
      toast.info("You've already claimed today's check-in reward.");
    }
  };

  const handleClaim = (taskId: string) => {
    playSquishyJelly();
    const ok = claimTaskReward(userId, taskId);
    if (ok) {
      toast.success("Reward claimed!");
      refreshState();
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* ── 1. 7-DAY STREAK (CLEAN MONET MATERIAL SURFACE) ── */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#18181b]/70 border border-white/[0.06] backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                7-Day Check-in Streak
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 font-semibold border border-amber-400/20">
                {streak.currentStreak} Day Streak
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Check in daily to build your streak. Day 7 grants a supreme +75 coin milestone!
            </p>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 450, damping: 20 }}
            disabled={streak.claimedToday}
            onClick={handleCheckIn}
            className={`h-8 sm:h-9 px-4 sm:px-5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              streak.claimedToday
                ? 'bg-zinc-800 text-zinc-500 cursor-default select-none'
                : 'bg-white hover:bg-zinc-200 text-black active:scale-95 cursor-pointer shadow-sm'
            }`}
          >
            {streak.claimedToday ? (
              <>
                <Check size={13} strokeWidth={2.5} /> Checked in Today
              </>
            ) : (
              <>
                <CalendarCheck size={14} /> Claim Today&apos;s Bonus
              </>
            )}
          </motion.button>
        </div>

        {/* 7 Days Row (Monet UI Filled Pills) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3 pt-1">
          {STREAK_REWARDS.map((reward, idx) => {
            const dayNum = idx + 1;
            const isCompleted = streak.currentStreak >= dayNum;
            const isToday = (streak.claimedToday && streak.currentStreak === dayNum) || (!streak.claimedToday && streak.currentStreak + 1 === dayNum);
            const isJackpot = dayNum === 7;

            return (
              <div
                key={dayNum}
                className={`flex flex-col items-center justify-between py-2 sm:py-3 px-1 sm:px-2 rounded-xl sm:rounded-2xl transition-all text-center ${
                  isCompleted
                    ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                    : isToday
                    ? 'bg-[#26262b] text-white border border-white/20 shadow-sm'
                    : 'bg-white/[0.02] text-zinc-500 border border-transparent'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  D{dayNum}
                </span>

                <div className="my-1.5 sm:my-2">
                  {isCompleted ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400 text-black flex items-center justify-center text-xs font-bold mx-auto">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : (
                    <span className="text-sm sm:text-base">
                      {isJackpot ? '👑' : '🪙'}
                    </span>
                  )}
                </div>

                <span className="text-[10px] sm:text-[11px] font-semibold whitespace-nowrap">
                  +{reward}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. DAILY QUESTS (SLEEK MINIMAL LIST - NO HEAVY BOXES) ── */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#18181b]/50 border border-white/[0.05] p-3 sm:p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between pb-3 px-2 sm:px-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-purple-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
              Daily Tasks & Routines
            </h4>
          </div>
          <span className="text-[11px] font-medium text-zinc-500">
            Resets daily at 00:00
          </span>
        </div>

        {/* Minimal Divider List (Anti-Container Directive) */}
        <div className="divide-y divide-white/[0.04]">
          {tasks.map((task) => {
            const percent = Math.min(100, Math.round((task.progress / task.target) * 100));

            return (
              <div
                key={task.id}
                className="flex items-center justify-between py-3 sm:py-3.5 px-2 sm:px-3 hover:bg-white/[0.02] transition-colors rounded-xl gap-3 sm:gap-4"
              >
                {/* Clean Rounded Icon Pill */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.04] flex items-center justify-center shrink-0">
                  {TASK_ICONS[task.iconName] || <Coins size={16} className="text-amber-400" />}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-semibold text-zinc-100 truncate">
                      {task.title}
                    </span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full shrink-0">
                      +🪙 {task.reward}
                    </span>
                    {task.category === 'routine' && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-semibold shrink-0">
                        Routine
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] sm:text-xs text-zinc-400 truncate mt-0.5">
                    {task.desc}
                  </p>

                  {/* Clean Minimal Progress Line */}
                  <div className="flex items-center gap-2.5 mt-2 max-w-xs sm:max-w-sm">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400 shrink-0">
                      {task.progress}/{task.target}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="shrink-0 pl-1">
                  {task.claimed ? (
                    <span className="text-xs font-semibold text-zinc-500 px-3 py-1 flex items-center gap-1 select-none">
                      <Check size={12} strokeWidth={2.5} /> Done
                    </span>
                  ) : task.completed ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 450, damping: 20 }}
                      onClick={() => handleClaim(task.id)}
                      className="h-7 sm:h-8 px-3.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-bold text-xs rounded-full transition-all cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      Claim
                    </motion.button>
                  ) : (
                    <span className="text-xs font-medium text-zinc-500 px-2.5 py-1">
                      {task.progress}/{task.target}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
