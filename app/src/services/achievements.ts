// src/services/achievements.ts
import type { LevelState, XPEvent } from './leveling';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt?: number;
}

export const ACHIEVEMENT_DEFS: Achievement[] = [
  { id: 'first_task', title: 'First Task', description: 'Complete your first task' },
  { id: 'week_streak', title: '7-day Streak', description: 'Maintain a 7-day streak' },
  { id: 'time_1000', title: '1000 Minutes', description: 'Accumulate 1000 minutes recorded' },
  { id: 'category_master', title: 'Category Master', description: 'Complete 10 tasks in a single category' },
];

export function evaluateAchievements(state: LevelState, existing: Achievement[], events: XPEvent[]): Achievement[] {
  const unlocked = [...existing];
  const unlockedIds = new Set(unlocked.filter(a => a.unlockedAt).map(a => a.id));

  // first task
  if (!unlockedIds.has('first_task') && events.length >= 1) {
    unlocked.push({ ...ACHIEVEMENT_DEFS.find(a => a.id === 'first_task')!, unlockedAt: Date.now() });
  }

  // week streak
  if (!unlockedIds.has('week_streak') && state.streakDays >= 7) {
    unlocked.push({ ...ACHIEVEMENT_DEFS.find(a => a.id === 'week_streak')!, unlockedAt: Date.now() });
  }

  // time_1000
  const totalMinutes = events.reduce((s, e) => s + e.minutes, 0);
  if (!unlockedIds.has('time_1000') && totalMinutes >= 1000) {
    unlocked.push({ ...ACHIEVEMENT_DEFS.find(a => a.id === 'time_1000')!, unlockedAt: Date.now() });
  }

  return unlocked;
}


