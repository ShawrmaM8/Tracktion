import React from 'react';

interface TaskCardProps {
  title: string;
  minutes: number;
  onComplete: () => void;
}

export default function TaskCard({ title, minutes, onComplete }: TaskCardProps) {
  return (
    <div className="p-3 bg-gray-50 rounded shadow flex justify-between items-center">
      <div>{title} ({minutes} min)</div>
      <button className="px-2 py-1 bg-green-500 text-white rounded" onClick={onComplete}>Done</button>
    </div>
  );
}
