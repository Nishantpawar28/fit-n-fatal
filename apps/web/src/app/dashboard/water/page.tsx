'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { getWaterEntriesForDate, addWaterEntry, deleteWaterEntry } from '@fit-n-fatal/db';
import { Card, Button, Input, ProgressRing } from '@/components/ui';
import { useProfile } from '@/lib/use-profile';
import { formatWater } from '@fit-n-fatal/utils';

const QUICK_AMOUNTS = [250, 500, 750, 1000];

function addDays(date: string, delta: number) {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().split('T')[0];
}

export default function WaterPage() {
  const { userId, profile } = useProfile();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [custom, setCustom] = useState('');

  const { data: entries } = useQuery({
    queryKey: ['waterEntries', userId, date],
    queryFn: () => getWaterEntriesForDate(userId!, date),
    enabled: !!userId,
  });

  const addMutation = useMutation({
    mutationFn: (ml: number) => addWaterEntry(userId!, ml),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waterEntries'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWaterEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waterEntries'] }),
  });

  const total = (entries ?? []).reduce((s, e) => s + e.amount_ml, 0);
  const goal = profile?.daily_water_goal_ml ?? 3000;
  const unit = profile?.water_unit ?? 'ml';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold text-fnf-text">Hydration</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setDate((d) => addDays(d, -1))} className="text-fnf-muted hover:text-fnf-text p-1"><ChevronLeft size={18} /></button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-fnf-surface border border-purple-500/15 rounded-lg px-3 py-1.5 text-sm text-fnf-text" />
          <button onClick={() => setDate((d) => addDays(d, 1))} className="text-fnf-muted hover:text-fnf-text p-1"><ChevronRight size={18} /></button>
        </div>
      </div>

      <Card className="mb-6 flex flex-col items-center py-8">
        <ProgressRing value={total} max={goal} size={140} strokeWidth={12} color="#3FC5FF" label={formatWater(total, unit)} sublabel={`of ${formatWater(goal, unit)}`} />
        <p className="text-fnf-muted text-sm mt-4">{Math.min(100, Math.round((total / goal) * 100))}% of daily goal</p>
      </Card>

      <Card className="mb-6">
        <p className="font-medium text-fnf-text mb-3">Quick Add</p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {QUICK_AMOUNTS.map((ml) => (
            <button
              key={ml}
              onClick={() => addMutation.mutate(ml)}
              className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 rounded-xl py-3 text-sm font-medium"
            >
              +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={custom} onChange={setCustom} type="number" placeholder="Custom amount (ml)" />
          <Button onClick={() => { const v = parseInt(custom, 10); if (v > 0) { addMutation.mutate(v); setCustom(''); } }}>Add</Button>
        </div>
      </Card>

      <Card>
        <p className="font-medium text-fnf-text mb-3">Today&apos;s Log</p>
        {(entries ?? []).length === 0 && <p className="text-fnf-muted text-sm">No water logged yet.</p>}
        <div className="space-y-1.5">
          {(entries ?? []).map((e) => (
            <div key={e.id} className="flex justify-between items-center text-sm">
              <span className="text-fnf-secondary">{formatWater(e.amount_ml, unit)}</span>
              <div className="flex items-center gap-3">
                <span className="text-fnf-muted text-xs">{new Date(e.logged_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                <button onClick={() => deleteMutation.mutate(e.id)} className="text-fnf-muted hover:text-red-400"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
