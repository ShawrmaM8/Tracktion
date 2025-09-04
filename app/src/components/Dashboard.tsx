import React, { useEffect, useState } from 'react';
import { useLeveling } from '../hooks/useLeveling';
import { createIndexedDBStore } from '../services/db';
import Planner from './Planner';
import ProjectEditor from './ProjectEditor';
import QuickAdd from './QuickAdd';
import TaskCard from './TaskCard';
import { xpForLevel } from '../services/leveling';

export default function Dashboard() {
  const store = createIndexedDBStore();
  const { state, achievements, recordCompletion } = useLeveling(store as any);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<{id: string, title: string, minutes: number}[]>([]);

  useEffect(() => {
    (async () => {
      await store.init();

      // Load today’s tasks
      const plan = await store.getDailyPlan(new Date().toISOString().slice(0,10));
      setTasks(plan?.tasks.map(t => ({ id: t.taskId, title: t.taskId, minutes: t.plannedMinutes })) || []);

      setLoading(false);
    })();
  }, []);

  const completeTask = async (taskId: string, minutes: number) => {
    await recordCompletion(taskId, minutes);
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  if (loading) return <div>Loading...</div>;

  const nextXp = xpForLevel(state.level + 1);
  const prevXp = xpForLevel(state.level);
  const progress = (state.totalXP - prevXp) / (nextXp - prevXp);

  return (
    <div className="space-y-6">
      {/* Level & XP */}
      <div className="p-6 bg-white rounded shadow">
        <div className="text-xl font-bold">Level {state.level}</div>
        <div className="text-sm text-gray-500">Total XP: {state.totalXP}</div>
        <div className="w-full bg-gray-200 h-3 rounded mt-2">
          <div style={{ width: `${Math.round(progress*100)}%` }} className="bg-blue-500 h-3 rounded"/>
        </div>
        <div className="mt-2 text-sm">Streak: {state.streakDays} days (Longest: {state.longestStreak})</div>
      </div>

      {/* Achievements */}
      <div className="p-6 bg-white rounded shadow">
        <div className="text-lg font-bold mb-2">Achievements</div>
        {achievements.length === 0 ? (
          <div className="text-gray-500">No achievements yet.</div>
        ) : (
          <ul className="list-disc ml-5">
            {achievements.map(a => (
              <li key={a.id} className="mb-1">
                {a.title} {a.unlockedAt ? '✅' : '❌'}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Planner / Today’s tasks */}
      <div className="p-6 bg-white rounded shadow">
        <div className="font-bold mb-2">Today's Plan</div>
        {tasks.length === 0 ? <div className="text-gray-500">No tasks today</div> :
          tasks.map(t => (
            <TaskCard key={t.id} title={t.title} minutes={t.minutes} onComplete={() => completeTask(t.id, t.minutes)} />
          ))
        }
      </div>

      {/* Quick Add */}
      <QuickAdd />

      {/* Project Editor */}
      <ProjectEditor />
    </div>
  );
}
