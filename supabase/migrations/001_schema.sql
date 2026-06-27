-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Body sections (muscle groups)
create table body_sections (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  display_name text not null
);

-- Exercises
create table exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  equipment_required text[] default '{}',
  goal_tags text[] default '{}',
  warm_up_required boolean default false,
  execution_style text not null check (execution_style in ('reps','timed','failure','max_hold')),
  target_reps int,
  target_duration int, -- seconds
  easier_variant_id uuid references exercises(id),
  harder_variant_id uuid references exercises(id),
  demo_media_ref text,
  difficulty_level numeric not null default 5,
  wger_id int,
  created_at timestamptz default now()
);

-- Muscle engagement map
create table exercise_muscle_engagement (
  exercise_id uuid references exercises(id) on delete cascade,
  body_section_id uuid references body_sections(id) on delete cascade,
  engagement_level int not null check (engagement_level between 1 and 3),
  primary key (exercise_id, body_section_id)
);

-- Users (extends Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  height_cm numeric,
  weight_kg numeric,
  age int,
  gender text,
  goal text check (goal in ('weight_loss','muscle_gain','strength','sport_specific')),
  mode_preference text default 'dynamic' check (mode_preference in ('dynamic','fixed_split','template')),
  frequency_preference int default 3,
  intensity_preference numeric default 0.7,
  duration_preference int default 45,
  equipment text[] default '{}',
  onboarded_at timestamptz,
  created_at timestamptz default now()
);

-- Injury/soreness state
create table user_injury_states (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  body_section_id uuid references body_sections(id),
  severity int not null check (severity between 1 and 3),
  reported_at timestamptz default now(),
  active boolean default true
);

-- Exercise history per user
create table user_exercise_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete cascade,
  times_performed int default 0,
  last_performed_at timestamptz,
  user_rating int check (user_rating between 1 and 5),
  is_excluded boolean default false,
  unique(user_id, exercise_id)
);

-- Workout sessions
create table workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date timestamptz default now(),
  mode_used text default 'dynamic',
  planned_duration int,
  actual_duration int,
  exercises_completed jsonb default '[]',
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Performance logs
create table performance_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete cascade,
  session_id uuid references workout_sessions(id) on delete cascade,
  date timestamptz default now(),
  result_value numeric not null,
  is_personal_best boolean default false
);

-- Influencers
create table influencers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  social_link text,
  created_at timestamptz default now()
);

-- Programs (skill + influencer)
create table programs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  target_skill text,
  created_by_influencer_id uuid references influencers(id),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Program exercises (hand-curated order)
create table program_exercises (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid references programs(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete cascade,
  sequence_order int not null,
  milestone_criteria text,
  unique(program_id, sequence_order)
);

-- User program enrollments
create table user_program_enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  program_id uuid references programs(id) on delete cascade,
  current_step int default 0,
  started_at timestamptz default now(),
  active boolean default true,
  unique(user_id, program_id)
);
