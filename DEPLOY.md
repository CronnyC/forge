# FORGE — Deployment Guide

## Step 1: Create GitHub repo

Go to https://github.com/new and create:
- Owner: CronnyC
- Repo name: forge
- Public
- No README, no .gitignore (already have them)

Then run in your terminal:
```bash
cd C:\Users\cronn\Projects\forge
git push -u origin master
```

## Step 2: Set up Supabase

1. Go to https://supabase.com and create a new project
2. In the SQL Editor, run each migration file in order:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_seed.sql`

3. Get your project credentials from Settings > API:
   - Project URL
   - Anon/public key
   - Service role key (secret)

## Step 3: Deploy to Vercel

1. Go to https://vercel.com/new
2. Import from GitHub: CronnyC/forge
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key
4. Deploy

## Step 4: Custom domain (optional)

In Vercel project settings > Domains, add `trainer.halbrstat.com`

## Local development

Create `.env.local` with real Supabase credentials, then:
```bash
npm run dev
```
