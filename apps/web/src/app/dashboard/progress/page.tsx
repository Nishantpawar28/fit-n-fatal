'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  getPersonalRecords,
  getStrengthCurve,
  getExercises,
  getBodyMeasurements,
  upsertBodyMeasurement,
  getProgressPhotos,
  uploadProgressPhoto,
  deleteProgressPhoto,
} from '@fit-n-fatal/db';
import type { ProgressPhoto } from '@fit-n-fatal/db';
import { Card, Button, Input, ConfirmDialog } from '@/components/ui';
import { getDateRangeStart, type DateRange, formatDate, toLocalDateStr } from '@fit-n-fatal/utils';
import { useProfile } from '@/lib/use-profile';

const RANGES: DateRange[] = ['week', 'month', 'quarter', 'year'];
const METRICS = [
  { key: 'max_weight', label: 'Weight' },
  { key: 'reps_at_max', label: 'Reps' },
  { key: 'estimated_1rm', label: 'Est. 1RM' },
  { key: 'total_volume', label: 'Volume' },
] as const;

export default function ProgressPage() {
  const { userId } = useProfile();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'strength' | 'body'>('strength');
  const [range, setRange] = useState<DateRange>('month');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [metric, setMetric] = useState<(typeof METRICS)[number]['key']>('max_weight');

  const [measureDate, setMeasureDate] = useState(toLocalDateStr());
  const [weightKg, setWeightKg] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [arms, setArms] = useState('');
  const [thighs, setThighs] = useState('');
  const [photoNotes, setPhotoNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [deletePhoto, setDeletePhoto] = useState<ProgressPhoto | null>(null);

  const fromDate = getDateRangeStart(range)?.toISOString();

  const { data: prs } = useQuery({ queryKey: ['prs', userId], queryFn: () => getPersonalRecords(userId!), enabled: !!userId });
  const { data: exercises } = useQuery({ queryKey: ['exercises'], queryFn: () => getExercises() });
  const { data: curve } = useQuery({
    queryKey: ['strengthCurve', userId, selectedExercise, range],
    queryFn: () => getStrengthCurve(userId!, selectedExercise!, fromDate ?? undefined),
    enabled: !!userId && !!selectedExercise,
  });

  const { data: measurements } = useQuery({
    queryKey: ['measurements', userId],
    queryFn: () => getBodyMeasurements(userId!),
    enabled: !!userId && tab === 'body',
  });

  const { data: photos } = useQuery({
    queryKey: ['photos', userId],
    queryFn: () => getProgressPhotos(userId!),
    enabled: !!userId && tab === 'body',
  });

  const saveMeasurementMutation = useMutation({
    mutationFn: () =>
      upsertBodyMeasurement(userId!, {
        measuredDate: measureDate,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        bodyFatPct: bodyFat ? parseFloat(bodyFat) : null,
        waistCm: waist ? parseFloat(waist) : null,
        chestCm: chest ? parseFloat(chest) : null,
        armsCm: arms ? parseFloat(arms) : null,
        thighsCm: thighs ? parseFloat(thighs) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      setWeightKg(''); setBodyFat(''); setWaist(''); setChest(''); setArms(''); setThighs('');
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: () => uploadProgressPhoto(userId!, photoFile!, measureDate, photoNotes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      setPhotoFile(null);
      setPhotoNotes('');
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (p: ProgressPhoto) => deleteProgressPhoto(p),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos'] }),
  });

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-fnf-text mb-6">Progress</h2>

      <div className="flex gap-2 mb-6">
        <Button variant={tab === 'strength' ? 'primary' : 'secondary'} onClick={() => setTab('strength')}>Strength</Button>
        <Button variant={tab === 'body' ? 'primary' : 'secondary'} onClick={() => setTab('body')}>Body & Photos</Button>
      </div>

      {tab === 'strength' && (
        <>
          <div className="flex gap-2 mb-6">
            {RANGES.map((r) => (
              <Button key={r} variant={range === r ? 'primary' : 'secondary'} onClick={() => setRange(r)}>{r}</Button>
            ))}
          </div>

          <h3 className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Personal Records</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {(prs ?? []).map((pr) => (
              <Card key={pr.exercise_id}>
                <p className="text-fnf-text text-sm truncate">{pr.exercise_name}</p>
                <p className="text-fnf-violet font-bold text-xl">{pr.max_weight} kg</p>
                <p className="text-fnf-muted text-xs">1RM ~{pr.estimated_1rm} kg</p>
              </Card>
            ))}
            {(prs ?? []).length === 0 && <p className="text-fnf-muted text-sm col-span-full">No PRs yet — log a workout to start tracking.</p>}
          </div>

          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-fnf-muted text-xs uppercase tracking-wider">Exercise Progression</h3>
            <div className="flex gap-1.5">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className={`text-xs px-2.5 py-1 rounded-full ${metric === m.key ? 'bg-purple-500/25 text-fnf-violet' : 'text-fnf-muted hover:bg-white/5'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {(exercises ?? []).slice(0, 12).map((ex) => (
              <Button key={ex.id} variant={selectedExercise === ex.id ? 'primary' : 'ghost'} onClick={() => setSelectedExercise(ex.id)}>
                {ex.name}
              </Button>
            ))}
          </div>

          {curve && curve.length > 0 ? (
            <Card>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={curve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#6B5A8A" fontSize={11} />
                  <YAxis stroke="#6B5A8A" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'rgb(var(--fnf-surface))', border: '1px solid rgba(180,100,255,0.2)' }} />
                  <Line type="monotone" dataKey={metric} stroke="#C84BFF" strokeWidth={2} dot={{ fill: '#8B2BFF' }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <Card><p className="text-fnf-muted text-sm">Select an exercise with logged data to view progression</p></Card>
          )}
        </>
      )}

      {tab === 'body' && (
        <>
          <Card className="mb-6 max-w-2xl">
            <p className="font-medium text-fnf-text mb-3">Log Measurements</p>
            <input type="date" value={measureDate} onChange={(e) => setMeasureDate(e.target.value)} className="mb-3 bg-fnf-bg/50 border border-purple-500/15 rounded-lg px-3 py-2 text-sm text-fnf-text" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <Input value={weightKg} onChange={setWeightKg} placeholder="Weight (kg)" type="number" />
              <Input value={bodyFat} onChange={setBodyFat} placeholder="Body fat %" type="number" />
              <Input value={waist} onChange={setWaist} placeholder="Waist (cm)" type="number" />
              <Input value={chest} onChange={setChest} placeholder="Chest (cm)" type="number" />
              <Input value={arms} onChange={setArms} placeholder="Arms (cm)" type="number" />
              <Input value={thighs} onChange={setThighs} placeholder="Thighs (cm)" type="number" />
            </div>
            <Button onClick={() => saveMeasurementMutation.mutate()} disabled={saveMeasurementMutation.isPending}>
              {saveMeasurementMutation.isPending ? 'Saving...' : 'Save Measurement'}
            </Button>
          </Card>

          {measurements && measurements.filter((m) => m.weight_kg).length > 1 && (
            <Card className="mb-6">
              <p className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Weight Over Time</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={measurements.filter((m) => m.weight_kg).map((m) => ({ date: m.measured_date, weight: m.weight_kg }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#6B5A8A" fontSize={11} />
                  <YAxis stroke="#6B5A8A" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ background: 'rgb(var(--fnf-surface))', border: '1px solid rgba(180,100,255,0.2)' }} />
                  <Line type="monotone" dataKey="weight" stroke="#00FFA0" strokeWidth={2} dot={{ fill: '#00FFA0' }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card className="mb-6 max-w-2xl">
            <p className="font-medium text-fnf-text mb-3">Progress Photos</p>
            <p className="text-fnf-muted text-xs mb-3">Private — only visible to you.</p>
            <div className="flex flex-wrap gap-3 mb-3 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="text-fnf-secondary text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-purple-500/20 file:text-fnf-violet"
              />
              <Input value={photoNotes} onChange={setPhotoNotes} placeholder="Notes (optional)" className="max-w-[200px]" />
              <Button onClick={() => uploadPhotoMutation.mutate()} disabled={!photoFile || uploadPhotoMutation.isPending}>
                {uploadPhotoMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {(photos ?? []).map((p) => (
                <div key={p.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.notes ?? formatDate(p.taken_date)} className="w-full aspect-square object-cover rounded-lg" />
                  <button
                    onClick={() => setDeletePhoto(p)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <p className="text-fnf-muted text-[10px] mt-1">{formatDate(p.taken_date)}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={!!deletePhoto}
        onClose={() => setDeletePhoto(null)}
        onConfirm={() => deletePhoto && deletePhotoMutation.mutate(deletePhoto)}
        title="Delete photo?"
        message="This can't be undone."
      />
    </div>
  );
}
