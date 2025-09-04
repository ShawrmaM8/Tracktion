import React, { useEffect, useState } from 'react';
import { useLeveling } from '../hooks/useLeveling';
import { createIndexedDBStore } from '../services/db';
import { todayYMD } from '../services/util/time';

export default function Planner() {
  const store = createIndexedDBStore();
  const { state, recordCompletion } = useLeveling(store as any);
  const [tasks, setTasks] = useState<{id: string, title: string, minutes: number}[]>([]);

  useEffect(() => {
    (async () => {
      await store.init();
      const plan = await store.getDailyPlan(todayYMD());
      setTasks(plan?.tasks.map(t => ({ id: t.taskId, title: t.taskId, minutes: t.plannedMinutes })) || []);
    })();
  }, []);

  const completeTask = async (taskId: string, minutes: number) => {
    await recordCompletion(taskId, minutes);
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  return (
    <div className="p-4 bg-white rounded shadow space-y-2">
      <div className="font-bold mb-2">Today's Plan</div>
      {tasks.length === 0 ? <div className="text-gray-500">No tasks for today</div> :
        tasks.map(t => (
          <div key={t.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <div>{t.title} ({t.minutes} min)</div>
            <button className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => completeTask(t.id, t.minutes)}>Done</button>
          </div>
        ))
      }
    </div>
  );
}
