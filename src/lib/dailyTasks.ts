/**
 * Shadow Garden - Daily Tasks & 7-Day Streak Rewards System
 * Manages daily quest progress, streak retention, pet notifications, and balanced gamer coin rewards.
 */

import { supabase } from '@/lib/supabase';

export interface DailyTask {
  id: string;
  title: string;
  desc: string;
  category: 'daily' | 'routine';
  reward: number; // in coins
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  iconName: string;
  dayOfWeek?: number; // 0-6 if specific to day
}

export interface StreakState {
  currentStreak: number; // 0 to 7
  lastCheckInDate: string | null; // 'YYYY-MM-DD'
  claimedToday: boolean;
  streakRewards: number[];
}

// Balanced 7-day streak rewards (Harder to earn, meaningful progression)
// Day 1: +5, Day 2: +10, Day 3: +15, Day 4: +20, Day 5: +25, Day 6: +35, Day 7 (Jackpot): +75
export const STREAK_REWARDS = [5, 10, 15, 20, 25, 35, 75];

const getTodayString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterdayString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Calibrated Daily Quests (Total ~25-30 coins per day max)
const DEFAULT_DAILY_TASKS: Omit<DailyTask, 'progress' | 'completed' | 'claimed'>[] = [
  {
    id: 'daily_checkin',
    title: 'Sanctuary Check-in',
    desc: 'Log in and claim your daily streak reward',
    category: 'daily',
    reward: 5,
    target: 1,
    iconName: 'CalendarCheck',
  },
  {
    id: 'watch_anime',
    title: 'Anime Session',
    desc: 'Watch anime episodes for 10 minutes',
    category: 'daily',
    reward: 15,
    target: 10,
    iconName: 'Tv',
  },
  {
    id: 'explore_catalog',
    title: 'Realm Explorer',
    desc: 'Browse and explore 3 new anime titles',
    category: 'daily',
    reward: 5,
    target: 3,
    iconName: 'Compass',
  },
  {
    id: 'boop_pet',
    title: 'Companion Care',
    desc: 'Boop your pet 5 times in Whisper Island',
    category: 'daily',
    reward: 5,
    target: 5,
    iconName: 'Heart',
  },
  {
    id: 'social_comment',
    title: 'Guild Voice',
    desc: 'Drop an insightful comment on an episode or post',
    category: 'daily',
    reward: 10,
    target: 1,
    iconName: 'MessageSquare',
  },
  {
    id: 'create_post',
    title: 'Chronicle Scribe',
    desc: 'Publish your thoughts in OtakuVerse community',
    category: 'daily',
    reward: 15,
    target: 1,
    iconName: 'PenTool',
  },
  {
    id: 'save_anime',
    title: 'Vault Keeper',
    desc: 'Save a title to your private watchlist library',
    category: 'daily',
    reward: 5,
    target: 1,
    iconName: 'Bookmark',
  },
];

// Rotating weekly routine quests (No sparkle icons per AGENTS.md rules)
const WEEKLY_ROUTINES: Record<number, Omit<DailyTask, 'progress' | 'completed' | 'claimed'>> = {
  0: {
    id: 'weekly_routine_sun',
    title: 'Sunday Serenity',
    desc: 'Interact with companion pet 10 times',
    category: 'routine',
    reward: 15,
    target: 10,
    iconName: 'Heart',
    dayOfWeek: 0,
  },
  1: {
    id: 'weekly_routine_mon',
    title: 'Monday Expedition',
    desc: 'Discover 5 new anime titles in explore',
    category: 'routine',
    reward: 10,
    target: 5,
    iconName: 'Compass',
    dayOfWeek: 1,
  },
  2: {
    id: 'weekly_routine_tue',
    title: 'Tuesday Discussion',
    desc: 'Participate with 2 comments across episodes',
    category: 'routine',
    reward: 10,
    target: 2,
    iconName: 'MessageSquare',
    dayOfWeek: 2,
  },
  3: {
    id: 'weekly_routine_wed',
    title: 'Midweek Marathon',
    desc: 'Watch 20 minutes of your favorite series',
    category: 'routine',
    reward: 15,
    target: 20,
    iconName: 'Tv',
    dayOfWeek: 3,
  },
  4: {
    id: 'weekly_routine_thu',
    title: 'Thursday Camaraderie',
    desc: 'Explore 4 community posts in OtakuVerse',
    category: 'routine',
    reward: 10,
    target: 4,
    iconName: 'Layers',
    dayOfWeek: 4,
  },
  5: {
    id: 'weekly_routine_fri',
    title: 'Friday Vault Build',
    desc: 'Add 2 new recommendations to your Saved list',
    category: 'routine',
    reward: 10,
    target: 2,
    iconName: 'Bookmark',
    dayOfWeek: 5,
  },
  6: {
    id: 'weekly_routine_sat',
    title: 'Saturday Prime Feast',
    desc: 'Share a post & watch 15 minutes of anime',
    category: 'routine',
    reward: 20,
    target: 15,
    iconName: 'Crown',
    dayOfWeek: 6,
  },
};

