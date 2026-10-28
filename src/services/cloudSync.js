/**
 * PriorityFirst (PF) — Cloud auto-save
 * Keeps each signed-in user's tasks and settings in Supabase.
 * localStorage stays the fast local copy; this module mirrors changes to the cloud.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const isCloudEnabled = isSupabaseConfigured;

// Last version of each task known to be in the cloud, per user (id -> JSON string)
const syncedSnapshots = new Map();

const trimTime = (value) => (value ? String(value).slice(0, 5) : null);

// datetime-local value ("2026-10-30T09:00", local time) -> ISO timestamp, and back
function localToIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isoToLocal(value) {
  if (!value) return null;
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function taskToRow(task, userId) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description || '',
    category: task.category,
    deadline_date: task.deadlineDate,
    deadline_time: task.deadlineTime || '23:59',
    difficulty: task.difficulty,
    estimated_hours: task.estimatedHours,
    importance: task.importance,
    status: task.status,
    notes: task.notes || '',
    start_time: task.startTime || null,
    end_time: task.endTime || null,
    reminder_at: localToIso(task.reminderAt),
    created_at: task.createdAt,
    completed_at: task.completedAt || null
  };
}

function rowToTask(row) {
  const startTime = trimTime(row.start_time);
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category,
    deadlineDate: row.deadline_date,
    deadlineTime: trimTime(row.deadline_time) || '23:59',
    difficulty: row.difficulty,
    estimatedHours: Number(row.estimated_hours),
    importance: row.importance,
    status: row.status,
    notes: row.notes || '',
    startTime,
    endTime: trimTime(row.end_time),
    scheduledStartTime: startTime,
    reminderAt: isoToLocal(row.reminder_at),
    createdAt: row.created_at,
    completedAt: row.completed_at
  };
}

function settingsToRow(settings, userId) {
  return {
    user_id: userId,
    theme: settings.theme === 'dark' ? 'dark' : 'light',
    weights: settings.weights,
    weight_preset: settings.weightPreset || 'balanced',
    browser_notifications_enabled: !!settings.browserNotificationsEnabled,
    sound_alerts_enabled: !!settings.soundAlertsEnabled,
    daily_workload_limit_hours: Number(settings.dailyWorkloadLimitHours) || 8
  };
}

function rowToSettings(row) {
  return {
    theme: row.theme,
    weights: row.weights,
    weightPreset: row.weight_preset,
    browserNotificationsEnabled: row.browser_notifications_enabled,
    soundAlertsEnabled: row.sound_alerts_enabled,
    dailyWorkloadLimitHours: Number(row.daily_workload_limit_hours)
  };
}

function rememberSynced(userId, tasks) {
  syncedSnapshots.set(userId, new Map(tasks.map(t => [t.id, JSON.stringify(t)])));
}

export const cloudSync = {
  /**
   * Downloads the user's tasks and settings. Returns { tasks, settings } (settings may be null).
   */
  async pull(userId) {
    const [tasksRes, settingsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle()
    ]);
    if (tasksRes.error) throw tasksRes.error;
    if (settingsRes.error) throw settingsRes.error;

    const tasks = tasksRes.data.map(rowToTask);
    rememberSynced(userId, tasks);
    return { tasks, settings: settingsRes.data ? rowToSettings(settingsRes.data) : null };
  },

  /**
   * Uploads only what changed since the last sync: new/edited tasks are upserted,
   * removed tasks are deleted. Tasks added on another device are left alone.
   */
  async pushTasks(userId, tasks) {
    const previous = syncedSnapshots.get(userId) || new Map();
    const current = new Map(tasks.map(t => [t.id, JSON.stringify(t)]));

    const changed = tasks.filter(t => previous.get(t.id) !== current.get(t.id));
    const removedIds = [...previous.keys()].filter(id => !current.has(id));

    if (changed.length > 0) {
      const { error } = await supabase.from('tasks').upsert(changed.map(t => taskToRow(t, userId)));
      if (error) throw error;
    }
    if (removedIds.length > 0) {
      const { error } = await supabase.from('tasks').delete().eq('user_id', userId).in('id', removedIds);
      if (error) throw error;
    }

    rememberSynced(userId, tasks);
    return changed.length + removedIds.length;
  },

  async pushSettings(userId, settings) {
    const { error } = await supabase.from('user_settings').upsert(settingsToRow(settings, userId));
    if (error) throw error;
  },

  // Records tasks as already in the cloud (after the app normalizes pulled data)
  markSynced(userId, tasks) {
    rememberSynced(userId, tasks);
  },

  forget(userId) {
    syncedSnapshots.delete(userId);
  }
};
