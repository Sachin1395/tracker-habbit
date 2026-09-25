/*
# Create profiles and tasks tables for gamified XP tracker

1. New Tables
- `profiles`
  - `id` (uuid, PK, references auth.users) — one row per auth user
  - `name` (text, not null) — display name collected at signup
  - `email` (text, not null) — denormalized for leaderboard queries
  - `created_at` (timestamptz, default now())
- `tasks`
  - `id` (uuid, PK)
  - `user_id` (uuid, FK -> profiles.id, default auth.uid())
  - `task_name` (text, not null)
  - `xp` (smallint, not null) — constrained to 5, 10, 15, 20, 25
  - `task_date` (date, not null) — the day the task belongs to
  - `completed` (boolean, not null, default false)
  - `completed_at` (timestamptz, nullable) — set when marked complete
  - `created_at` (timestamptz, default now())

2. Security
- RLS enabled on both `profiles` and `tasks`.
- `profiles`: any authenticated user can read all profiles (needed for leaderboards).
  Users can update only their own profile.
- `tasks`: any authenticated user can read all tasks (needed for today's feed,
  leaderboards). Users can insert/update/delete only their own tasks.
- `user_id` defaults to auth.uid() so client inserts without user_id succeed.

3. Indexes
- `idx_tasks_user_date` on (user_id, task_date) for "my tasks" queries.
- `idx_tasks_date` on (task_date) for "today's tasks" feed.
- `idx_tasks_completed` on (completed, user_id) for XP aggregation.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
CREATE POLICY "profiles_read_all"
ON profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  xp smallint NOT NULL CHECK (xp IN (5, 10, 15, 20, 25)),
  task_date date NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_read_all" ON tasks;
CREATE POLICY "tasks_read_all"
ON tasks FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "tasks_insert_own" ON tasks;
CREATE POLICY "tasks_insert_own"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_update_own" ON tasks;
CREATE POLICY "tasks_update_own"
ON tasks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_delete_own" ON tasks;
CREATE POLICY "tasks_delete_own"
ON tasks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks (user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks (task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks (completed, user_id);