/**
 * Load streak status
 */
export function getStreakState(userId: string = 'guest'): StreakState {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, lastCheckInDate: null, claimedToday: false, streakRewards: STREAK_REWARDS };
  }

  const key = `shadow_streak_${userId}`;
  try {
    const raw = localStorage.getItem(key);
    const today = getTodayString();
    const yesterday = getYesterdayString();

    if (!raw) {
      return { currentStreak: 0, lastCheckInDate: null, claimedToday: false, streakRewards: STREAK_REWARDS };
    }

    const parsed = JSON.parse(raw);
    const lastDate = parsed.lastCheckInDate;
    const claimedToday = lastDate === today;

    if (lastDate !== today && lastDate !== yesterday) {
      // Streak broken (missed more than 1 day)
      return { currentStreak: 0, lastCheckInDate: lastDate, claimedToday: false, streakRewards: STREAK_REWARDS };
    }

    return {
      currentStreak: parsed.currentStreak || 0,
      lastCheckInDate: lastDate,
      claimedToday,
      streakRewards: STREAK_REWARDS,
    };
  } catch {
    return { currentStreak: 0, lastCheckInDate: null, claimedToday: false, streakRewards: STREAK_REWARDS };
  }
}

/**
 * Claim daily streak check-in
 */
export function claimDailyCheckIn(userId: string = 'guest'): { success: boolean; coinsAwarded: number; newStreak: number } {
  if (typeof window === 'undefined') return { success: false, coinsAwarded: 0, newStreak: 0 };

  const state = getStreakState(userId);
  if (state.claimedToday) {
    return { success: false, coinsAwarded: 0, newStreak: state.currentStreak };
  }

  const today = getTodayString();
  const nextStreak = state.currentStreak >= 7 ? 1 : state.currentStreak + 1;
  const coinsAwarded = STREAK_REWARDS[nextStreak - 1] || 5;

  const updatedState = {
    currentStreak: nextStreak,
    lastCheckInDate: today,
  };

  const key = `shadow_streak_${userId}`;
  localStorage.setItem(key, JSON.stringify(updatedState));

  // Also complete the checkin task
  incrementTaskProgress(userId, 'daily_checkin', 1);

  // Add coins to balance
  addCoinsToBalance(userId, coinsAwarded);

  // Dispatch pet companion notification via WhisperIsland
  window.dispatchEvent(
    new CustomEvent('shadow-pet-notify', {
      detail: {
        text: `Day ${nextStreak} Check-in Claimed! +🪙 ${coinsAwarded} Coins!`,
        mood: 'celebrating',
        sound: 'gummyPop',
        targetTab: 'tasks',
      },
    })
  );

  return { success: true, coinsAwarded, newStreak: nextStreak };
}

/**
 * Load daily tasks state with midnight refresh
 */
