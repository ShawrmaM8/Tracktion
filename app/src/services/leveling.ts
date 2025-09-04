// src/services/leveling.ts
import type { UUID } from '../models/schema';
import { v4 as uuid } from 'uuid';
import { startOfDay } from 'date-fns';

export interface XPEvent {
  id: UUID;
  taskId?: UUID;
  minutes: number;
  priorityWeight: number; // 0..1
  categoryMultiplier: number; // e.g., 1 for default, 1.2 for high-impact
  timestamp: number;
  xp: number;
}

export interface LevelState {
  totalXP: number;
  level: number;
  events: XPEvent[];
  streakDays: number; // current consecutive days with >= dailyThreshold
  longestStreak: number;
}

// Config
export const DEFAULT_DAILY_STREAK_MIN = 15;
export const BASE_XP_PER_MIN = 1;

// XP calculation
export function calculateXP(minutes: number, priorityWeight = 0.5, categoryMultiplier = 1) {
  const raw = minutes * BASE_XP_PER_MIN * Math.max(0.1, priorityWeight) * Math.max(0.5, categoryMultiplier);
  return Math.round(raw);
}

// Leveling curve
export function levelFromXP(xp: number) {
  if (xp <= 0) return 1;
  return Math.max(1, Math.floor(Math.log2(xp / 100 + 1)) + 1);
}

// XP needed for a level
export function xpForLevel(level: number) {
  if (level <= 1) return 0;
  return Math.round(100 * (Math.pow(2, level - 1) - 1));
}

// Event factory
export function createXPEvent({ taskId, minutes, priorityWeight = 0.5, categoryMultiplier = 1 }: {
  taskId?: UUID;
  minutes: number;
  priorityWeight?: number;
  categoryMultiplier?: number;
}): XPEvent {
  const xp = calculateXP(minutes, priorityWeight, categoryMultiplier);
  return { id: uuid(), taskId, minutes, priorityWeight, categoryMultiplier, timestamp: Date.now(), xp };
}

// Apply an XPEvent
export function applyXPEvent(state: LevelState, event: XPEvent): LevelState {
  const total = state.totalXP + event.xp;
  const nextLevel = levelFromXP(total);
  return { ...state, totalXP: total, level: nextLevel, events: [...state.events, event] };
}

// Update streaks
export function updateStreaks(state: LevelState, events: XPEvent[], dailyThreshold = DEFAULT_DAILY_STREAK_MIN) {
  const byDay = new Map<string, number>();
  for (const e of events) {
    const d = startOfDay(e.timestamp).toISOString().slice(0,10);
    byDay.set(d, (byDay.get(d) || 0) + e.minutes);
  }
  const days = Array.from(byDay.keys()).sort();
  const qualifies = new Set(days.filter(d => byDay.get(d)! >= dailyThreshold));
  let streak = 0;
  let cursor = startOfDay(Date.now());
  while(true) {
    const key = cursor.toISOString().slice(0,10);
    if (qualifies.has(key)) { streak++; cursor = new Date(cursor.getTime() - 24*3600*1000); }
    else break;
  }
  const longest = Math.max(state.longestStreak || 0, streak);
  return { streakDays: streak, longestStreak: longest };
}

// Initialize LevelState
export function createEmptyState(): LevelState {
  return { totalXP: 0, level: 1, events: [], streakDays: 0, longestStreak: 0 };
}

// Record completion convenience
export function recordCompletion(state: LevelState, minutes: number, taskId?: UUID, priorityWeight=0.5, categoryMultiplier=1) {
  const event = createXPEvent({ taskId, minutes, priorityWeight, categoryMultiplier });
  let next = applyXPEvent(state, event);
  const streaks = updateStreaks(next, next.events);
  next.streakDays = streaks.streakDays;
  next.longestStreak = streaks.longestStreak;
  return { state: next, event };
}
