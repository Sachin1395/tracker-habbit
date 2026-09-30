/*
# High-efficiency storage model: daily_stats + user_stats + mutation functions

## Purpose
Refactor the backend from "scan all tasks" to a pre-aggregated storage model
that stays within Supabase free-tier limits. Tasks table is kept for active/
pending rows only; completed and past-dated tasks are auto-deleted after their
XP is folded into daily_stats and user_stats.

## New Tables

### daily_stats (rolling 14-day window)
- `id`          uuid PK
- `user_id`     uuid FK -> profiles.id, default auth.uid()
- `date`        date NOT NULL — the day the stats belong to
- `planned_xp`      integer NOT NULL DEFAULT 0  — sum of XP from tasks added that day
- `completed_xp`    integer NOT NULL DEFAULT 0  — sum of XP from tasks completed that day
- `planned_tasks`   integer NOT NULL DEFAULT 0  — count of tasks added that day
- `completed_tasks` integer NOT NULL DEFAULT 0  — count of tasks completed that day
- `created_at`  timestamptz DEFAULT now()
- `updated_at`  timestamptz DEFAULT now()
- UNIQUE constraint on (user_id, date) — one row per user per day
- Index on (user_id, date) for fast weekly/daily aggregation

### user_stats (permanent lifetime totals, 1 row per user)
- `user_id`     uuid PK FK -> profiles.id ON DELETE CASCADE
- `lifetime_xp` integer NOT NULL DEFAULT 0
- `updated_at`  timestamptz DEFAULT now()

## Security
- RLS enabled on both new tables.
- daily_stats: any authenticated user can SELECT (needed for leaderboards/heatmap).
  INSERT/UPDATE/DELETE revoked from authenticated — all mutations go through
  SECURITY DEFINER functions so users cannot tamper with stats directly.
- user_stats: any authenticated user can SELECT. INSERT/UPDATE/DELETE revoked.

## SECURITY DEFINER Functions (all mutations happen server-side)

1. `add_task(p_task_name text, p_xp smallint, p_task_date date, p_completed boolean)`
   - Inserts a task row for auth.uid().
   - Upserts daily_stats: planned_xp += xp, planned_tasks += 1.
   - If p_completed: also completed_xp += xp, completed_tasks += 1,
     and user_stats.lifetime_xp += xp.
   - Returns the inserted task row.

2. `toggle_task_complete(p_task_id uuid)`
   - Reads the task; verifies ownership (auth.uid() = task.user_id).
   - If marking complete: completed = true, completed_at = now(),
     daily_stats.completed_xp += xp, completed_tasks += 1,
     user_stats.lifetime_xp += xp.
   - If unchecking: completed = false, completed_at = null,
     daily_stats.completed_xp -= xp, completed_tasks -= 1,
     user_stats.lifetime_xp -= xp.
   - Returns the updated task row.

3. `delete_task(p_task_id uuid)`
   - Reads the task; verifies ownership.
   - If task was incomplete: daily_stats.planned_xp -= xp, planned_tasks -= 1.
   - If task was completed: daily_stats.planned_xp -= xp, planned_tasks -= 1,
     daily_stats.completed_xp -= xp, completed_tasks -= 1,
     user_stats.lifetime_xp -= xp.
   - Deletes the task row.
   - Returns void.

4. `cleanup_old_tasks()`
   - Deletes tasks where completed = true OR task_date < CURRENT_DATE.
   - Does NOT modify daily_stats or user_stats (XP already captured).
   - Safe to call repeatedly (idempotent).

5. `backfill_stats()`
   - One-time idempotent migration: populates daily_stats and user_stats
     from existing tasks rows. Uses ON CONFLICT to avoid duplicate runs.
     Guards against re-runs by checking a sentinel in a migration_log table.

## Migration Log Table
### migration_log
- `id` text PK — name of the migration step
- `ran_at` timestamptz DEFAULT now()
- Used to prevent backfill from running twice.

## Important Notes
1. All stat mutations are atomic within a single function call (PL/pgSQL
   block). The client never directly writes to daily_stats or user_stats.
2. Auto-cleanup only removes task rows; it never touches stats tables.
3. The tasks table schema is unchanged — only its retention policy changes
   (completed and past-dated rows are removed after stats are updated).
4. Column-level UPDATE privileges are revoked on daily_stats and user_stats
   so even a policy gap cannot let a user inflate their own XP.
*/

-- ============================================================
-- daily_stats table
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  planned_xp integer NOT NULL DEFAULT 0,
  completed_xp integer NOT NULL DEFAULT 0,
  planned_tasks integer NOT NULL DEFAULT 0,
  completed_tasks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats (user_id, date);

DROP POLICY IF EXISTS "daily_stats_read_all" ON daily_stats;
CREATE POLICY "daily_stats_read_all"
ON daily_stats FOR SELECT
TO authenticated
USING (true);

