-- Enable Row Level Security on all user-facing tables
alter table users enable row level security;
alter table user_injury_states enable row level security;
alter table user_exercise_history enable row level security;
alter table workout_sessions enable row level security;
alter table performance_logs enable row level security;
alter table user_program_enrollments enable row level security;

-- Public tables (read-only for all authenticated users)
alter table body_sections enable row level security;
alter table exercises enable row level security;
alter table exercise_muscle_engagement enable row level security;
alter table influencers enable row level security;
alter table programs enable row level security;
alter table program_exercises enable row level security;

-- body_sections: readable by everyone authenticated
create policy "body_sections_read" on body_sections
  for select using (true);

-- exercises: readable by everyone authenticated
create policy "exercises_read" on exercises
  for select using (true);

-- exercise_muscle_engagement: readable by everyone
create policy "muscle_engagement_read" on exercise_muscle_engagement
  for select using (true);

-- influencers: readable by everyone
create policy "influencers_read" on influencers
  for select using (true);

-- programs: readable by everyone
create policy "programs_read" on programs
  for select using (true);

-- program_exercises: readable by everyone
create policy "program_exercises_read" on program_exercises
  for select using (true);

-- users: own row only
create policy "users_select_own" on users
  for select using (auth.uid() = id);

create policy "users_insert_own" on users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on users
  for update using (auth.uid() = id);

-- user_injury_states: own rows only
create policy "injury_states_select_own" on user_injury_states
  for select using (auth.uid() = user_id);

create policy "injury_states_insert_own" on user_injury_states
  for insert with check (auth.uid() = user_id);

create policy "injury_states_update_own" on user_injury_states
  for update using (auth.uid() = user_id);

create policy "injury_states_delete_own" on user_injury_states
  for delete using (auth.uid() = user_id);

-- user_exercise_history: own rows only
create policy "exercise_history_select_own" on user_exercise_history
  for select using (auth.uid() = user_id);

create policy "exercise_history_insert_own" on user_exercise_history
  for insert with check (auth.uid() = user_id);

create policy "exercise_history_update_own" on user_exercise_history
  for update using (auth.uid() = user_id);

-- workout_sessions: own rows only
create policy "sessions_select_own" on workout_sessions
  for select using (auth.uid() = user_id);

create policy "sessions_insert_own" on workout_sessions
  for insert with check (auth.uid() = user_id);

create policy "sessions_update_own" on workout_sessions
  for update using (auth.uid() = user_id);

-- performance_logs: own rows only
create policy "perf_logs_select_own" on performance_logs
  for select using (auth.uid() = user_id);

create policy "perf_logs_insert_own" on performance_logs
  for insert with check (auth.uid() = user_id);

create policy "perf_logs_update_own" on performance_logs
  for update using (auth.uid() = user_id);

-- user_program_enrollments: own rows only
create policy "enrollments_select_own" on user_program_enrollments
  for select using (auth.uid() = user_id);

create policy "enrollments_insert_own" on user_program_enrollments
  for insert with check (auth.uid() = user_id);

create policy "enrollments_update_own" on user_program_enrollments
  for update using (auth.uid() = user_id);

create policy "enrollments_delete_own" on user_program_enrollments
  for delete using (auth.uid() = user_id);
