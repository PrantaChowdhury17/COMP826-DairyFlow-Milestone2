/** Pure context-priority rules; usable without network, camera or UI. */
export type Role = 'worker' | 'manager';
export type Shift = 'morning' | 'afternoon' | 'night';
export type TaskStatus = 'open' | 'done';
export type TaskPriority = 'critical' | 'high' | 'normal';

export type FarmTask = {
  id: string;
  cowId: string;
  title: string;
  note: string;
  priority: TaskPriority;
  status: TaskStatus;
  shift: Shift;
  dueAt: string;
  assignedTo: string;
  updatedAt?: string;
  syncState?: 'synced' | 'pending';
};

export type TaskContext = { role: Role; shift: Shift; userId: string; cowId?: string; now: Date };

export function currentShift(hour: number): Shift {
  if (hour >= 5 && hour < 13) return 'morning';
  if (hour >= 13 && hour < 21) return 'afternoon';
  return 'night';
}

export function priorityScore(task: FarmTask, context: TaskContext): number {
  if (task.status === 'done') return -1;
  const base = task.priority === 'critical' ? 100 : task.priority === 'high' ? 60 : 20;
  const overdue = new Date(task.dueAt).getTime() < context.now.getTime() ? 30 : 0;
  const cow = context.cowId && task.cowId === context.cowId ? 20 : 0;
  const shift = task.shift === context.shift ? 10 : 0;
  const assigned = task.assignedTo === context.userId ? 5 : 0;
  const managerBacklog = context.role === 'manager' && task.shift !== context.shift ? 15 : 0;
  return base + overdue + cow + shift + assigned + managerBacklog;
}

export function prioritiseTasks(tasks: FarmTask[], context: TaskContext): FarmTask[] {
  return tasks.filter(t => t.status === 'open' && (!context.cowId || t.cowId === context.cowId))
    .sort((a, b) => priorityScore(b, context) - priorityScore(a, context) || a.dueAt.localeCompare(b.dueAt));
}

export function parseCowQr(raw: string): string | null {
  const text = raw.trim().toUpperCase();
  const id = text.startsWith('DAIRYFARM:COW:') ? text.slice(14) : text;
  return /^COW-\d{3}$/.test(id) ? id : null;
}
