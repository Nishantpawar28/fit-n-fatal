export type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getDateRangeStart(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return startOfDay(d);
    }
    case 'month': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return startOfDay(d);
    }
    case 'quarter': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return startOfDay(d);
    }
    case 'year': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return startOfDay(d);
    }
    case 'all':
      return null;
  }
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDuration(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : new Date();
  const mins = Math.floor((end.getTime() - start.getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export function groupByDate<T extends { started_at?: string; created_at?: string }>(
  items: T[],
  dateKey: 'started_at' | 'created_at' = 'started_at'
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const raw = item[dateKey];
      if (!raw) return acc;
      const key = startOfDay(new Date(raw)).toISOString().split('T')[0];
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}
