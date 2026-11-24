'use client';

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function WeeklyBarChart({ data }: { data: { day: string; sets: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data}>
        <XAxis dataKey="day" stroke="#6B5A8A" fontSize={11} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: 'rgb(var(--fnf-surface))', border: '1px solid rgba(180,100,255,0.2)' }} />
        <Bar dataKey="sets" fill="#8B2BFF" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
