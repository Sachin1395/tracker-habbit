/*
# Update cleanup_old_tasks to preserve today's completed tasks

## Problem
The original cleanup function deleted ALL completed tasks immediately.
This meant completed tasks vanished from the "My Tasks" list instantly,
with no visible record of what was done that day.

## Change
Modified `cleanup_old_tasks()` to only delete tasks where `task_date < CURRENT_DATE`.
This removes all past-dated tasks (both completed and incomplete) but keeps
today's completed tasks visible in the My Tasks list until the next day.

## Behavior
- Today's completed tasks: KEPT (visible in My Tasks with strikethrough)
- Today's incomplete tasks: KEPT
- Past-dated tasks (any status): DELETED (stats already captured in daily_stats)
*/

CREATE OR REPLACE FUNCTION cleanup_old_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Only delete tasks from past dates; today's tasks (completed or not) stay visible
  DELETE FROM tasks WHERE task_date < CURRENT_DATE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION cleanup_old_tasks FROM anon;
GRANT EXECUTE ON FUNCTION cleanup_old_tasks TO authenticated;
