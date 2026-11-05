import React, { useEffect, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { isTimerRunning, trackedMinutes, formatMinutes } from '../services/timeTracking.js';

/** Start/stop timer for a task; shows the time tracked so far and ticks while running */
export default function TimerButton({ task, onToggleTimer, compact = false }) {
  const running = isTimerRunning(task);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setNow(new Date()), 15 * 1000);
    return () => clearInterval(timer);
  }, [running]);

  if (task.status === 'completed') return null;
  const minutes = trackedMinutes(task, running ? now : new Date(0));
  const label = running ? `Stop timer (${formatMinutes(minutes)} tracked)` : `Start timer${minutes ? ` (${formatMinutes(minutes)} tracked)` : ''}`;

  return (
    <button
      type="button"
      className={`timer-btn ${running ? 'running' : ''} ${compact ? 'compact' : ''}`}
      onClick={(e) => { e.stopPropagation(); onToggleTimer(task.id); }}
      aria-label={`${label} for "${task.title}"`}
      title={label}
    >
      {running ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
      {(!compact || running || minutes > 0) && (
        <span>{running || minutes > 0 ? formatMinutes(minutes) : 'Start'}</span>
      )}
    </button>
  );
}
