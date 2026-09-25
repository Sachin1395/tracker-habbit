import { useEffect, useState, useCallback } from 'react';
import { supabase, type Task, type TaskWithProfile, type Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { todayStr, toLocalDateStr, addDays } from '@/lib/dates';

import BannerImage from './BannerImage';
import CurrentTopper from './CurrentTopper';
import TreatedBy from './TreatedBy';
import OverallLeaderboard, { type LeaderboardEntry } from './OverallLeaderboard';
import TodaysTasks from './TodaysTasks';
import MyTasks from './MyTasks';
import AddTaskModal from './AddTaskModal';
import DailyXpLeaderboard, { type DailyLeaderboardEntry } from './DailyXpLeaderboard';
import HabitHeatmap from './HabitHeatmap';
import XpSummary from './XpSummary';

type HeatmapDay = { date: string; xp: number; count: number };

export default function Dashboard() {
  const { session, profile, signOut } = useAuth();
  const [allTasks, setAllTasks] = useState<TaskWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const currentUserId = session?.user.id;

  // Fetch all tasks with profile names
  const fetchAllTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, profiles(name)')
      .order('created_at', { ascending: false });
    if (data) setAllTasks(data as TaskWithProfile[]);
  }, []);

  // Fetch all profiles for leaderboards
  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('name');
    if (data) setProfiles(data as Profile[]);
  }, []);

  useEffect(() => {
    fetchAllTasks();
    fetchProfiles().then(() => setLoading(false));

    // Real-time subscriptions — sync across sessions/devices
    const taskChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchAllTasks();
      })
      .subscribe();

    const profileChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [fetchAllTasks, fetchProfiles]);

  // Derive my tasks directly from allTasks — no duplicate state
  const myTasks: Task[] = currentUserId
    ? allTasks.filter((t) => t.user_id === currentUserId)
    : [];

  // Compute overall leaderboard (lifetime XP from completed tasks)
  const overallLeaderboard: LeaderboardEntry[] = profiles
    .map((p) => {
      const totalXp = allTasks
        .filter((t) => t.user_id === p.id && t.completed)
        .reduce((sum, t) => sum + t.xp, 0);
      return { userId: p.id, name: p.name, totalXp };
    })
    .sort((a, b) => b.totalXp - a.totalXp);

  const currentTopper = overallLeaderboard[0] ?? null;

  // Treated by: the user with lowest overall XP among those with at least 1 completed task
  const activeUsers = overallLeaderboard.filter((e) => e.totalXp > 0);
  const treatedByUser = activeUsers.length > 0
    ? activeUsers.reduce((min, e) => (e.totalXp < min.totalXp ? e : min))
    : null;

  // Today's tasks
  const todaysTasks = allTasks
    .filter((t) => t.task_date === todayStr())
    .sort((a, b) => Number(a.completed) - Number(b.completed));

  // Daily XP leaderboard for selected date
  const dailyLeaderboard: DailyLeaderboardEntry[] = profiles
    .map((p) => {
      const dailyXp = allTasks
        .filter((t) => t.user_id === p.id && t.task_date === selectedDate && t.completed)
        .reduce((sum, t) => sum + t.xp, 0);
      return { userId: p.id, name: p.name, dailyXp };
    })
    .sort((a, b) => b.dailyXp - a.dailyXp);

  // Heatmap data for current user
  const heatmapData = new Map<string, HeatmapDay>();
  for (const task of myTasks) {
    if (!task.completed) continue;
    const existing = heatmapData.get(task.task_date);
    if (existing) {
      existing.xp += task.xp;
      existing.count += 1;
    } else {
      heatmapData.set(task.task_date, { date: task.task_date, xp: task.xp, count: 1 });
    }
  }

  // --- Optimistic mutations ---

  async function handleAddTask(taskName: string, xp: number, taskDate: string, completed: boolean) {
    if (!currentUserId) return;
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Optimistic insert
    const optimisticTask: TaskWithProfile = {
      id: tempId,
      user_id: currentUserId,
      task_name: taskName,
      xp: xp as Task['xp'],
      task_date: taskDate,
      completed,
      completed_at: completed ? now : null,
      created_at: now,
      profiles: profile ? { name: profile.name } : null,
    };
    setAllTasks((prev) => [optimisticTask, ...prev]);

    // Persist to DB
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        task_name: taskName,
        xp,
        task_date: taskDate,
        completed,
        completed_at: completed ? now : null,
      })
      .select('*, profiles(name)')
      .single();

    if (error) {
      // Rollback on failure
      setAllTasks((prev) => prev.filter((t) => t.id !== tempId));
      throw error;
    }

    // Replace temp with real row
    if (data) {
      setAllTasks((prev) => prev.map((t) => (t.id === tempId ? (data as TaskWithProfile) : t)));
    }
  }

  async function handleToggleTask(task: Task) {
    const newCompleted = !task.completed;
    const now = new Date().toISOString();

    // Optimistic update
    setAllTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, completed: newCompleted, completed_at: newCompleted ? now : null }
          : t
      )
    );

    const { error } = await supabase
      .from('tasks')
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? now : null,
      })
      .eq('id', task.id);

    if (error) {
      // Rollback on failure
      setAllTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, completed: !newCompleted, completed_at: newCompleted ? null : now }
            : t
        )
      );
      console.error('Toggle error:', error);
    }
  }

  async function handleDeleteTask(task: Task) {
    // Optimistic delete
    setAllTasks((prev) => prev.filter((t) => t.id !== task.id));

    const { error } = await supabase.from('tasks').delete().eq('id', task.id);

    if (error) {
      // Re-fetch to restore on failure
      fetchAllTasks();
      console.error('Delete error:', error);
    }
  }

  function handlePrevDate() {
    setSelectedDate(toLocalDateStr(addDays(new Date(selectedDate + 'T00:00:00'), -1)));
  }
  function handleNextDate() {
    setSelectedDate(toLocalDateStr(addDays(new Date(selectedDate + 'T00:00:00'), 1)));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-slate-950 font-bold text-lg">X</span>
            </div>
            <h1 className="text-white font-bold text-lg hidden sm:block">XP Tracker</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-white text-sm font-medium">{profile?.name}</div>
              <div className="text-slate-500 text-xs">{profile?.email}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold text-sm">
              {profile?.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={signOut}
              className="text-slate-400 hover:text-white text-sm font-medium transition px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 1. Banner Image Placeholder */}
        <BannerImage />

        {/* XP Summary cards */}
        <XpSummary myTasks={myTasks} />

        {/* 2 & 3. Current Topper + Treated By */}
        <div className="grid sm:grid-cols-2 gap-4">
          <CurrentTopper topper={currentTopper} />
          <TreatedBy name={treatedByUser?.name ?? null} />
        </div>

        {/* Add task button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-300 hover:to-orange-400 transition shadow-lg shadow-orange-500/10"
          >
            + Add Task
          </button>
        </div>

        {/* 4. Overall Leaderboard + 5. Today's Tasks */}
        <div className="grid lg:grid-cols-2 gap-6">
          <OverallLeaderboard entries={overallLeaderboard} />
          <TodaysTasks tasks={todaysTasks} />
        </div>

        {/* 6. My Tasks */}
        <MyTasks tasks={myTasks} onToggle={handleToggleTask} onDelete={handleDeleteTask} />

        {/* Daily XP Leaderboard with date navigator */}
        <DailyXpLeaderboard
          selectedDate={selectedDate}
          onPrev={handlePrevDate}
          onNext={handleNextDate}
          entries={dailyLeaderboard}
          currentUserId={currentUserId}
        />

        {/* Habit Heatmap */}
        <HabitHeatmap data={heatmapData} />
      </main>

      <AddTaskModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTask}
      />
    </div>
  );
}
