import React, { useState } from 'react';
import { createIndexedDBStore } from '../services/db';

export default function QuickAdd() {
  const store = createIndexedDBStore();
  const [taskTitle, setTaskTitle] = useState('');
  const [minutes, setMinutes] = useState(15);

  const addTask = async () => {
    if (!taskTitle) return;
    await store.addQuickTask({ title: taskTitle, estimateMinutes: minutes });
    setTaskTitle('');
    setMinutes(15);
  };

  return (
    <div className="p-4 bg-white rounded shadow space-y-2">
      <div className="font-bold mb-2">Quick Add Task</div>
      <input type="text" placeholder="Task title" value={taskTitle}
             onChange={e => setTaskTitle(e.target.value)} className="w-full p-2 border rounded"/>
      <input type="number" placeholder="Minutes" value={minutes} onChange={e => setMinutes(Number(e.target.value))}
             className="w-full p-2 border rounded"/>
      <button onClick={addTask} className="px-3 py-2 bg-blue-600 text-white rounded">Add Task</button>
    </div>
  );
}
