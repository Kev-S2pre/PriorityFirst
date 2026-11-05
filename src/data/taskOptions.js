export const TASK_CATEGORIES = [
  { value: 'work / professional', label: 'Work / Professional' },
  { value: 'school / studies', label: 'School / Studies' },
  { value: 'project', label: 'Project' },
  { value: 'responsibilities', label: 'Personal & Home' },
  { value: 'errands', label: 'Errands / Appointments' },
  { value: 'training / exercise', label: 'Health & Fitness' },
  { value: 'hangouts / social activities', label: 'Social / Family' },
  { value: 'games / gaming', label: 'Hobbies & Gaming' },
  { value: 'rest / personal time', label: 'Rest / Personal Time' },
  { value: 'other activities', label: 'Other' }
];

export const DEFAULT_CATEGORY = 'other activities';

// Categories from the original student-only version map onto the general ones
const LEGACY_CATEGORIES = {
  assignment: 'school / studies',
  'laboratory activity': 'school / studies',
  calculation: 'school / studies',
  report: 'school / studies',
  'personal responsibility': 'responsibilities'
};

export function normalizeCategory(category) {
  const value = String(category || '').toLowerCase();
  if (TASK_CATEGORIES.some(option => option.value === value)) return value;
  return LEGACY_CATEGORIES[value] || DEFAULT_CATEGORY;
}

export function categoryLabel(category) {
  const value = normalizeCategory(category);
  return TASK_CATEGORIES.find(option => option.value === value)?.label || value;
}

export function categoryClassName(category) {
  return `category-${normalizeCategory(category).split(/[ /]/)[0]}`;
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

// Friendly deadline: "Today, 5:00 PM", "Tomorrow, 2:00 PM", "Fri, Nov 7, 5:00 PM"
export function formatDeadline(dateStr, timeStr = '23:59') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || '')) return '';
  const time = formatTime(timeStr || '23:59');
  const days = calendarDaysUntil(dateStr);
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Tomorrow, ${time}`;
  if (days === -1) return `Yesterday, ${time}`;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const label = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
  return `${label}, ${time}`;
}
