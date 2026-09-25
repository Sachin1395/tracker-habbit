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

const ORANGE = '#FF9F1C';
const PRIMARY = '#F5F5F5';
const SECONDARY = '#A1A1AA';
const MUTED = '#71717A';

type HeatmapDay = { date: string; xp: number; count: number };

export default function Dashboard() {
  const { session, profile, signOut } = useAuth();
  const [allTasks, setAllTasks] = useState<TaskWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const currentUserId = session?.user.id;

  const fetchAllTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, profiles(name)')
      .order('created_at', { ascending: false });
    if (data) setAllTasks(data as TaskWithProfile[]);
  }, []);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('name');
    if (data) setProfiles(data as Profile[]);
  }, []);

  useEffect(() => {
    fetchAllTasks();
    fetchProfiles().then(() => setLoading(false));

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

  const myTasks: Task[] = currentUserId
    ? allTasks.filter((t) => t.user_id === currentUserId)
    : [];

  const overallLeaderboard: LeaderboardEntry[] = profiles
    .map((p) => {
      const totalXp = allTasks
        .filter((t) => t.user_id === p.id && t.completed)
        .reduce((sum, t) => sum + t.xp, 0);
      return { userId: p.id, name: p.name, totalXp };
    })
    .sort((a, b) => b.totalXp - a.totalXp);

  const currentTopper = overallLeaderboard[0] ?? null;

  const activeUsers = overallLeaderboard.filter((e) => e.totalXp > 0);
  const treatedByUser = activeUsers.length > 0
    ? activeUsers.reduce((min, e) => (e.totalXp < min.totalXp ? e : min))
    : null;

  const todaysTasks = allTasks
    .filter((t) => t.task_date === todayStr())
    .sort((a, b) => Number(a.completed) - Number(b.completed));

  const dailyLeaderboard: DailyLeaderboardEntry[] = profiles
    .map((p) => {
      const dailyXp = allTasks
        .filter((t) => t.user_id === p.id && t.task_date === selectedDate && t.completed)
        .reduce((sum, t) => sum + t.xp, 0);
      return { userId: p.id, name: p.name, dailyXp };
    })
    .sort((a, b) => b.dailyXp - a.dailyXp);

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

  async function handleAddTask(taskName: string, xp: number, taskDate: string, completed: boolean) {
    if (!currentUserId) return;
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();

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
      setAllTasks((prev) => prev.filter((t) => t.id !== tempId));
      throw error;
    }

    if (data) {
      setAllTasks((prev) => prev.map((t) => (t.id === tempId ? (data as TaskWithProfile) : t)));
    }
  }

  async function handleToggleTask(task: Task) {
    const newCompleted = !task.completed;
    const now = new Date().toISOString();

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
    setAllTasks((prev) => prev.filter((t) => t.id !== task.id));

    const { error } = await supabase.from('tasks').delete().eq('id', task.id);

    if (error) {
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-lg" style={{ color: SECONDARY }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Ambient glows */}
      <div className="ambient-glow ambient-glow-orange" style={{ top: '0px', right: '-50px', width: '350px', height: '350px' }} />
      <div className="ambient-glow ambient-glow-white" style={{ top: '40%', left: '-80px', width: '300px', height: '300px' }} />

      {/* Top bar */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,159,28,0.12)', border: '1px solid rgba(255,159,28,0.18)' }}>
              <span className="font-bold text-lg" style={{ color: ORANGE }}>X</span>
            </div>
            <h1 className="font-bold text-lg hidden sm:block" style={{ color: PRIMARY }}>XP Tracker</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium" style={{ color: PRIMARY }}>{profile?.name}</div>
              <div className="text-xs" style={{ color: MUTED }}>{profile?.email}</div>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm" style={{ background: 'rgba(255,255,255,0.06)', color: SECONDARY }}>
              {profile?.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={signOut}
              className="btn-secondary text-sm font-medium px-3 py-1.5"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 1. Banner Image Placeholder */}
        <BannerImage imageSrc="/banner2.jpeg" />

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
            className="btn-primary px-5 py-2.5"
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
