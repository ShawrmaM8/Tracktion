import type { DataStore } from './db';
import type { Task, Project, Priority, DailyPlan } from '../models/schema';
import { differenceInCalendarDays } from 'date-fns';

function scoreTask(task: Task, project: Project, priority: Priority): number {
  const estimate = Math.max(5, task.estimateMinutes || 30);
  const base = estimate * (priority?.weight ?? 0.5);
  let urgency = 1;
  const targets = project.milestones.map(m=>m.targetDate).filter(Boolean) as number[];
  if(targets.length) {
    const nearest = Math.min(...targets);
    const days = Math.max(1, differenceInCalendarDays(new Date(nearest), new Date()));
    urgency = Math.min(10, 30 / days);
  }
  return task.completedAt ? 0 : base * urgency;
}

export async function generateDailyPlan(opts: { store: DataStore; date: string; dailyAvailableMinutes: number; maxTasks?: number }): Promise<DailyPlan> {
  const { store, date, dailyAvailableMinutes, maxTasks=8 } = opts;
  const projects = await store.getAllProjects();
  const priorities = await store.getPriorities();
  const scored: {task: Task, score: number}[] = [];
  for(const p of projects) {
    const pr = priorities.find(x=>x.id===p.priorityId) || { weight:0.5 } as Priority;
    for(const m of p.milestones) for(const t of m.tasks) if(!t.completedAt) scored.push({task:t, score:scoreTask(t,p,pr)});
  }
  scored.sort((a,b)=>b.score - a.score);
  const planTasks = [];
  let remaining = dailyAvailableMinutes, count=0;
  for(const s of scored) {
    if(count>=maxTasks || remaining<=0) break;
    const take = Math.min(s.task.estimateMinutes||30, remaining);
    planTasks.push({ taskId: s.task.id, plannedMinutes: take });
    remaining -= take;
    count++;
  }
  const plan: DailyPlan = { date, tasks: planTasks, createdAt: Date.now() };
  await store.saveDailyPlan(plan);
  return plan;
}
