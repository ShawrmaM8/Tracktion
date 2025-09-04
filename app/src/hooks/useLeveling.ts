// src/hooks/useLeveling.ts
import { useEffect, useState } from 'react';
import type { DataStore } from '../services/db';
import { createEmptyState, recordCompletion as recordCompletionFunc } from '../services/leveling';
import { evaluateAchievements } from '../services/achievements';

export function useLeveling(store: DataStore) {
  const [state, setState] = useState(createEmptyState());
  const [achievements, setAchievements] = useState<ReturnType<typeof evaluateAchievements>>([]);

  useEffect(()=>{
    (async ()=>{
      const s = await store.getLevelState();
      setState(s || createEmptyState());
      const ev = await store.getXPEvents();
      const ach = await store.getAchievements?.() || [];
      setAchievements(ach);
    })();
  },[]);

  async function recordCompletion(taskId: string|undefined, minutes: number, priorityWeight=0.5, categoryMultiplier=1) {
    const { state: next, event } = recordCompletionFunc(state, minutes, taskId, priorityWeight, categoryMultiplier);
    await store.appendXPEvent(event);
    await store.saveLevelState(next);
    const evts = await store.getXPEvents();
    const newAchievements = evaluateAchievements(next, achievements, evts);
    await store.saveAchievements?.(newAchievements);
    setAchievements(newAchievements);
    setState(next);
    return { next, event, newAchievements };
  }

  return { state, achievements, recordCompletion };
}
