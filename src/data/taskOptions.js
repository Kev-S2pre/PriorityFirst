export const TASK_CATEGORIES = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'project', label: 'Project' },
  { value: 'laboratory activity', label: 'Laboratory Activity' },
  { value: 'calculation', label: 'Calculation' },
  { value: 'report', label: 'Report' },
  { value: 'personal responsibility', label: 'Personal Responsibility' },
  { value: 'school / studies', label: 'School / Studies' },
  { value: 'work / professional', label: 'Work / Professional' },
  { value: 'responsibilities', label: 'Responsibilities' },
  { value: 'games / gaming', label: 'Games / Gaming' },
  { value: 'hangouts / social activities', label: 'Hangouts / Social Activities' },
  { value: 'training / exercise', label: 'Training / Exercise' },
  { value: 'rest / personal time', label: 'Rest / Personal Time' },
  { value: 'other activities', label: 'Other Activities' }
];

export function categoryClassName(category) {
  return `category-${String(category || 'assignment').toLowerCase().split(/[ /]/)[0]}`;
}

function minutesFromTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value || '')) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60 ? hours * 60 + minutes : null;
}

export function durationFromTimes(startTime, endTime) {
  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);
  return start === null || end === null || end <= start ? null : (end - start) / 60;
}

export function formatTime(value) {
  const minutes = minutesFromTime(value);
  if (minutes === null) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(mins).padStart(2, '0')} ${suffix}`;
}

export function formatDuration(hours) {
  const minutes = Math.round((Number(hours) || 0) * 60);
  if (minutes <= 0) return '0 min';
  const wholeHours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return [wholeHours && `${wholeHours} hr${wholeHours === 1 ? '' : 's'}`, remainingMinutes && `${remainingMinutes} min`]
    .filter(Boolean)
    .join(' ');
}

export function taskTimeSummary(task) {
  const startTime = task.startTime || task.scheduledStartTime;
  const endTime = task.endTime;
  const duration = durationFromTimes(startTime, endTime);
  if (duration !== null) {
    return { range: `${formatTime(startTime)} – ${formatTime(endTime)}`, duration: formatDuration(duration) };
  }
  return { range: '', duration: formatDuration(task.estimatedHours) };
}

// Whole calendar days from today to a YYYY-MM-DD date (0 = today)
export function calendarDaysUntil(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d) - today) / 86400000);
}
