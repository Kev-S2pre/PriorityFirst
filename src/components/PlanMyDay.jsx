import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Edit3,
  Pin,
  Scissors,
  AlertTriangle,
  Clock,
  Coffee,
  Settings,
  Plus,
  Sparkles
} from 'lucide-react';
import { planDay, dateKey, DEFAULT_PLANNER } from '../services/dayPlanner.js';
import { categoryClassName, categoryLabel, formatTime, formatDuration, formatDeadline } from '../data/taskOptions.js';
import { CATEGORY_ICONS } from '../data/categoryIcons.js';

function addDays(key, days) {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + days));
}

function dayLabel(key, todayKey) {
  if (key === todayKey) return 'Today';
  if (key === addDays(todayKey, 1)) return 'Tomorrow';
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function PlanMyDay({ rankedTasks, settings, onToggleComplete, onEditTask, onOpenAddTask, onOpenSettings }) {
  // Re-plan every minute so the timeline keeps up with the clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);
  const todayKey = dateKey(now);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const days = Array.from({ length: 7 }, (_, i) => addDays(todayKey, i));

  const dayStart = settings.dayStart || DEFAULT_PLANNER.dayStart;
  const dayEnd = settings.dayEnd || DEFAULT_PLANNER.dayEnd;

  const plan = useMemo(() => planDay(rankedTasks, {
    date: selectedDate,
    now,
    dayStart,
    dayEnd,
    breakMinutes: settings.breakMinutes ?? DEFAULT_PLANNER.breakMinutes,
    limitHours: settings.dailyWorkloadLimitHours || 8
  }), [rankedTasks, selectedDate, now, dayStart, dayEnd, settings.breakMinutes, settings.dailyWorkloadLimitHours]);

  const loadPercent = plan.limitMinutes > 0 ? Math.min(100, Math.round((plan.plannedMinutes / plan.limitMinutes) * 100)) : 0;
  const fixedCount = plan.blocks.filter(b => b.type === 'fixed').length;

  return (
    <div className="plan-view">
      <div className="plan-hero">
        <div>
          <h1 className="view-title">
            <CalendarClock size={26} style={{ color: 'var(--primary)' }} />
            <span>Plan My Day</span>
          </h1>
          <p className="view-subtitle">
            Your top-priority tasks, fitted into your free time. Fixed appointments stay where they are.
          </p>
        </div>
        <button type="button" className="btn-secondary plan-hours-btn" onClick={onOpenSettings} id="btn-plan-hours">
          <Settings size={15} />
          <span>{formatTime(dayStart)} – {formatTime(dayEnd)}</span>
        </button>
      </div>

      <div className="plan-day-strip" role="tablist" aria-label="Choose a day">
        {days.map(key => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selectedDate === key}
            className={`plan-day-chip ${selectedDate === key ? 'active' : ''}`}
            onClick={() => setSelectedDate(key)}
          >
            {dayLabel(key, todayKey)}
          </button>
        ))}
      </div>

      <div className="plan-summary">
        <div className="plan-summary-item">
          <span className="plan-summary-value">{formatDuration(plan.plannedMinutes / 60)}</span>
          <span className="plan-summary-label">planned of {settings.dailyWorkloadLimitHours || 8} hr limit</span>
          <div className="priority-bar-meter" aria-hidden="true">
            <div className="priority-bar-fill" style={{ width: `${loadPercent}%`, background: loadPercent >= 100 ? 'var(--warning)' : 'var(--primary)' }} />
          </div>
        </div>
        <div className="plan-summary-item">
          <span className="plan-summary-value">{plan.blocks.length}</span>
          <span className="plan-summary-label">{plan.blocks.length === 1 ? 'block' : 'blocks'}{fixedCount ? ` · ${fixedCount} fixed` : ''}</span>
        </div>
        <div className="plan-summary-item">
          <span className={`plan-summary-value ${plan.unscheduled.length ? 'warn' : ''}`}>{plan.unscheduled.length}</span>
          <span className="plan-summary-label">{plan.unscheduled.length === 1 ? 'task does' : 'tasks do'} not fit</span>
        </div>
      </div>

      {plan.closed && plan.blocks.length === 0 ? (
        <div className="glass-card plan-empty">
          <Coffee size={28} style={{ color: 'var(--text-muted)' }} />
          <h3>Your working hours are over for today</h3>
          <p>Pick tomorrow above to plan ahead, or change your working hours.</p>
        </div>
      ) : plan.blocks.length === 0 ? (
        <div className="glass-card plan-empty">
          <Sparkles size={28} style={{ color: 'var(--primary)' }} />
          <h3>Nothing to plan for {dayLabel(selectedDate, todayKey).toLowerCase()}</h3>
          <p>Add a task with a deadline on or after this day and it will appear here.</p>
          <button type="button" className="btn-primary" onClick={() => onOpenAddTask(selectedDate)}>
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      ) : (
        <ol className="plan-timeline">
          {plan.blocks.map((block, index) => {
            const { task } = block;
            const Icon = CATEGORY_ICONS[task.category] || Clock;
            const next = plan.blocks[index + 1];
            const gap = next ? next.start - block.end : 0;
            const subtasks = task.subtasks || [];
            const doneSubtasks = subtasks.filter(s => s.done).length;
            return (
              <React.Fragment key={`${block.taskId}-${block.start}`}>
                <li className={`plan-block ${block.type}`}>
                  <div className="plan-time">
                    <span>{formatTime(block.startTime)}</span>
                    <span className="plan-time-end">{formatTime(block.endTime)}</span>
                  </div>
                  <div className="plan-card">
                    <button
                      type="button"
                      className="plan-check"
                      onClick={() => onToggleComplete(task.id)}
                      aria-label={`Mark "${task.title}" as done`}
                      title="Mark as done"
                    >
                      <Circle size={20} />
                    </button>
                    <div className="plan-card-body">
                      <div className="plan-card-title">{task.title}</div>
                      <div className="plan-card-meta">
                        <span className={`category-badge ${categoryClassName(task.category)}`}>
                          <Icon size={12} /> {categoryLabel(task.category)}
                        </span>
                        <span>{formatDuration(block.minutes / 60)}</span>
                        {block.type === 'fixed' && <span className="plan-tag fixed"><Pin size={11} /> Fixed time</span>}
                        {block.partial && <span className="plan-tag partial"><Scissors size={11} /> Part of {formatDuration(task.estimatedHours)}</span>}
                        {subtasks.length > 0 && <span className="plan-tag"><CheckCircle2 size={11} /> {doneSubtasks}/{subtasks.length}</span>}
                        <span className="plan-due">Due {formatDeadline(task.deadlineDate, task.deadlineTime)}</span>
                      </div>
                    </div>
                    <button type="button" className="action-icon-btn" onClick={() => onEditTask(task)} aria-label={`Edit "${task.title}"`} title="Edit">
                      <Edit3 size={15} />
                    </button>
                  </div>
                </li>
                {gap >= 5 && (
                  <li className="plan-gap" aria-label={`${gap} minutes free`}>
                    {gap <= 15 ? <><Coffee size={12} /> {gap} min break</> : <>{formatDuration(gap / 60)} free</>}
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      )}

      {plan.unscheduled.length > 0 && (
        <div className="glass-card plan-unscheduled">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
              <span>Didn't fit {dayLabel(selectedDate, todayKey).toLowerCase()}</span>
            </div>
          </div>
          <ul className="card-body">
            {plan.unscheduled.map(({ task, reason, minutes }) => (
              <li key={task.id} className="plan-unscheduled-item">
                <div>
                  <div className="plan-card-title">{task.title}</div>
                  <div className="plan-card-meta">
                    <span>{reason}</span>
                    <span>· needs {formatDuration(minutes / 60)}</span>
                    <span>· due {formatDeadline(task.deadlineDate, task.deadlineTime)}</span>
                  </div>
                </div>
                <button type="button" className="btn-secondary" onClick={() => onEditTask(task)}>Adjust</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
