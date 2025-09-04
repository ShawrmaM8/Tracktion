// src/services/db.ts
import { openDB, IDBPDatabase } from 'idb';
import type { Vision, Priority, Project, Task, DailyPlan, UUID } from 'models/schema';
import { v4 as uuid } from 'uuid';

// This module exports a factory that chooses the appropriate adapter
// based on environment (Electron -> SQLite; Browser -> IndexedDB).
export interface DataStore {
    init(): Promise<void>;
    // visions / priorities / projects
    getVisions(): Promise<Vision[]>;
    upsertVision(v: Omit<Vision, 'id' | 'createdAt'> & { id?: string }): Promise<Vision>;
    getPriorities(): Promise<Priority[]>;
    upsertPriority(p: Omit<Priority, 'id' | 'createdAt'> & { id?: string }): Promise<Priority>;
    getAllProjects(): Promise<Project[]>;
    upsertProject(p: Project): Promise<Project>;
    // daily plans
    getDailyPlan(date: string): Promise<DailyPlan | null>;
    saveDailyPlan(plan: DailyPlan): Promise<void>;
    // leveling persistence
    getLevelState(): Promise<any>;
    saveLevelState(s: any): Promise<void>;
    appendXPEvent(e: any): Promise<void>;
    getXPEvents(): Promise<any[]>;
    // achievements
    getAchievements(): Promise<any[]>;
    saveAchievements(a: any[]): Promise<void>;
    // export/import
    exportSnapshot(): Promise<object>;
    importSnapshot(snapshot: object): Promise<void>;
}

let db: IDBPDatabase | null = null;

export const createIndexedDBStore = (): DataStore => {
    return {
        async init() {
            if (db) return;
            db = await openDB('disciplined', 3, {
                upgrade(upgradeDb) {
                    if (!upgradeDb.objectStoreNames.contains('visions'))
                        upgradeDb.createObjectStore('visions', { keyPath: 'id' });
                    if (!upgradeDb.objectStoreNames.contains('priorities'))
                        upgradeDb.createObjectStore('priorities', { keyPath: 'id' });
                    if (!upgradeDb.objectStoreNames.contains('projects'))
                        upgradeDb.createObjectStore('projects', { keyPath: 'id' });
                    if (!upgradeDb.objectStoreNames.contains('dailyPlans'))
                        upgradeDb.createObjectStore('dailyPlans', { keyPath: 'date' });
                    if (!upgradeDb.objectStoreNames.contains('levelState'))
                        upgradeDb.createObjectStore('levelState', { keyPath: 'id' });
                    if (!upgradeDb.objectStoreNames.contains('xpEvents'))
                        upgradeDb.createObjectStore('xpEvents', { keyPath: 'id' });
                    if (!upgradeDb.objectStoreNames.contains('achievements'))
                        upgradeDb.createObjectStore('achievements', { keyPath: 'id' });
                },
            });
        },
        // visions
        async getVisions() {
            if (!db) throw new Error('db not initialized');
            return (await db.getAll('visions')) as Vision[];
        },
        async upsertVision(v) {
            if (!db) throw new Error('db not initialized');
            const id = v.id ?? uuid();
            const item: Vision = { id, createdAt: Date.now(), ...v } as Vision;
            await db.put('visions', item);
            return item;
        },
        // priorities
        async getPriorities() {
            if (!db) throw new Error('db not initialized');
            return (await db.getAll('priorities')) as Priority[];
        },
        async upsertPriority(p) {
            if (!db) throw new Error('db not initialized');
            const id = p.id ?? uuid();
            const item: Priority = { id, createdAt: Date.now(), ...p } as Priority;
            await db.put('priorities', item);
            return item;
        },
        // projects
        async getAllProjects() {
            if (!db) throw new Error('db not initialized');
            return (await db.getAll('projects')) as Project[];
        },
        async upsertProject(p) {
            if (!db) throw new Error('db not initialized');
            const id = p.id ?? uuid();
            const item: Project = { id, createdAt: Date.now(), ...p } as Project;
            await db.put('projects', item);
            return item;
        },
        // daily plans
        async getDailyPlan(date) {
            if (!db) throw new Error('db not initialized');
            return (await db.get('dailyPlans', date)) as DailyPlan | null;
        },
        async saveDailyPlan(plan) {
            if (!db) throw new Error('db not initialized');
            await db.put('dailyPlans', plan);
        },
        // leveling
        async getLevelState() {
            if (!db) throw new Error('db not initialized');
            const item = await db.getAll('levelState');
            return (item && item[0]) || null;
        },
        async saveLevelState(s) {
            if (!db) throw new Error('db not initialized');
            await db.put('levelState', { id: 'singleton', ...s });
        },
        async appendXPEvent(e) {
            if (!db) throw new Error('db not initialized');
            await db.put('xpEvents', e);
        },
        async getXPEvents() {
            if (!db) throw new Error('db not initialized');
            return await db.getAll('xpEvents');
        },
        // achievements
        async getAchievements() {
            if (!db) throw new Error('db not initialized');
            return await db.getAll('achievements');
        },
        async saveAchievements(a) {
            if (!db) throw new Error('db not initialized');
            // store each achievement by id
            for (const ach of a) await db.put('achievements', ach);
        },
        // export/import
        async exportSnapshot() {
            if (!db) throw new Error('db not initialized');
            const [visions, priorities, projects, dailyPlans, levelState, xpEvents, achievements] =
                await Promise.all([
                    db.getAll('visions'),
                    db.getAll('priorities'),
                    db.getAll('projects'),
                    db.getAll('dailyPlans'),
                    db.getAll('levelState'),
                    db.getAll('xpEvents'),
                    db.getAll('achievements'),
                ]);
            return { visions, priorities, projects, dailyPlans, levelState, xpEvents, achievements };
        },
        async importSnapshot(snapshot) {
            if (!db) throw new Error('db not initialized');
            const tx = db.transaction(
                [
                    'visions',
                    'priorities',
                    'projects',
                    'dailyPlans',
                    'levelState',
                    'xpEvents',
                    'achievements',
                ],
                'readwrite'
            );
            for (const v of (snapshot as any).visions || [])
                await tx.objectStore('visions').put(v);
            for (const p of (snapshot as any).priorities || [])
                await tx.objectStore('priorities').put(p);
            for (const pr of (snapshot as any).projects || [])
                await tx.objectStore('projects').put(pr);
            for (const d of (snapshot as any).dailyPlans || [])
                await tx.objectStore('dailyPlans').put(d);
            for (const l of (snapshot as any).levelState || [])
                await tx.objectStore('levelState').put(l);
            for (const x of (snapshot as any).xpEvents || [])
                await tx.objectStore('xpEvents').put(x);
            for (const a of (snapshot as any).achievements || [])
                await tx.objectStore('achievements').put(a);
            await tx.done;
        },
    };
};

// NOTE: For Electron (Node) we recommend implementing a SQLite adapter using better-sqlite3
// that implements the same DataStore interface. The app's bootstrap should detect environment
// and load the appropriate adapter (createIndexedDBStore in the browser, createSQLiteStore in electron main via preload bridge)