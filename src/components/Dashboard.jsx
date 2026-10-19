import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Hourglass, 
  Calendar, 
  Sliders, 
  ArrowRight, 
  Plus, 
  Layers,
  Flame,
  CheckCircle,
  FileText,
  Activity,
  Calculator,
  FolderGit2,
  BookOpen
} from 'lucide-react';
import { calculateTimeRemaining } from '../services/prioritizationEngine';

export default function Dashboard({
  tasks,
  rankedTasks,
  onOpenAddTask,
  onEditTask,
  onToggleComplete,
  onNavigateTab
}) {
  // Compute Dashboard Metrics dynamically from actual saved tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const activeTasks = tasks.filter(t => t.status !== 'completed');

  // Compute overdue & due today accurately based on current time
  const overdueTasks = activeTasks.filter(t => {
    const { isOverdue } = calculateTimeRemaining(t.deadlineDate, t.deadlineTime);
    return isOverdue;
  });

  const dueTodayTasks = activeTasks.filter(t => {
    const { isDueToday, isOverdue } = calculateTimeRemaining(t.deadlineDate, t.deadlineTime);
    return isDueToday && !isOverdue;
  });

  const inProgressTasks = activeTasks.filter(t => t.status === 'in_progress');
  const pendingTasks = activeTasks.filter(t => t.status === 'pending');

  // Total estimated hours remaining
  const remainingHours = activeTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);

  // Top 3 priority tasks
  const topRecommendations = rankedTasks.filter(t => t.status !== 'completed').slice(0, 3);

  // Upcoming deadlines (next 7 days, excluding overdue)
  const upcomingDeadlines = [...activeTasks]
    .filter(t => {
      const { diffHours } = calculateTimeRemaining(t.deadlineDate, t.deadlineTime);
      return diffHours > 0;
    })
    .sort((a, b) => {
      const diffA = calculateTimeRemaining(a.deadlineDate, a.deadlineTime).diffHours;
      const diffB = calculateTimeRemaining(b.deadlineDate, b.deadlineTime).diffHours;
      return diffA - diffB;
    })
    .slice(0, 4);

  // Workload by Category
  const categoryStats = {
    'assignment': { count: 0, hours: 0, label: 'Assignment', icon: BookOpen },
    'project': { count: 0, hours: 0, label: 'Project', icon: FolderGit2 },
    'laboratory activity': { count: 0, hours: 0, label: 'Lab Activity', icon: Activity },
    'calculation': { count: 0, hours: 0, label: 'Calculation', icon: Calculator },
    'report': { count: 0, hours: 0, label: 'Report', icon: FileText },
    'personal responsibility': { count: 0, hours: 0, label: 'Personal', icon: Layers }
  };

  activeTasks.forEach(t => {
    const cat = t.category || 'assignment';
    if (categoryStats[cat]) {
      categoryStats[cat].count += 1;
      categoryStats[cat].hours += (Number(t.estimatedHours) || 0);
    }
  });

  return (
    <div className="dashboard-view">
      {/* Hero Welcome */}
      <div className="dashboard-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="hero-welcome">
            <h1>PriorityFirst Overview</h1>
            <p>
              Real-time analysis and multi-criteria prioritization for engineering coursework and critical responsibilities.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn-secondary"
              onClick={() => onNavigateTab('prioritizer')}
              id="btn-dash-prioritizer"
            >
              <Sliders size={16} />
              <span>Prioritization Matrix</span>
            </button>
            <button 
              className="btn-primary"
              onClick={onOpenAddTask}
              id="btn-dash-new-task"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add New Task</span>
            </button>
          </div>
        </div>

        {/* Critical Overdue Banner (if any exist) */}
        {overdueTasks.length > 0 && (
          <div className="alert-banner critical">
            <div className="alert-banner-content">
              <AlertTriangle size={24} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <div className="alert-banner-text">
                <h4>{overdueTasks.length} Overdue {overdueTasks.length === 1 ? 'Task Requires' : 'Tasks Require'} Attention</h4>
                <p>
                  Uncompleted tasks with past deadlines received maximum urgency weighting in your priority queue.
                </p>
              </div>
            </div>
            <button 
              className="btn-secondary" 
              style={{ borderColor: 'var(--danger-border)', color: '#fca5a5' }}
              onClick={() => onNavigateTab('tasks')}
            >
              View Overdue
            </button>
          </div>
        )}

        {/* Due Today Banner (if no overdue, but due today exist) */}
        {overdueTasks.length === 0 && dueTodayTasks.length > 0 && (
          <div className="alert-banner warning">
            <div className="alert-banner-content">
              <Clock size={24} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <div className="alert-banner-text">
                <h4>{dueTodayTasks.length} {dueTodayTasks.length === 1 ? 'Task' : 'Tasks'} Due Today</h4>
                <p>
                  Schedule focus blocks today to guarantee submission before midnight cutoff times.
                </p>
              </div>
            </div>
            <button 
              className="btn-secondary" 
              style={{ borderColor: 'var(--warning-border)', color: '#fcd34d' }}
              onClick={() => onNavigateTab('schedule')}
            >
              Open Schedule
            </button>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="stats-grid">
          {/* Total Tasks */}
          <div className="stat-card total" id="stat-total-tasks">
            <div className="stat-header">
              <span className="stat-label">Total Tasks</span>
              <div className="stat-icon"><Layers size={18} /></div>
            </div>
            <div className="stat-value">{totalTasks}</div>
            <span className="stat-subtext">{activeTasks.length} currently active</span>
          </div>

          {/* In Progress */}
          <div className="stat-card in_progress" id="stat-in-progress">
            <div className="stat-header">
              <span className="stat-label">In Progress</span>
              <div className="stat-icon"><Hourglass size={18} /></div>
            </div>
            <div className="stat-value">{inProgressTasks.length}</div>
            <span className="stat-subtext">{pendingTasks.length} pending start</span>
          </div>

          {/* Due Today */}
          <div className="stat-card due_today" id="stat-due-today">
            <div className="stat-header">
              <span className="stat-label">Due Today</span>
              <div className="stat-icon"><Clock size={18} /></div>
            </div>
            <div className="stat-value">{dueTodayTasks.length}</div>
            <span className="stat-subtext">Immediate focus required</span>
          </div>

          {/* Overdue */}
          <div className="stat-card overdue" id="stat-overdue">
            <div className="stat-header">
              <span className="stat-label">Overdue</span>
              <div className="stat-icon"><AlertTriangle size={18} /></div>
            </div>
            <div className="stat-value" style={{ color: overdueTasks.length > 0 ? 'var(--danger)' : 'inherit' }}>
              {overdueTasks.length}
            </div>
            <span className="stat-subtext">
              {overdueTasks.length > 0 ? 'Past deadline' : 'Zero overdue backlog!'}
            </span>
          </div>

          {/* Completed */}
          <div className="stat-card completed" id="stat-completed">
            <div className="stat-header">
              <span className="stat-label">Completed</span>
              <div className="stat-icon"><CheckCircle2 size={18} /></div>
            </div>
            <div className="stat-value">{completedTasks.length}</div>
            <span className="stat-subtext">
              {totalTasks > 0 ? `${Math.round((completedTasks.length / totalTasks) * 100)}% overall completion` : '0%'}
            </span>
          </div>

          {/* Estimated Workload Hours */}
          <div className="stat-card total" id="stat-workload-hours">
            <div className="stat-header">
              <span className="stat-label">Est. Workload</span>
              <div className="stat-icon"><Clock size={18} /></div>
            </div>
            <div className="stat-value">{remainingHours.toFixed(1)}h</div>
            <span className="stat-subtext">Active remaining hours</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="dashboard-grid">
        {/* Left Column: Top Recommended Action Tasks */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title">
              <Flame size={20} style={{ color: 'var(--danger)' }} />
              <span>Recommended Priority Queue</span>
            </div>
            <button 
              className="btn-secondary" 
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={() => onNavigateTab('prioritizer')}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="card-body">
            {topRecommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <CheckCircle size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--success)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  No Pending Priorities!
                </h3>
                <p style={{ fontSize: '0.875rem' }}>
                  All tasks are completed or no tasks exist yet. Create new coursework items to generate recommendations.
                </p>
                <button 
                  className="btn-primary" 
                  style={{ margin: '1rem auto 0' }}
                  onClick={onOpenAddTask}
                >
                  <Plus size={16} />
                  <span>Create Task</span>
                </button>
              </div>
            ) : (
              <div className="action-list">
                {topRecommendations.map((task) => {
                  const p = task.priority || {};
                  return (
                    <div 
                      key={task.id} 
                      className={`action-card rank-${task.rank || 1}`}
                      id={`action-card-${task.id}`}
                    >
                      <div className="action-top-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="rank-badge">#{task.rank} Priority</span>
                          <span className={`category-badge category-${task.category ? task.category.split(' ')[0] : 'assignment'}`}>
                            {task.category}
                          </span>
                        </div>

                        <div className={`priority-score-badge ${p.priorityLevel ? p.priorityLevel.toLowerCase() : ''}`}>
                          <span>Score: {p.score || 0}/100</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                        <div>
                          <h3 className="action-title">{task.title}</h3>
                          {task.description && (
                            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Quick Complete Toggle */}
                        <button
                          className="task-status-btn"
                          title="Mark as completed"
                          onClick={() => onToggleComplete(task.id)}
                          aria-label={`Mark ${task.title} complete`}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </div>

                      {/* Transparent Prioritization Rationale */}
                      <div className="action-rationale">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                          <span>Why this task is #{task.rank}:</span>
                        </div>
                        <p>{p.explanation || 'Analyzed based on deadline proximity and academic importance.'}</p>
                      </div>

                      {/* Meta Details Row */}
                      <div className="action-meta-row">
                        <div className="meta-item">
                          <Calendar size={14} style={{ color: p.isOverdue ? 'var(--danger)' : 'var(--text-muted)' }} />
                          <span style={{ color: p.isOverdue ? 'var(--danger)' : 'inherit', fontWeight: p.isOverdue ? 700 : 500 }}>
                            Due: {task.deadlineDate} ({task.deadlineTime || '23:59'})
                          </span>
                        </div>
                        <div className="meta-item">
                          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>Est: {task.estimatedHours} hrs</span>
                        </div>
                        <div className="meta-item">
                          <span className="difficulty-pill">
                            Diff: Level {task.difficulty}/5
                          </span>
                        </div>
                        <div className="meta-item">
                          <span style={{ fontWeight: 600, color: task.importance === 'Critical' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                            {task.importance}
                          </span>
                        </div>

                        <button 
                          style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}
                          onClick={() => onEditTask(task)}
                        >
                          Edit Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workload Breakdown & Upcoming Deadlines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upcoming Deadlines Widget */}
          <div className="glass-card">
            <div className="card-header">
              <div className="card-title">
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                <span>Upcoming Deadlines</span>
              </div>
              <button 
                className="btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                onClick={() => onNavigateTab('schedule')}
              >
                Calendar
              </button>
            </div>

            <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
              {upcomingDeadlines.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                  No upcoming deadlines in the next 7 days.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {upcomingDeadlines.map(t => {
                    const { diffHours, isDueToday } = calculateTimeRemaining(t.deadlineDate, t.deadlineTime);
                    const daysLeft = Math.ceil(diffHours / 24);

                    return (
                      <div 
                        key={t.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.75rem',
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '2px' }}>
                            <span>{t.category}</span>
                            <span>•</span>
                            <span>{t.estimatedHours}h est.</span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.75rem' }}>
                          <span 
                            style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              color: isDueToday ? 'var(--warning)' : 'var(--text-secondary)',
                              background: isDueToday ? 'var(--warning-light)' : 'rgba(255,255,255,0.05)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            {isDueToday ? 'Today' : `${daysLeft}d left`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Coursework Category Distribution */}
          <div className="glass-card">
            <div className="card-header">
              <div className="card-title">
                <Layers size={18} style={{ color: 'var(--info)' }} />
                <span>Active Workload by Category</span>
              </div>
            </div>

            <div className="card-body" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.entries(categoryStats).map(([key, data]) => {
                  const Icon = data.icon;
                  const percent = remainingHours > 0 ? Math.round((data.hours / remainingHours) * 100) : 0;
                  if (data.count === 0) return null;

                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                          <Icon size={14} style={{ color: 'var(--primary)' }} />
                          {data.label} ({data.count})
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {data.hours}h ({percent}%)
                        </span>
                      </div>
                      <div className="priority-bar-meter">
                        <div 
                          className="priority-bar-fill"
                          style={{ 
                            width: `${percent}%`, 
                            background: key === 'calculation' ? 'var(--warning)' : 
                                        key === 'project' ? 'var(--accent-purple, #a855f7)' : 
                                        key === 'laboratory activity' ? 'var(--success)' : 
                                        'var(--primary)' 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
