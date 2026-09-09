'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-fnf-surface border border-purple-500/10 rounded-xl p-4', className)}>
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const base = 'px-4 py-2.5 rounded-xl font-body text-sm font-medium transition-opacity disabled:opacity-50';
  const variants = {
    primary: 'bg-gradient-to-r from-fnf-purple to-fnf-violet text-white',
    secondary: 'bg-fnf-surface border border-purple-500/20 text-fnf-text',
    ghost: 'text-fnf-violet hover:bg-purple-500/10',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn(base, variants[variant], className)}>
      {children}
    </button>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full bg-fnf-surface border border-purple-500/15 rounded-lg px-4 py-3 text-fnf-text font-body text-sm placeholder:text-fnf-muted focus:outline-none focus:border-fnf-violet/50',
        className
      )}
    />
  );
}

export function Badge({ children, color = 'purple' }: { children: React.ReactNode; color?: 'purple' | 'pink' | 'green' | 'neutral' }) {
  const colors = {
    purple: 'bg-purple-500/20 text-fnf-violet',
    pink: 'bg-pink-500/20 text-fnf-pink',
    green: 'bg-emerald-500/15 text-fnf-green',
    neutral: 'bg-white/5 text-fnf-muted',
  };
  return (
    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', colors[color])}>
      {children}
    </span>
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
  className,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        'w-full bg-fnf-surface border border-purple-500/15 rounded-lg px-4 py-3 text-fnf-text font-body text-sm placeholder:text-fnf-muted focus:outline-none focus:border-fnf-violet/50 resize-none',
        className
      )}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full bg-fnf-surface border border-purple-500/15 rounded-lg px-4 py-3 text-fnf-text font-body text-sm focus:outline-none focus:border-fnf-violet/50 appearance-none',
        className
      )}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 group"
      aria-pressed={checked}
    >
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-gradient-to-r from-fnf-purple to-fnf-violet' : 'bg-white/10'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </span>
      {label && <span className="text-fnf-secondary text-sm">{label}</span>}
    </button>
  );
}

export function ProgressBar({
  value,
  max,
  color = 'purple',
  className,
}: {
  value: number;
  max: number;
  color?: 'purple' | 'pink' | 'green';
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const colors = {
    purple: 'from-fnf-purple to-fnf-violet',
    pink: 'from-[#C43090] to-fnf-pink',
    green: 'bg-fnf-green',
  };
  return (
    <div className={cn('h-2 w-full rounded-full bg-white/5 overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', color === 'green' ? colors.green : `bg-gradient-to-r ${colors[color]}`)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  max,
  size = 88,
  strokeWidth = 8,
  color = '#C84BFF',
  label,
  sublabel,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
}) {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-fnf-text font-heading font-bold text-sm leading-none">{label}</span>}
        {sublabel && <span className="text-fnf-muted text-[10px] mt-1 leading-none">{sublabel}</span>}
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'fnf-animate-in relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-fnf-surface border border-purple-500/15 rounded-t-2xl sm:rounded-2xl p-5',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-fnf-text">{title}</h3>
            <button onClick={onClose} className="text-fnf-muted hover:text-fnf-text text-xl leading-none px-2">
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-fnf-muted text-sm mb-5">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={danger ? '!bg-gradient-to-r !from-red-600 !to-red-500' : undefined}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="text-center py-10">
      {icon && <div className="text-3xl mb-3">{icon}</div>}
      <p className="text-fnf-text font-medium mb-1">{title}</p>
      {message && <p className="text-fnf-muted text-sm mb-4">{message}</p>}
      {action}
    </Card>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex justify-center py-8', className)}>
      <div className="h-6 w-6 rounded-full border-2 border-purple-500/20 border-t-fnf-violet animate-spin" />
    </div>
  );
}
