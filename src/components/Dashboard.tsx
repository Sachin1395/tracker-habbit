import { useEffect, useState, useCallback } from 'react';
import {
  supabase,
  type Task,
  type TaskWithProfile,
  type Profile,
  type DailyStat,
  type UserStat,
  TREATED_BY_MIN_PLANNED_XP,
  DAILY_STATS_WINDOW_DAYS,
} from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { todayStr, toLocalDateStr, addDays, startOfWeek, endOfWeek, formatDateShort } from '@/lib/dates';

import BannerImage from './BannerImage';
import CurrentTopper from './CurrentTopper';
import TreatedBy from './TreatedBy';
import OverallLeaderboard, { type LeaderboardEntry, type LeaderboardMode } from './OverallLeaderboard';
import TodaysTasks from './TodaysTasks';
import MyTasks from './MyTasks';
import AddTaskModal from './AddTaskModal';
import DeleteAccountModal from './DeleteAccountModal';
import DailyXpLeaderboard, { type DailyLeaderboardEntry } from './DailyXpLeaderboard';
import HabitHeatmap from './HabitHeatmap';
import XpSummary from './XpSummary';

const ORANGE = '#FF9F1C';
const PRIMARY = '#F5F5F5';
const SECONDARY = '#A1A1AA';
const MUTED = '#71717A';

type HeatmapDay = { date: string; xp: number; count: number };

