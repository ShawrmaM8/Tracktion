import React, { useState } from 'react';
import { createIndexedDBStore } from '../services/db';

export default function ProjectEditor() {
  const store = createIndexedDBStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('code');

  const addProject = async () => {
    if (!title) return;
    await store.addProject({ title, category });
    setTitle('');
    alert('Project added!');
  };

  return (
    <div className="p-4 bg-white rounded shadow space-y-2">
      <div className="font-bold mb-2">Add New Project</div>
      <input type="text" placeholder="Project title" value={title} onChange={e => setTitle(e.target.value)}
             className="w-full p-2 border rounded"/>
      <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full p-2 border rounded">
        <option value="code">Code</option>
        <option value="language">Language</option>
        <option value="fitness">Fitness</option>
        <option value="career">Career</option>
        <option value="personal">Personal</option>
        <option value="other">Other</option>
      </select>
      <button onClick={addProject} className="px-3 py-2 bg-blue-600 text-white rounded">Add Project</button>
    </div>
  );
}
