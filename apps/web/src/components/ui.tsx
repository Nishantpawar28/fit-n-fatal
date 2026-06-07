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

export function Badge({ children, color = 'purple' }: { children: React.ReactNode; color?: 'purple' | 'pink' | 'neutral' }) {
  const colors = {
    purple: 'bg-purple-500/20 text-fnf-violet',
    pink: 'bg-pink-500/20 text-fnf-pink',
    neutral: 'bg-white/5 text-fnf-muted',
  };
  return (
    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', colors[color])}>
      {children}
    </span>
  );
}