export default function Dashboard() {
  const { session, profile, signOut, deleteAccount } = useAuth();
  const [allTasks, setAllTasks] = useState<TaskWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [leaderboardMode, setLeaderboardMode] = useState<LeaderboardMode>('xp');

  const currentUserId = session?.user.id;

  // ---------- Data fetching ----------

  const fetchTasks = useCallback(async () => {
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

  const fetchDailyStats = useCallback(async () => {
    const cutoff = toLocalDateStr(addDays(new Date(), -(DAILY_STATS_WINDOW_DAYS - 1)));
    const { data } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('date', cutoff);
    if (data) setDailyStats(data as DailyStat[]);
  }, []);

  const fetchUserStats = useCallback(async () => {
    const { data } = await supabase.from('user_stats').select('*');
    if (data) setUserStats(data as UserStat[]);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchTasks(), fetchProfiles(), fetchDailyStats(), fetchUserStats()]);
  }, [fetchTasks, fetchProfiles, fetchDailyStats, fetchUserStats]);

  useEffect(() => {
    refreshAll().then(() => setLoading(false));

    const taskChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    const profileChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchProfiles();
      })
      .subscribe();

    const dailyStatsChannel = supabase
      .channel('daily-stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_stats' }, () => {
        fetchDailyStats();
      })
      .subscribe();

    const userStatsChannel = supabase
      .channel('user-stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats' }, () => {
        fetchUserStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(dailyStatsChannel);
      supabase.removeChannel(userStatsChannel);
    };
  }, [refreshAll, fetchTasks, fetchProfiles, fetchDailyStats, fetchUserStats]);

  // ---------- Derived data ----------

  const myTasks: Task[] = currentUserId
    ? allTasks.filter((t) => t.user_id === currentUserId)
    : [];

  // Week boundaries (local date strings)
  const weekStartStr = toLocalDateStr(startOfWeek(new Date()));
  const weekEndStr = toLocalDateStr(endOfWeek(new Date()));
  const weekStartLabel = formatDateShort(weekStartStr);
  const weekEndLabel = formatDateShort(weekEndStr);

  // Per-user weekly aggregation from daily_stats
  const weeklyAgg = new Map<string, { completedXp: number; plannedXp: number }>();
  for (const ds of dailyStats) {
    if (ds.date >= weekStartStr && ds.date <= weekEndStr) {
      const existing = weeklyAgg.get(ds.user_id) ?? { completedXp: 0, plannedXp: 0 };
      existing.completedXp += ds.completed_xp;
      existing.plannedXp += ds.planned_xp;
      weeklyAgg.set(ds.user_id, existing);
    }
  }

  // Lifetime XP map
  const lifetimeXpMap = new Map<string, number>();
  for (const us of userStats) {
    lifetimeXpMap.set(us.user_id, us.lifetime_xp);
  }

  // Overall leaderboard — XP mode uses lifetime_xp, completion mode uses weekly
  const overallLeaderboard: LeaderboardEntry[] = profiles
    .map((p) => {
      const weekly = weeklyAgg.get(p.id) ?? { completedXp: 0, plannedXp: 0 };
      const completionRate =
        weekly.plannedXp > 0 ? (weekly.completedXp / weekly.plannedXp) * 100 : 0;
      return {
        userId: p.id,
        name: p.name,
        totalXp: lifetimeXpMap.get(p.id) ?? 0,
        weeklyCompletedXp: weekly.completedXp,
        weeklyPlannedXp: weekly.plannedXp,
        completionRate,
      };
    })
    .sort((a, b) => {
      if (leaderboardMode === 'xp') {
        return b.weeklyCompletedXp - a.weeklyCompletedXp || a.name.localeCompare(b.name);
      }
      return b.completionRate - a.completionRate || a.name.localeCompare(b.name);
    });

  const currentTopper = (() => {
    const top = [...overallLeaderboard].sort(
      (a, b) => b.totalXp - a.totalXp || a.name.localeCompare(b.name)
    );
    return top.length > 0 && top[0].totalXp > 0 ? top[0] : null;
  })();

  // Treated By: filter users with weekly planned >= 25, pick lowest completion rate
  // Tie-break: lowest completed XP, then name
  const treatedByUser = (() => {
    const eligible = overallLeaderboard.filter(
      (e) => e.weeklyPlannedXp >= TREATED_BY_MIN_PLANNED_XP
    );
    if (eligible.length === 0) return null;
    return eligible.reduce((min, e) => {
      if (e.completionRate < min.completionRate) return e;
      if (e.completionRate === min.completionRate) {
        if (e.weeklyCompletedXp < min.weeklyCompletedXp) return e;
        if (e.weeklyCompletedXp === min.weeklyCompletedXp) {
          return e.name.localeCompare(min.name) < 0 ? e : min;
        }
      }
      return min;
    });
  })();

  // Today's tasks (active only — completed tasks get auto-deleted)
  const todaysTasks = allTasks
    .filter((t) => t.task_date === todayStr())
    .sort((a, b) => Number(a.completed) - Number(b.completed));

  // Daily XP leaderboard from daily_stats for selected date
  const dailyLeaderboard: DailyLeaderboardEntry[] = profiles
    .map((p) => {
      const ds = dailyStats.find(
        (d) => d.user_id === p.id && d.date === selectedDate
      );
      return {
        userId: p.id,
        name: p.name,
        dailyXp: ds?.completed_xp ?? 0,
      };
    })
    .sort((a, b) => b.dailyXp - a.dailyXp || a.name.localeCompare(b.name));

  // XP Summary values from daily_stats + user_stats
  const today = todayStr();
  const myTodayStats = dailyStats.find(
    (d) => d.user_id === currentUserId && d.date === today
  );
  const dailyXp = myTodayStats?.completed_xp ?? 0;

  const myWeeklyCompletedXp = weeklyAgg.get(currentUserId ?? '')?.completedXp ?? 0;
  const overallXp = lifetimeXpMap.get(currentUserId ?? '') ?? 0;

  // Heatmap from daily_stats (completed_xp + completed_tasks)
  const heatmapData = new Map<string, HeatmapDay>();
  for (const ds of dailyStats) {
    if (ds.user_id === currentUserId && ds.completed_xp > 0) {
      heatmapData.set(ds.date, {
        date: ds.date,
        xp: ds.completed_xp,
        count: ds.completed_tasks,
      });
    }
  }

  // ---------- Mutations (via RPC) ----------

  async function runCleanup() {
    await supabase.rpc('cleanup_old_tasks');
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

    const { data, error } = await supabase.rpc('add_task', {
      p_task_name: taskName,
      p_xp: xp,
      p_task_date: taskDate,
      p_completed: completed,
    });

    if (error) {
      setAllTasks((prev) => prev.filter((t) => t.id !== tempId));
      throw error;
    }

    if (data) {
      const realTask = data as unknown as TaskWithProfile;
      // Fetch the profile join since RPC returns bare task
      realTask.profiles = profile ? { name: profile.name } : null;
      setAllTasks((prev) => prev.map((t) => (t.id === tempId ? realTask : t)));
    }

    // Stats will update via realtime, but also force-refresh for snappiness
    await Promise.all([fetchDailyStats(), fetchUserStats()]);
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

    const { data, error } = await supabase.rpc('toggle_task_complete', {
      p_task_id: task.id,
    });

    if (error) {
      setAllTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, completed: !newCompleted, completed_at: newCompleted ? null : now }
            : t
        )
      );
      console.error('Toggle error:', error);
      return;
    }

    if (data) {
      const updated = data as unknown as Task;
      // Keep the task in the list (completed tasks stay visible for today)
      setAllTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, ...updated, profiles: t.profiles } : t))
      );
    }

    await Promise.all([fetchDailyStats(), fetchUserStats()]);
  }

  async function handleDeleteTask(task: Task) {
    setAllTasks((prev) => prev.filter((t) => t.id !== task.id));

    const { error } = await supabase.rpc('delete_task', {
      p_task_id: task.id,
    });

    if (error) {
      fetchTasks();
      console.error('Delete error:', error);
    }

    await Promise.all([fetchDailyStats(), fetchUserStats()]);
  }

  // ---------- Date navigation (14-day limit) ----------

  const minSelectableDate = toLocalDateStr(addDays(new Date(), -(DAILY_STATS_WINDOW_DAYS - 1)));
  const maxSelectableDate = todayStr();

  function handlePrevDate() {
    const prev = toLocalDateStr(addDays(new Date(selectedDate + 'T00:00:00'), -1));
    if (prev >= minSelectableDate) setSelectedDate(prev);
  }
  function handleNextDate() {
    const next = toLocalDateStr(addDays(new Date(selectedDate + 'T00:00:00'), 1));
    if (next <= maxSelectableDate) setSelectedDate(next);
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
      <div className="ambient-glow ambient-glow-orange" style={{ top: '0px', right: '-50px', width: '350px', height: '350px' }} />
      <div className="ambient-glow ambient-glow-white" style={{ top: '40%', left: '-80px', width: '300px', height: '300px' }} />

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
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-sm font-medium px-3 py-1.5 rounded-xl transition"
              style={{ color: MUTED, border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              Delete account
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <BannerImage imageSrc="/banner.jpeg" />

        <XpSummary
          dailyXp={dailyXp}
          weeklyXp={myWeeklyCompletedXp}
          overallXp={overallXp}
          weekLabel={`${weekStartLabel} – ${weekEndLabel}`}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <CurrentTopper topper={currentTopper} />
          <TreatedBy name={treatedByUser?.name ?? null} />
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary px-5 py-2.5"
          >
            + Add Task
          </button>
        </div>

        <OverallLeaderboard
          entries={overallLeaderboard}
          mode={leaderboardMode}
          onModeChange={setLeaderboardMode}
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <TodaysTasks tasks={todaysTasks} />
          <MyTasks tasks={myTasks} onToggle={handleToggleTask} onDelete={handleDeleteTask} />
        </div>

        <DailyXpLeaderboard
          selectedDate={selectedDate}
          onPrev={handlePrevDate}
          onNext={handleNextDate}
          entries={dailyLeaderboard}
          currentUserId={currentUserId}
          canGoPrev={selectedDate > minSelectableDate}
          canGoNext={selectedDate < maxSelectableDate}
        />

        <HabitHeatmap data={heatmapData} maxDays={DAILY_STATS_WINDOW_DAYS} />
      </main>

      <AddTaskModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTask}
      />

      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteAccount}
      />
    </div>
  );
}
