'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Droplet, X } from 'lucide-react';
import { addWaterEntry } from '@fit-n-fatal/db';
import { useProfile } from '@/lib/use-profile';

function parseTimeToday(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export function WaterReminder() {
  const { userId, profile } = useProfile();
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const lastShownRef = useRef<number>(Date.now());
  const snoozeUntilRef = useRef<number>(0);

  const logMutation = useMutation({
    mutationFn: (ml: number) => addWaterEntry(userId!, ml),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waterEntries'] });
      setVisible(false);
    },
  });

  useEffect(() => {
    if (!profile?.water_reminder_enabled || !profile?.notif_water) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const frequencyMs = (profile.water_reminder_frequency_minutes || 60) * 60 * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now < snoozeUntilRef.current) return;

      const wake = parseTimeToday(profile.wake_time || '07:00');
      const sleep = parseTimeToday(profile.sleep_time || '23:00');
      const current = new Date();
      const withinWindow = sleep > wake ? current >= wake && current <= sleep : current >= wake || current <= sleep;
      if (!withinWindow) return;

      if (now - lastShownRef.current >= frequencyMs) {
        lastShownRef.current = now;
        setVisible(true);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('💧 Time to hydrate!', { body: 'Grab some water and keep yourself hydrated.' });
        }
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [profile?.water_reminder_enabled, profile?.notif_water, profile?.water_reminder_frequency_minutes, profile?.wake_time, profile?.sleep_time]);

  if (!visible || !userId) return null;

  return (
    <div className="fixed top-16 md:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="fnf-animate-in bg-gradient-to-r from-sky-600 to-cyan-500 rounded-xl p-4 shadow-xl text-white">
        <div className="flex justify-between items-start">
          <p className="font-heading font-semibold flex items-center gap-1.5"><Droplet size={16} /> Time to hydrate!</p>
          <button onClick={() => setVisible(false)}><X size={16} /></button>
        </div>
        <p className="text-white/85 text-xs mt-1 mb-3">Grab some water and keep yourself hydrated.</p>
        <div className="flex gap-2">
          <button onClick={() => logMutation.mutate(250)} className="bg-white/20 hover:bg-white/30 text-xs rounded-lg px-3 py-1.5">+250ml</button>
          <button
            onClick={() => { snoozeUntilRef.current = Date.now() + 10 * 60 * 1000; setVisible(false); }}
            className="bg-white/20 hover:bg-white/30 text-xs rounded-lg px-3 py-1.5"
          >
            Snooze 10m
          </button>
          <button onClick={() => setVisible(false)} className="text-white/70 text-xs px-3 py-1.5 ml-auto">Skip</button>
        </div>
      </div>
    </div>
  );
}