export function getDailyTasksState(userId: string = 'guest'): DailyTask[] {
  if (typeof window === 'undefined') return [];

  const today = getTodayString();
  const dateKey = `shadow_tasks_date_${userId}`;
  const dataKey = `shadow_tasks_data_${userId}`;

  const savedDate = localStorage.getItem(dateKey);
  const currentDayOfWeek = new Date().getDay();

  // If date changed or no tasks saved, initialize new daily cycle
  if (savedDate !== today) {
    const routine = WEEKLY_ROUTINES[currentDayOfWeek];
    const initialTasks: DailyTask[] = [
      ...DEFAULT_DAILY_TASKS.map((t) => ({
        ...t,
        progress: 0,
        completed: false,
        claimed: false,
      })),
      ...(routine
        ? [
            {
              ...routine,
              progress: 0,
              completed: false,
              claimed: false,
            },
          ]
        : []),
    ];

    localStorage.setItem(dateKey, today);
    localStorage.setItem(dataKey, JSON.stringify(initialTasks));
    return initialTasks;
  }

  try {
    const raw = localStorage.getItem(dataKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DailyTask[];
    // Synchronize calibrated definitions (rewards, descriptions) while preserving user progress
    const routine = WEEKLY_ROUTINES[currentDayOfWeek];
    return parsed.map((p) => {
      const def = DEFAULT_DAILY_TASKS.find((d) => d.id === p.id) || (routine && routine.id === p.id ? routine : null);
      if (def) {
        return {
          ...p,
          reward: def.reward,
          title: def.title,
          desc: def.desc,
          target: def.target,
        };
      }
      return p;
    });
  } catch {
    return [];
  }
}

/**
 * Increment progress for a task and trigger pet voice notification when completed
 */
export function incrementTaskProgress(userId: string = 'guest', taskId: string, delta: number = 1) {
  if (typeof window === 'undefined') return;

  const tasks = getDailyTasksState(userId);
  const dataKey = `shadow_tasks_data_${userId}`;
  let taskCompletedJustNow = false;
  let finishedTask: DailyTask | null = null;

  const updatedTasks = tasks.map((t) => {
    if (t.id === taskId && !t.completed) {
      const newProgress = Math.min(t.target, t.progress + delta);
      const isComplete = newProgress >= t.target;
      if (isComplete && !t.completed) {
        taskCompletedJustNow = true;
        finishedTask = { ...t, progress: newProgress, completed: true };
      }
      return {
        ...t,
        progress: newProgress,
        completed: isComplete,
      };
    }
    return t;
  });

  localStorage.setItem(dataKey, JSON.stringify(updatedTasks));
  window.dispatchEvent(new CustomEvent('shadow-daily-tasks-updated'));

  // If completed, trigger companion notification to WhisperIsland
  if (taskCompletedJustNow && finishedTask) {
    const task = finishedTask as DailyTask;
    window.dispatchEvent(
      new CustomEvent('shadow-pet-notify', {
        detail: {
          text: `Quest Finished: "${task.title}"! Tap here to claim 🪙 ${task.reward} coins!`,
          mood: 'excited',
          sound: 'gummyPop',
          targetTab: 'tasks',
        },
      })
    );
  }
}

export function recordDailyTaskProgress(arg1: string, arg2?: string | number, arg3?: number) {
  if (typeof arg2 === 'number' || arg2 === undefined) {
    // Called as (taskId, delta?)
    const taskId = arg1;
    const delta = typeof arg2 === 'number' ? arg2 : 1;
    return incrementTaskProgress('guest', taskId, delta);
  } else {
    // Called as (userId, taskId, delta?)
    const userId = arg1;
    const taskId = String(arg2);
    const delta = typeof arg3 === 'number' ? arg3 : 1;
    return incrementTaskProgress(userId, taskId, delta);
  }
}

/**
 * Claim coins for a completed task
 */
export function claimTaskReward(userId: string = 'guest', taskId: string): boolean {
  if (typeof window === 'undefined') return false;

  const tasks = getDailyTasksState(userId);
  const dataKey = `shadow_tasks_data_${userId}`;
  let claimedCoins = 0;
  let taskTitle = '';

  const updatedTasks = tasks.map((t) => {
    if (t.id === taskId && t.completed && !t.claimed) {
      claimedCoins = t.reward;
      taskTitle = t.title;
      return { ...t, claimed: true };
    }
    return t;
  });

  if (claimedCoins > 0) {
    localStorage.setItem(dataKey, JSON.stringify(updatedTasks));
    window.dispatchEvent(new CustomEvent('shadow-daily-tasks-updated'));

    // Credit coins
    addCoinsToBalance(userId, claimedCoins);

    // Notify pet
    window.dispatchEvent(
      new CustomEvent('shadow-pet-notify', {
        detail: {
          text: `Claimed +🪙 ${claimedCoins} coins for "${taskTitle}"!`,
          mood: 'celebrating',
          sound: 'gummyBubble',
          targetTab: 'tasks',
        },
      })
    );

    return true;
  }

  return false;
}

/**
 * Helper to add coins to balance & trigger sync
 */
export function addCoinsToBalance(userId: string, amount: number) {
  if (typeof window === 'undefined') return;

  const coinKey = userId ? `shadow_coins_${userId}` : 'shadow_coins_guest';
  const current = parseInt(localStorage.getItem(coinKey) || '50', 10);
  const updated = Math.max(0, current + amount);
  localStorage.setItem(coinKey, String(updated));

  // Sync to Supabase in background if authenticated
  if (userId && userId !== 'guest') {
    supabase.from('profiles').update({ coins: updated }).eq('id', userId).then().catch(() => {});
  }

  window.dispatchEvent(new CustomEvent('shadow-coins-updated', { detail: { coins: updated } }));
}
