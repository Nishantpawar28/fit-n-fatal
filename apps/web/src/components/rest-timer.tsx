'use client';

import { useEffect, useRef, useState } from 'react';
import { Timer, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESETS = [30, 60, 90, 120];

function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // audio not available
  }
}

export function RestTimer() {
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playBeep();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Rest complete', { body: 'Time to start your next set.' });
      }
      setSecondsLeft(null);
      return;
    }
    intervalRef.current = setInterval(() => setSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [secondsLeft]);

  const start = (seconds: number) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setSecondsLeft(seconds);
    setOpen(true);
  };

  const mins = secondsLeft !== null ? Math.floor(secondsLeft / 60) : 0;
  const secs = secondsLeft !== null ? secondsLeft % 60 : 0;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-30">
      {open && (
        <div className="fnf-animate-in mb-3 bg-fnf-surface border border-purple-500/20 rounded-2xl p-4 shadow-xl w-56">
          <div className="flex justify-between items-center mb-3">
            <p className="text-fnf-text text-sm font-medium flex items-center gap-1.5">
              <Timer size={15} /> Rest Timer
            </p>
            <button onClick={() => setOpen(false)} className="text-fnf-muted hover:text-fnf-text">
              <X size={15} />
            </button>
          </div>
          {secondsLeft !== null ? (
            <div className="text-center mb-3">
              <p className="font-heading text-3xl font-bold text-fnf-violet tabular-nums">
                {mins}:{secs.toString().padStart(2, '0')}
              </p>
              <button onClick={() => setSecondsLeft(null)} className="text-fnf-muted text-xs hover:text-fnf-text mt-1">
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => start(p)}
                    className="bg-purple-500/10 hover:bg-purple-500/20 text-fnf-text text-xs rounded-lg py-2"
                  >
                    {p < 60 ? `${p}s` : `${p / 60}m`}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="sec"
                  type="number"
                  className="w-full bg-fnf-bg/60 border border-purple-500/15 rounded-lg px-2 py-1.5 text-xs text-fnf-text"
                />
                <button
                  onClick={() => customValue && start(parseInt(customValue, 10))}
                  className="text-xs bg-gradient-to-r from-fnf-purple to-fnf-violet text-white rounded-lg px-3"
                >
                  Go
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'h-12 w-12 rounded-full flex items-center justify-center shadow-lg text-white',
          secondsLeft !== null ? 'bg-fnf-pink animate-pulse' : 'bg-gradient-to-r from-fnf-purple to-fnf-violet'
        )}
        aria-label="Rest timer"
      >
        {secondsLeft !== null ? (
          <span className="text-xs font-bold tabular-nums">{secondsLeft}</span>
        ) : (
          <Timer size={20} />
        )}
      </button>
    </div>
  );
}
