import type { SQLiteDatabase } from 'expo-sqlite';
import type { FarmTask, TaskStatus } from '../domain/rules';

export type Cow = { id:string; name:string; breed:string; healthNote:string; lastMilkLitres:string };
export type OutboxItem = { operationId:string; taskId:string; status:TaskStatus; updatedAt:string };
export const seededCows: Cow[] = [
  {id:'COW-101',name:'Daisy',breed:'Holstein',healthNote:'Health observation due',lastMilkLitres:'12.6'},
  {id:'COW-102',name:'Bella',breed:'Friesian',healthNote:'Normal',lastMilkLitres:'16.1'},
  {id:'COW-103',name:'Luna',breed:'Jersey',healthNote:'Feeding follow-up',lastMilkLitres:'9.4'},
];
const seededTasks: FarmTask[] = [
  {id:'TASK-001',cowId:'COW-101',title:'Check temperature',note:'Follow up on recent health observation',priority:'critical',status:'open',shift:'morning',dueAt:'2026-10-23T06:00:00.000Z',assignedTo:'worker-1',syncState:'synced'},
  {id:'TASK-002',cowId:'COW-101',title:'Record morning milk',note:'Record latest yield in cow profile',priority:'normal',status:'open',shift:'morning',dueAt:'2026-10-26T10:00:00.000Z',assignedTo:'worker-1',syncState:'synced'},
  {id:'TASK-003',cowId:'COW-102',title:'Inspect hooves',note:'Routine inspection',priority:'high',status:'open',shift:'afternoon',dueAt:'2026-10-25T09:00:00.000Z',assignedTo:'worker-1',syncState:'synced'},
  {id:'TASK-004',cowId:'COW-103',title:'Check feed intake',note:'Check issue reported by previous shift',priority:'high',status:'open',shift:'night',dueAt:'2026-10-23T20:00:00.000Z',assignedTo:'worker-1',syncState:'synced'},
];

export async function initDatabase(db: SQLiteDatabase) {
  await db.execAsync(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS cows (id TEXT PRIMARY KEY,name TEXT NOT NULL,breed TEXT NOT NULL,health_note TEXT NOT NULL,last_milk_litres TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY,cow_id TEXT NOT NULL,title TEXT NOT NULL,note TEXT NOT NULL,priority TEXT NOT NULL,status TEXT NOT NULL,shift TEXT NOT NULL,due_at TEXT NOT NULL,assigned_to TEXT NOT NULL,updated_at TEXT,sync_state TEXT NOT NULL DEFAULT 'synced');
    CREATE TABLE IF NOT EXISTS outbox (operation_id TEXT PRIMARY KEY,task_id TEXT NOT NULL,status TEXT NOT NULL,updated_at TEXT NOT NULL);
  `);
  for (const cow of seededCows) await db.runAsync('INSERT OR IGNORE INTO cows VALUES(?,?,?,?,?)',cow.id,cow.name,cow.breed,cow.healthNote,cow.lastMilkLitres);
  for (const t of seededTasks) await db.runAsync('INSERT OR IGNORE INTO tasks(id,cow_id,title,note,priority,status,shift,due_at,assigned_to,sync_state) VALUES(?,?,?,?,?,?,?,?,?,?)',t.id,t.cowId,t.title,t.note,t.priority,t.status,t.shift,t.dueAt,t.assignedTo,t.syncState ?? 'synced');
}

export async function readCows(db:SQLiteDatabase):Promise<Cow[]> {
  const rows=await db.getAllAsync<{id:string;name:string;breed:string;health_note:string;last_milk_litres:string}>('SELECT * FROM cows ORDER BY id');
  return rows.map(r=>({id:r.id,name:r.name,breed:r.breed,healthNote:r.health_note,lastMilkLitres:r.last_milk_litres}));
}
export async function readTasks(db:SQLiteDatabase):Promise<FarmTask[]> {
  const r=await db.getAllAsync<any>('SELECT * FROM tasks ORDER BY id');
  return r.map(x=>({id:x.id,cowId:x.cow_id,title:x.title,note:x.note,priority:x.priority,status:x.status,shift:x.shift,dueAt:x.due_at,assignedTo:x.assigned_to,updatedAt:x.updated_at,syncState:x.sync_state}));
}
export async function pendingOperations(db:SQLiteDatabase):Promise<OutboxItem[]> {
  const rows=await db.getAllAsync<any>('SELECT * FROM outbox ORDER BY updated_at');
  return rows.map(r=>({operationId:r.operation_id,taskId:r.task_id,status:r.status,updatedAt:r.updated_at}));
}
export async function completeOffline(db:SQLiteDatabase, taskId:string):Promise<void> {
  const stamp=new Date().toISOString();
  const operationId=`op-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  await db.withExclusiveTransactionAsync(async tx=>{
    const result=await tx.runAsync("UPDATE tasks SET status='done',updated_at=?,sync_state='pending' WHERE id=? AND status='open'",stamp,taskId);
    if (result.changes!==1) throw new Error('Task was already completed or cannot be found.');
    await tx.runAsync('INSERT INTO outbox(operation_id,task_id,status,updated_at) VALUES(?,?,?,?)',operationId,taskId,'done',stamp);
  });
}
export async function markAcknowledged(db:SQLiteDatabase, ackIds:string[]) {
  for(const id of ackIds) {
    await db.withExclusiveTransactionAsync(async tx=>{
      const op=await tx.getFirstAsync<{task_id:string}>('SELECT task_id FROM outbox WHERE operation_id=?',id);
      if (!op) return;
      await tx.runAsync('DELETE FROM outbox WHERE operation_id=?',id);
      const rest=await tx.getFirstAsync<{n:number}>('SELECT COUNT(*) as n FROM outbox WHERE task_id=?',op.task_id);
      if ((rest?.n??0)===0) await tx.runAsync("UPDATE tasks SET sync_state='synced' WHERE id=?",op.task_id);
    });
  }
}
