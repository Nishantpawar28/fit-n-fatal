# Getting Started — Fit N Fatal

Your project is at: `C:\Users\Nishant\Desktop\fit-n-fatal`

## ✅ Already done (by you)

- [x] Supabase project created
- [x] Database schema migrated (`001_initial_schema.sql`)
- [x] Exercises seeded (57 rows)

## 🔧 Step 1b: Fix signup (required — run once)

If signup shows **"Database error saving new user"**, run this in Supabase **SQL Editor**:

Open `supabase/fix-auth.sql`, copy all contents, paste into SQL Editor, click **Run**.

Then verify from terminal:

```powershell
.\scripts\test-auth.ps1
```

You should see `SUCCESS: Signup works`.

Also disable email confirmation for easy testing:
**Authentication** → **Sign In / Providers** → **Email** → turn **OFF** "Confirm email".

## 🔑 Step 1: Add Supabase keys (you chose to do this)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **Project Settings** → **API**
3. Copy **Project URL** and **anon public** key

Edit these two files:

**`apps/mobile/.env`**
```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key
```

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key
```

> Use the **same** URL and key in both files.

## 📦 Step 2: Install & run (in Cursor terminal)

Open terminal in Cursor (`Ctrl + `` `) and run:

```powershell
cd C:\Users\Nishant\Desktop\fit-n-fatal
.\scripts\setup.ps1
```

Then start the web app:

```powershell
npm run web
```

Open **http://localhost:3000** → Sign up → Start a workout.

## 📱 Step 3: Mobile app (optional)

```powershell
npm run mobile
```

Scan the QR code with **Expo Go** on your phone.

## ⚙️ Recommended Supabase setting (for easy testing)

**Authentication** → **Providers** → **Email** → turn **OFF** "Confirm email" → Save.

This lets you sign up and log in immediately without email confirmation.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `npm install` fails | Ensure Node.js 18+ is installed: `node -v` |
| Login/signup error | Check `.env` files have real Supabase keys (no placeholders) |
| Exercises empty | Re-run `supabase/seed.sql` in Supabase SQL Editor |
| Port 3000 in use | Stop other apps or run `npx next dev -p 3001` in `apps/web` |
