'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getActiveSession, getPersonalRecords } from '@fit-n-fatal/db';
import { Card, Button, Badge } from '@/components/ui';
import { formatDate } from '@fit-n-fatal/utils';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: activeSession } = useQuery({
    queryKey: ['activeSession', userId],
    queryFn: () => getActiveSession(userId!),
    enabled: !!userId,
  });

  const { data: prs } = useQuery({
    queryKey: ['prs', userId],
    queryFn: () => getPersonalRecords(userId!),
    enabled: !!userId,
  });

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-fnf-text mb-1">Dashboard</h2>
      <p className="text-fnf-muted text-sm mb-8">Your training overview</p>

      <div className="bg-gradient-to-r from-[#6B1FCC] to-[#A83BEE] rounded-xl p-5 mb-6">
        <p className="font-heading font-semibold text-white text-lg">Dark · Purple · Deadly</p>
        <p className="text-white/65 text-sm">Track every rep. Crush every PR.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          {activeSession ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <p className="font-medium text-fnf-text">Workout in progress</p>
                <Badge color="pink">Active</Badge>
              </div>
              <p className="text-fnf-muted text-sm mb-4">Started {formatDate(activeSession.started_at)}</p>
              <Link href="/dashboard/workout"><Button>Continue Workout</Button></Link>
            </>
          ) : (
            <>
              <p className="font-medium text-fnf-text mb-2">Ready to train?</p>
              <p className="text-fnf-muted text-sm mb-4">Start a new session and log your sets</p>
              <Link href="/dashboard/workout"><Button>Start Workout</Button></Link>
            </>
          )}
        </Card>

        <Card>
          <p className="font-medium text-fnf-text mb-3">Quick Stats</p>
          <p className="text-3xl font-heading font-bold text-fnf-violet">{prs?.length ?? 0}</p>
          <p className="text-fnf-muted text-sm">Personal records logged</p>
        </Card>
      </div>

      <h3 className="text-fnf-muted text-xs uppercase tracking-wider mb-3">Recent PRs</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(prs ?? []).slice(0, 6).map((pr) => (
          <Card key={pr.exercise_id}>
            <p className="text-fnf-text text-sm font-medium">{pr.exercise_name}</p>
            <p className="text-fnf-violet font-bold text-lg">{pr.max_weight} kg</p>
            <p className="text-fnf-muted text-xs">Est. 1RM {pr.estimated_1rm} kg</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
