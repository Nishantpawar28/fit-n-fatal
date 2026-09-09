import {
  LayoutDashboard,
  Dumbbell,
  ClipboardList,
  History,
  Library,
  Utensils,
  Droplet,
  TrendingUp,
  Target,
  Calendar,
  BarChart3,
  Trophy,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/workout', label: 'Workout', icon: Dumbbell },
  { href: '/dashboard/nutrition', label: 'Nutrition', icon: Utensils },
  { href: '/dashboard/progress', label: 'Progress', icon: TrendingUp },
  { href: '/dashboard/settings', label: 'Profile', icon: Settings },
];

export const SECONDARY_LINKS: NavLink[] = [
  { href: '/dashboard/templates', label: 'Templates', icon: ClipboardList },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/exercises', label: 'Exercises', icon: Library },
  { href: '/dashboard/water', label: 'Hydration', icon: Droplet },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/achievements', label: 'Achievements', icon: Trophy },
];

export const ALL_LINKS: NavLink[] = [...PRIMARY_LINKS.slice(0, 4), ...SECONDARY_LINKS, { href: '/dashboard/settings', label: 'Settings', icon: Settings }];
