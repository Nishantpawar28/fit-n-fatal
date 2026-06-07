# Fit N Fatal

Dark · Purple · Deadly — A fitness tracking app for logging workouts, tracking PRs, and visualizing strength progress.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo) + Expo Router + NativeWind |
| Web | Next.js 14 (App Router) + Tailwind + Recharts |
| Backend | Supabase (Postgres, Auth, RLS, Realtime) |
| Monorepo | npm workspaces |

## Project Structure

```
fit-n-fatal/
├── apps/
│   ├── mobile/     # Expo React Native app (primary)
│   └── web/        # Next.js web dashboard
├── packages/
│   ├── db/         # Supabase client, types, queries
│   └── utils/      # Weight conversion, dates, theme
└── supabase/
    ├── migrations/ # DB schema + RLS policies
    └── seed.sql    # 58 pre-loaded exercises
```

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Run `supabase/seed.sql` to load exercises
4. Enable Google OAuth in Authentication → Providers (optional)
5. Copy your project URL and anon key

### 2. Environment Variables

**Mobile** (`apps/mobile/.env`):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Web** (`apps/web/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
# From project root
npm install

# Mobile (Expo)
npm run mobile

# Web (Next.js)
npm run web
```

## Features

- **Auth** — Email/password signup & login, Google OAuth, session persistence
- **Workout Logger** — Start session, add exercises, log sets (reps + weight + RPE)
- **Exercise Library** — 58 pre-loaded exercises, search, custom exercises
- **Workout History** — Date list, expandable details, filters
- **Progress Dashboard** — PRs, weekly/monthly/quarterly strength curves
- **Dark Purple Theme** — `#0D0D14` bg, `#8B2BFF` → `#C84BFF` gradient, `#FF6BAA` accents

## Deployment

| Platform | Service | Command |
|----------|---------|---------|
| Web | Vercel | Connect repo, set env vars, auto-deploy |
| Mobile | Expo EAS | `eas build --platform all` |
| Database | Supabase Cloud | Already hosted |

## Theme

- Background: `#0D0D14`
- Surface: `#13121F`
- Purple: `#8B2BFF` → Violet: `#C84BFF`
- Pink accent: `#FF6BAA`
- Fonts: Syne (headings), DM Sans (body)