-- Revoke direct write access — mutations only via SECURITY DEFINER functions
REVOKE INSERT, UPDATE, DELETE ON daily_stats FROM authenticated;

-- ============================================================
-- user_stats table
-- ============================================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  lifetime_xp integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_stats_read_all" ON user_stats;
CREATE POLICY "user_stats_read_all"
ON user_stats FOR SELECT
TO authenticated
USING (true);

REVOKE INSERT, UPDATE, DELETE ON user_stats FROM authenticated;

-- ============================================================
-- migration_log table (sentinel for idempotent backfill)
-- ============================================================
CREATE TABLE IF NOT EXISTS migration_log (
  id text PRIMARY KEY,
  ran_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE migration_log ENABLE ROW LEVEL SECURITY;
-- No policies: only service role / function owner uses this table.

-- ============================================================
-- Helper: upsert a daily_stats row
-- ============================================================
CREATE OR REPLACE FUNCTION upsert_daily_stat(
  p_user_id uuid,
  p_date date,
  p_planned_xp_delta integer DEFAULT 0,
  p_planned_tasks_delta integer DEFAULT 0,
  p_completed_xp_delta integer DEFAULT 0,
  p_completed_tasks_delta integer DEFAULT 0
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO daily_stats (user_id, date, planned_xp, planned_tasks, completed_xp, completed_tasks)
  VALUES (p_user_id, p_date, p_planned_xp_delta, p_planned_tasks_delta, p_completed_xp_delta, p_completed_tasks_delta)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    planned_xp = daily_stats.planned_xp + EXCLUDED.planned_xp,
    planned_tasks = daily_stats.planned_tasks + EXCLUDED.planned_tasks,
    completed_xp = daily_stats.completed_xp + EXCLUDED.completed_xp,
    completed_tasks = daily_stats.completed_tasks + EXCLUDED.completed_tasks,
    updated_at = now();
END;
$$;

-- ============================================================
-- add_task function
-- ============================================================
CREATE OR REPLACE FUNCTION add_task(
  p_task_name text,
  p_xp smallint,
  p_task_date date,
  p_completed boolean DEFAULT false
) RETURNS tasks
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_row tasks;
  v_now timestamptz := now();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_xp NOT IN (5, 10, 15, 20, 25) THEN
    RAISE EXCEPTION 'Invalid XP value';
  END IF;

  INSERT INTO tasks (user_id, task_name, xp, task_date, completed, completed_at, created_at)
  VALUES (v_user_id, p_task_name, p_xp, p_task_date, p_completed, CASE WHEN p_completed THEN v_now ELSE NULL END, v_now)
  RETURNING * INTO v_row;

  -- planned stats always increment
  PERFORM upsert_daily_stat(v_user_id, p_task_date, p_xp, 1, 0, 0);

  -- if completed, also increment completed stats + lifetime
  IF p_completed THEN
    PERFORM upsert_daily_stat(v_user_id, p_task_date, 0, 0, p_xp, 1);
    INSERT INTO user_stats (user_id, lifetime_xp) VALUES (v_user_id, p_xp)
    ON CONFLICT (user_id) DO UPDATE SET
      lifetime_xp = user_stats.lifetime_xp + EXCLUDED.lifetime_xp,
      updated_at = now();
  END IF;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION add_task FROM anon;
GRANT EXECUTE ON FUNCTION add_task TO authenticated;

-- ============================================================
-- toggle_task_complete function
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_task_complete(p_task_id uuid)
RETURNS tasks
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row tasks;
  v_user_id uuid;
  v_new_completed boolean;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_row FROM tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
  IF v_row.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_new_completed := NOT v_row.completed;
  v_user_id := v_row.user_id;

  IF v_new_completed THEN
    UPDATE tasks SET completed = true, completed_at = v_now WHERE id = p_task_id RETURNING * INTO v_row;
    PERFORM upsert_daily_stat(v_user_id, v_row.task_date, 0, 0, v_row.xp, 1);
    INSERT INTO user_stats (user_id, lifetime_xp) VALUES (v_user_id, v_row.xp)
    ON CONFLICT (user_id) DO UPDATE SET
      lifetime_xp = user_stats.lifetime_xp + EXCLUDED.lifetime_xp,
      updated_at = now();
  ELSE
    UPDATE tasks SET completed = false, completed_at = NULL WHERE id = p_task_id RETURNING * INTO v_row;
    PERFORM upsert_daily_stat(v_user_id, v_row.task_date, 0, 0, -v_row.xp, -1);
    INSERT INTO user_stats (user_id, lifetime_xp) VALUES (v_user_id, -v_row.xp)
    ON CONFLICT (user_id) DO UPDATE SET
      lifetime_xp = user_stats.lifetime_xp + EXCLUDED.lifetime_xp,
      updated_at = now();
  END IF;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION toggle_task_complete FROM anon;
GRANT EXECUTE ON FUNCTION toggle_task_complete TO authenticated;

-- ============================================================
-- delete_task function
-- ============================================================
CREATE OR REPLACE FUNCTION delete_task(p_task_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row tasks;
  v_user_id uuid;
BEGIN
  SELECT * INTO v_row FROM tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
  IF v_row.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  v_user_id := v_row.user_id;

  -- Always deduct planned
  PERFORM upsert_daily_stat(v_user_id, v_row.task_date, -v_row.xp, -1, 0, 0);

  -- If was completed, also deduct completed + lifetime
  IF v_row.completed THEN
    PERFORM upsert_daily_stat(v_user_id, v_row.task_date, 0, 0, -v_row.xp, -1);
    INSERT INTO user_stats (user_id, lifetime_xp) VALUES (v_user_id, -v_row.xp)
    ON CONFLICT (user_id) DO UPDATE SET
      lifetime_xp = user_stats.lifetime_xp + EXCLUDED.lifetime_xp,
      updated_at = now();
  END IF;

  DELETE FROM tasks WHERE id = p_task_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION delete_task FROM anon;
GRANT EXECUTE ON FUNCTION delete_task TO authenticated;

-- ============================================================
-- cleanup_old_tasks function
-- Deletes completed tasks and past-dated tasks.
-- Does NOT modify stats tables (XP already captured).
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_old_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM tasks WHERE completed = true OR task_date < CURRENT_DATE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION cleanup_old_tasks FROM anon;
GRANT EXECUTE ON FUNCTION cleanup_old_tasks TO authenticated;

-- ============================================================
-- backfill_stats function (idempotent one-time migration)
-- Populates daily_stats and user_stats from existing tasks.
-- Guarded by migration_log sentinel.
-- ============================================================
CREATE OR REPLACE FUNCTION backfill_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Guard: only run once
  IF EXISTS (SELECT 1 FROM migration_log WHERE id = 'backfill_stats') THEN
    RETURN;
  END IF;

  -- Backfill daily_stats: planned from all tasks, completed from completed tasks
  INSERT INTO daily_stats (user_id, date, planned_xp, planned_tasks, completed_xp, completed_tasks)
  SELECT
    user_id,
    task_date,
    COALESCE(SUM(xp), 0),
    COUNT(*),
    COALESCE(SUM(CASE WHEN completed THEN xp ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN completed THEN 1 ELSE 0 END), 0)
  FROM tasks
  GROUP BY user_id, task_date
  ON CONFLICT (user_id, date) DO UPDATE SET
    planned_xp = EXCLUDED.planned_xp,
    planned_tasks = EXCLUDED.planned_tasks,
    completed_xp = EXCLUDED.completed_xp,
    completed_tasks = EXCLUDED.completed_tasks,
    updated_at = now();

  -- Backfill user_stats: lifetime_xp from completed tasks
  INSERT INTO user_stats (user_id, lifetime_xp)
  SELECT user_id, COALESCE(SUM(xp), 0)
  FROM tasks
  WHERE completed = true
  GROUP BY user_id
  ON CONFLICT (user_id) DO UPDATE SET
    lifetime_xp = EXCLUDED.lifetime_xp,
    updated_at = now();

  -- Ensure all profiles have a user_stats row (even if 0 XP)
  INSERT INTO user_stats (user_id, lifetime_xp)
  SELECT id, 0 FROM profiles
  WHERE id NOT IN (SELECT user_id FROM user_stats)
  ON CONFLICT (user_id) DO NOTHING;

  -- Mark as done
  INSERT INTO migration_log (id) VALUES ('backfill_stats');
END;
$$;

REVOKE EXECUTE ON FUNCTION backfill_stats FROM anon;
GRANT EXECUTE ON FUNCTION backfill_stats TO authenticated;

-- ============================================================
-- Run backfill now
-- ============================================================
SELECT backfill_stats();

-- ============================================================
-- Run initial cleanup: remove completed/past tasks (stats already captured)
-- ============================================================
SELECT cleanup_old_tasks();

-- ============================================================
-- Trigger: auto-cleanup on task completion via toggle
-- (We handle cleanup client-side + via cleanup_old_tasks,
--  but also add a trigger to delete completed tasks after stats update)
-- ============================================================
CREATE OR REPLACE FUNCTION delete_completed_task_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only delete if just marked completed
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    -- Return the row so the caller sees it, then it will be cleaned up
    -- by cleanup_old_tasks or the client. We do NOT delete here to avoid
    -- losing the returned row from toggle_task_complete.
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

-- We rely on client-side + periodic cleanup instead of a trigger,
-- so the toggle function can return the row before deletion.
-- The client calls cleanup_old_tasks() after mutations.

-- ============================================================
-- Ensure all existing profiles have user_stats rows
-- ============================================================
INSERT INTO user_stats (user_id, lifetime_xp)
SELECT p.id, COALESCE(us.lifetime_xp, 0)
FROM profiles p
LEFT JOIN user_stats us ON us.user_id = p.id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
