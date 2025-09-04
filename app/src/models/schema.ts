export type UUID = string;
export type Category = 'code'|'language'|'fitness'|'career'|'personal'|'other';

export interface Vision { id: UUID; title: string; description?: string; horizonYears: number; createdAt: number; }
export interface Priority { id: UUID; visionId: UUID; title: string; weight: number; createdAt: number; }
export interface Project { id: UUID; priorityId: UUID; title: string; category: Category; description?: string; milestones: Milestone[]; createdAt: number; }
export interface Milestone { id: UUID; title: string; targetDate?: number|null; tasks: Task[]; }
export interface Task { id: UUID; title: string; estimateMinutes: number; completedAt?: number|null; score?: number; createdAt: number; }
export interface DailyPlan { date: string; tasks: { taskId: UUID; plannedMinutes: number }[]; createdAt: number; }
