import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Edit3, 
  Trash2, 
  Info, 
  Layers, 
  X,
  FileText,
  AlertTriangle,
  Grid,
  List
} from 'lucide-react';
import { calculateTimeRemaining } from '../services/prioritizationEngine';
import { TASK_CATEGORIES, categoryClassName, taskTimeSummary, calendarDaysUntil } from '../data/taskOptions.js';

export default function TaskManager({
  tasks,
  rankedTasks,
  initialStatusFilter = 'all',
  onOpenAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [importanceFilter, setImportanceFilter] = useState('all');

  // Sync initialStatusFilter if changed from navigation
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);
  const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'deadline_asc' | 'deadline_desc' | 'difficulty_desc' | 'duration_desc' | 'title_asc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState(null);

  // Merge ranked task scores with tasks array
  const tasksWithPriority = useMemo(() => {
    const rankMap = new Map();
    rankedTasks.forEach(t => {
      rankMap.set(t.id, t.priority);
    });

    return tasks.map(task => {
      const priority = rankMap.get(task.id) || {};
      const { diffHours, isOverdue, isDueToday, formattedDeadline } = calculateTimeRemaining(task.deadlineDate, task.deadlineTime);
      return {
        ...task,
        priority,
        diffHours,
        isOverdue,
        isDueToday,
        formattedDeadline
      };
    });
  }, [tasks, rankedTasks]);

  // Filter and Search logic
  const filteredTasks = useMemo(() => {
    return tasksWithPriority.filter(task => {
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = (task.description || '').toLowerCase().includes(query);
        const matchesCat = (task.category || '').toLowerCase().includes(query);
        const matchesNotes = (task.notes || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesNotes) return false;
      }

      // Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed' && task.status !== 'completed') return false;
        if (statusFilter === 'pending' && task.status !== 'pending') return false;
        if (statusFilter === 'in_progress' && task.status !== 'in_progress') return false;
        if (statusFilter === 'overdue' && (!task.isOverdue || task.status === 'completed')) return false;
        if (statusFilter === 'due_today' && (!task.isDueToday || task.isOverdue || task.status === 'completed')) return false;
        if (statusFilter === 'active' && task.status === 'completed') return false;
      }

      // Category Filter
      if (categoryFilter !== 'all' && task.category !== categoryFilter) {
        return false;
      }

      // Difficulty Filter
      if (difficultyFilter !== 'all' && Number(task.difficulty) !== Number(difficultyFilter)) {
        return false;
      }

      // Importance Filter
      if (importanceFilter !== 'all' && task.importance !== importanceFilter) {
        return false;
      }

      return true;
    });
  }, [tasksWithPriority, searchQuery, statusFilter, categoryFilter, difficultyFilter, importanceFilter]);

  // Sorting Logic
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      // Always sort active before completed unless completed filter is selected
      if (statusFilter === 'all') {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
      }

      switch (sortBy) {
        case 'priority':
          return (b.priority?.score || 0) - (a.priority?.score || 0);

        case 'deadline_asc':
          return a.diffHours - b.diffHours;

        case 'deadline_desc':
          return b.diffHours - a.diffHours;

        case 'difficulty_desc':
          return (b.difficulty || 0) - (a.difficulty || 0);

        case 'duration_desc':
          return (b.estimatedHours || 0) - (a.estimatedHours || 0);

        case 'duration_asc':
          return (a.estimatedHours || 0) - (b.estimatedHours || 0);

        case 'title_asc':
          return a.title.localeCompare(b.title);

        default:
          return 0;
      }
    });
  }, [filteredTasks, sortBy, statusFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setDifficultyFilter('all');
    setImportanceFilter('all');
    setSortBy('priority');
  };

  const STATUS_FILTER_LABELS = {
    active: 'Active',
    pending: 'Pending',
    in_progress: 'In Progress',
    due_today: 'Due Today',
    overdue: 'Overdue',
    completed: 'Completed'
  };

  const hasActiveFilters =searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || difficultyFilter !== 'all' || importanceFilter !== 'all';

  return (
    <div className="task-manager-view">
      {/* Title & Controls Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Task Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Create, track, filter, and organize tasks across study, work, training, and personal life.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View mode toggle */}
          <div className="view-toggle-wrap">
            <button 
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid Card View"
            >
              <Grid size={16} />
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table List View"
            >
              <List size={16} />
            </button>
          </div>

          <button 
            className="btn-primary"
            onClick={onOpenAddTask}
            id="btn-tm-new-task"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Active status filter banner (e.g. after clicking a dashboard card) */}
      {statusFilter !== 'all' && (
        <div className="filter-banner" id="task-filter-banner">
          <span>
            Showing <strong>{STATUS_FILTER_LABELS[statusFilter] || statusFilter}</strong> tasks · {sortedTasks.length} found
          </span>
          <button className="btn-secondary" onClick={() => setStatusFilter('all')} style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}>
            <X size={14} />
            <span>Show all</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div className="controls-bar" style={{ marginBottom: 0 }}>
          {/* Search Input */}
          <div className="search-input-wrap">
            <Search size={18} />
            <input 
              type="text"
              className="search-input"
              placeholder="Search title, description, category, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-task-search"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="filters-row">
            {/* Status Filter */}
            <select 
              className="select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              id="filter-status"
              aria-label="Filter by Status"
            >
              <option value="all">Status: All</option>
              <option value="active">Status: All Active</option>
              <option value="pending">Status: Pending</option>
              <option value="in_progress">Status: In Progress</option>
              <option value="due_today">Status: Due Today</option>
              <option value="overdue">Status: Overdue</option>
              <option value="completed">Status: Completed</option>
            </select>

            {/* Category Filter */}
            <select 
              className="select-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              id="filter-category"
              aria-label="Filter by Category"
            >
              <option value="all">Category: All</option>
              {TASK_CATEGORIES.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select 
              className="select-filter"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              id="filter-difficulty"
              aria-label="Filter by Difficulty"
            >
              <option value="all">Difficulty: All</option>
              <option value="1">Level 1 - Very Easy</option>
              <option value="2">Level 2 - Easy</option>
              <option value="3">Level 3 - Moderate</option>
              <option value="4">Level 4 - Difficult</option>
              <option value="5">Level 5 - Very Challenging</option>
            </select>

            {/* Importance Filter */}
            <select 
              className="select-filter"
              value={importanceFilter}
              onChange={(e) => setImportanceFilter(e.target.value)}
              id="filter-importance"
              aria-label="Filter by Importance"
            >
              <option value="all">Importance: All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Sort Selector */}
            <select 
              className="select-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              id="sort-tasks"
              aria-label="Sort Tasks"
            >
              <option value="priority">Sort: Priority Score (Recommended)</option>
              <option value="deadline_asc">Sort: Deadline (Earliest)</option>
              <option value="deadline_desc">Sort: Deadline (Latest)</option>
              <option value="difficulty_desc">Sort: Difficulty (Hardest)</option>
              <option value="duration_desc">Sort: Duration (Longest)</option>
              <option value="duration_asc">Sort: Duration (Shortest)</option>
              <option value="title_asc">Sort: Title (A-Z)</option>
            </select>

            {hasActiveFilters && (
              <button 
                onClick={handleResetFilters}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                title="Reset all search filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <span>Showing {sortedTasks.length} of {tasks.length} tasks</span>
        {hasActiveFilters && (
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Active filters applied</span>
        )}
      </div>

      {/* Empty State */}
      {sortedTasks.length === 0 && (
        <div className="glass-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <Layers size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            No Matching Tasks Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            {hasActiveFilters 
              ? 'No tasks match your active search terms or selected filters. Try clearing filters to see your full schedule.'
              : 'You have not added any tasks yet. Create your first engineering or coursework task to get started.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            {hasActiveFilters && (
              <button className="btn-secondary" onClick={handleResetFilters}>
                Clear All Filters
              </button>
            )}
            <button className="btn-primary" onClick={onOpenAddTask}>
              <Plus size={16} />
              <span>Add New Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid Mode */}
      {viewMode === 'grid' && sortedTasks.length > 0 && (
        <div className="tasks-grid">
          {sortedTasks.map(task => {
            const p = task.priority || {};
            const isCompleted = task.status === 'completed';

            return (
              <div 
                key={task.id} 
                className={`task-card ${isCompleted ? 'completed' : ''}`}
                id={`task-card-${task.id}`}
              >
                <div>
                  <div className="task-card-header">
                    {/* Completion Checkbox */}
                    <button 
                      className={`task-status-btn ${isCompleted ? 'checked' : ''}`}
                      onClick={() => onToggleComplete(task.id)}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                      aria-label={`Toggle completion for ${task.title}`}
                    >
                      {isCompleted && <CheckCircle2 size={16} strokeWidth={3} />}
                    </button>

                    <div className="task-title-group">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                        <span className={`category-badge ${categoryClassName(task.category)}`}>
                          {task.category}
                        </span>

                        {!isCompleted && p.score !== undefined && (
                          <span 
                            className={`priority-score-badge ${p.priorityLevel ? p.priorityLevel.toLowerCase() : ''}`}
                            style={{ fontSize: '0.75rem', padding: '1px 6px' }}
                            title={p.explanation}
                          >
                            Score: {p.score}
                          </span>
                        )}
                      </div>

                      <h3 className="task-title" title={task.title}>
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="task-description">{task.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Task Card Meta */}
                  <div className="task-card-meta">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} style={{ color: task.isOverdue && !isCompleted ? 'var(--danger)' : 'var(--text-muted)' }} />
                        <span style={{ 
                          fontWeight: task.isOverdue && !isCompleted ? 700 : 500,
                          color: task.isOverdue && !isCompleted ? 'var(--danger)' : (task.isDueToday && !isCompleted ? 'var(--warning)' : 'var(--text-secondary)')
                        }}>
                          {task.deadlineDate} ({task.deadlineTime || '23:59'})
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontFamily: 'var(--font-mono)' }} title={taskTimeSummary(task).range || 'Estimated duration'}>
                          {taskTimeSummary(task).range || taskTimeSummary(task).duration}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span className="difficulty-pill">
                        Difficulty: Level {task.difficulty}/5
                      </span>

                      <span style={{ 
                        fontWeight: 700, 
                        color: task.importance === 'Critical' ? 'var(--danger)' : 
                               task.importance === 'High' ? 'var(--warning)' : 'var(--text-secondary)'
                      }}>
                        {task.importance}
                      </span>
                    </div>

                    {/* Deadline Status Tag */}
                    {!isCompleted && (
                      <div style={{ marginTop: '0.2rem' }}>
                        {task.isOverdue ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700 }}>
                            <AlertTriangle size={13} />
                            <span>
                              Overdue by {Math.abs(task.diffHours) < 48
                                ? `${Math.max(1, Math.abs(Math.round(task.diffHours)))} hours`
                                : `${Math.abs(calendarDaysUntil(task.deadlineDate))} days`}
                            </span>
                          </span>
                        ) : task.isDueToday ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 700 }}>
                            <Clock size={13} />
                            <span>Due Today ({Math.max(1, Math.round(task.diffHours))}h left)</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {calendarDaysUntil(task.deadlineDate)} {calendarDaysUntil(task.deadlineDate) === 1 ? 'day' : 'days'} remaining
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="task-card-footer">
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 600, 
                    textTransform: 'uppercase',
                    color: isCompleted ? 'var(--success)' : (task.status === 'in_progress' ? 'var(--primary)' : 'var(--text-muted)')
                  }}>
                    {isCompleted ? '✓ Completed' : (task.status === 'in_progress' ? '⏳ In Progress' : 'Pending')}
                  </span>

                  <div className="task-actions">
                    {/* View Details / Explanation */}
                    <button 
                      className="action-icon-btn"
                      onClick={() => setSelectedTaskForDetails(task)}
                      title="View prioritization breakdown & notes"
                      aria-label="View task details"
                    >
                      <Info size={16} />
                    </button>

                    {/* Edit */}
                    <button 
                      className="action-icon-btn"
                      onClick={() => onEditTask(task)}
                      title="Edit task"
                      aria-label="Edit task"
                    >
                      <Edit3 size={16} />
                    </button>

                    {/* Delete */}
                    <button 
                      className="action-icon-btn delete"
                      onClick={() => onDeleteTask(task.id, task.title)}
                      title="Delete task"
                      aria-label="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table List Mode */}
      {viewMode === 'table' && sortedTasks.length > 0 && (
        <div className="prioritizer-table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0, 0, 0, 0.25)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1rem', width: '40px' }}>Done</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Task Title</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Deadline</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Diff.</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Est.</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Importance</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Priority Score</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map(task => {
                  const isCompleted = task.status === 'completed';
                  const p = task.priority || {};

                  return (
                    <tr 
                      key={task.id}
                      style={{ 
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isCompleted ? 'rgba(0,0,0,0.1)' : 'transparent',
                        opacity: isCompleted ? 0.6 : 1
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button 
                          className={`task-status-btn ${isCompleted ? 'checked' : ''}`}
                          onClick={() => onToggleComplete(task.id)}
                        >
                          {isCompleted && <CheckCircle2 size={14} />}
                        </button>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        <span style={{ textDecoration: isCompleted ? 'line-through' : 'none' }}>
                          {task.title}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`category-badge ${categoryClassName(task.category)} `}>
                          {task.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: task.isOverdue && !isCompleted ? 'var(--danger)' : 'inherit', fontWeight: task.isOverdue && !isCompleted ? 700 : 400 }}>
                        {task.deadlineDate} ({task.deadlineTime || '23:59'})
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>
                        L{task.difficulty}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>
                        {taskTimeSummary(task).range || taskTimeSummary(task).duration}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {task.importance}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {!isCompleted && (
                          <span className={`priority-score-badge ${p.priorityLevel ? p.priorityLevel.toLowerCase() : ''}`}>
                            {p.score || 0}/100
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                          <button className="action-icon-btn" onClick={() => setSelectedTaskForDetails(task)}>
                            <Info size={15} />
                          </button>
                          <button className="action-icon-btn" onClick={() => onEditTask(task)}>
                            <Edit3 size={15} />
                          </button>
                          <button className="action-icon-btn delete" onClick={() => onDeleteTask(task.id, task.title)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Details & Prioritization Rationale Modal */}
      {selectedTaskForDetails && (
        <div className="modal-overlay" onClick={() => setSelectedTaskForDetails(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`category-badge ${categoryClassName(selectedTaskForDetails.category)} `}>
                  {selectedTaskForDetails.category}
                </span>
                <h3 className="modal-title" style={{ fontSize: '1.1rem' }}>
                  Task Details & Analysis
                </h3>
              </div>
              <button className="action-icon-btn" onClick={() => setSelectedTaskForDetails(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  {selectedTaskForDetails.title}
                </h2>
                {selectedTaskForDetails.description && (
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.9rem' }}>
                    {selectedTaskForDetails.description}
                  </p>
                )}
              </div>

              {/* Prioritization Score Breakdown Box */}
              <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    PriorityFirst² Multi-Criteria Score
                  </span>
                  <span className={`priority-score-badge ${selectedTaskForDetails.priority?.priorityLevel?.toLowerCase()}`}>
                    {selectedTaskForDetails.priority?.score || 0} / 100 ({selectedTaskForDetails.priority?.priorityLevel || 'Low'})
                  </span>
                </div>

                <div className="action-rationale" style={{ marginBottom: '1rem' }}>
                  <strong>Recommendation Rationale:</strong>
                  <p style={{ marginTop: '0.25rem' }}>
                    {selectedTaskForDetails.priority?.explanation || 'Evaluated deterministically based on urgency, difficulty, workload pressure, and importance.'}
                  </p>
                </div>

                {/* Subscore meters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Urgency Subscore (Deadline Proximity)</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedTaskForDetails.priority?.urgencyScore || 0}/100</span>
                    </div>
                    <div className="priority-bar-meter">
                      <div className="priority-bar-fill" style={{ width: `${selectedTaskForDetails.priority?.urgencyScore || 0}%`, background: 'var(--danger)' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Workload Pressure (Duration vs Time Window)</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedTaskForDetails.priority?.workloadScore || 0}/100</span>
                    </div>
                    <div className="priority-bar-meter">
                      <div className="priority-bar-fill" style={{ width: `${selectedTaskForDetails.priority?.workloadScore || 0}%`, background: 'var(--warning)' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Importance (Academic Impact)</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedTaskForDetails.priority?.importanceScore || 0}/100</span>
                    </div>
                    <div className="priority-bar-meter">
                      <div className="priority-bar-fill" style={{ width: `${selectedTaskForDetails.priority?.importanceScore || 0}%`, background: 'var(--primary)' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Cognitive Complexity (Difficulty Level)</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedTaskForDetails.priority?.difficultyScore || 0}/100</span>
                    </div>
                    <div className="priority-bar-meter">
                      <div className="priority-bar-fill" style={{ width: `${selectedTaskForDetails.priority?.difficultyScore || 0}%`, background: 'var(--accent-purple, #a855f7)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Properties Table */}
              <div className="grid-2-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Deadline & Time</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>
                    {selectedTaskForDetails.deadlineDate} at {selectedTaskForDetails.deadlineTime || '23:59'}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Estimated Completion Time</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>
                    {taskTimeSummary(selectedTaskForDetails).range
                      ? <><span>{taskTimeSummary(selectedTaskForDetails).range}</span><br /><span>{taskTimeSummary(selectedTaskForDetails).duration}</span></>
                      : taskTimeSummary(selectedTaskForDetails).duration}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Difficulty Rating</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>
                    Level {selectedTaskForDetails.difficulty} of 5
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Importance Level</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>
                    {selectedTaskForDetails.importance}
                  </div>
                </div>
              </div>

              {/* Optional Notes */}
              {selectedTaskForDetails.notes && (
                <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FileText size={14} />
                    <span>Personal Notes / Formula References</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                    {selectedTaskForDetails.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => {
                  const taskToEdit = selectedTaskForDetails;
                  setSelectedTaskForDetails(null);
                  onEditTask(taskToEdit);
                }}
              >
                <Edit3 size={15} />
                <span>Edit Task</span>
              </button>
              <button 
                className="btn-primary"
                onClick={() => setSelectedTaskForDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
