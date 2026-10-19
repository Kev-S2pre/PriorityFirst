import { calculateTimeRemaining } from './prioritizationEngine.js';

/**
 * Synthesizes a subtle, pleasant audio chime using browser Web Audio API
 * No external audio files or internet access needed
 */
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone chime (E5 -> B5)
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (err) {
    // Ignore audio autoplay restrictions gracefully
    console.debug('Audio chime skipped:', err);
  }
}

/**
 * Generates structured reminders from active tasks
 */
export function generateNotifications(tasks) {
  if (!Array.isArray(tasks)) return [];

  const notifications = [];
  const activeTasks = tasks.filter(t => t.status !== 'completed');

  activeTasks.forEach(task => {
    const { diffHours, isOverdue, isDueToday } = calculateTimeRemaining(task.deadlineDate, task.deadlineTime);

    if (isOverdue) {
      const overdueHrs = Math.abs(Math.round(diffHours));
      notifications.push({
        id: `notif-overdue-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        type: 'overdue',
        severity: 'critical',
        title: 'Overdue Task Alert',
        message: `"${task.title}" is overdue by ${overdueHrs > 24 ? Math.round(overdueHrs / 24) + ' day(s)' : overdueHrs + ' hour(s)'}.`,
        dueTimeFormatted: `${task.deadlineDate} ${task.deadlineTime || ''}`,
        category: task.category,
        importance: task.importance
      });
    } else if (isDueToday || (diffHours > 0 && diffHours <= 12)) {
      notifications.push({
        id: `notif-today-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        type: 'due_today',
        severity: 'warning',
        title: 'Due Today',
        message: `"${task.title}" is due today (${Math.max(1, Math.round(diffHours))}h remaining).`,
        dueTimeFormatted: `${task.deadlineTime || '23:59'}`,
        category: task.category,
        importance: task.importance
      });
    } else if (diffHours > 12 && diffHours <= 48) {
      notifications.push({
        id: `notif-approaching-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        type: 'approaching',
        severity: 'info',
        title: 'Approaching Deadline',
        message: `"${task.title}" deadline in ${Math.round(diffHours / 24)} day(s) (${task.deadlineDate}).`,
        dueTimeFormatted: `${task.deadlineDate}`,
        category: task.category,
        importance: task.importance
      });
    }
  });

  // Sort: Critical (overdue) first, then Warning (due today), then Info (approaching)
  const order = { critical: 1, warning: 2, info: 3 };
  notifications.sort((a, b) => order[a.severity] - order[b.severity]);

  return notifications;
}

/**
 * Browser Web Notifications API wrapper
 */
export const browserNotificationService = {
  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  async requestPermission() {
    if (!this.isSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  },

  send(title, options = {}) {
    if (!this.isSupported() || Notification.permission !== 'granted') return null;

    try {
      return new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options
      });
    } catch (err) {
      console.debug('Browser notification failed to dispatch:', err);
      return null;
    }
  }
};
