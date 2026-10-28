import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Clock, Calendar } from 'lucide-react';
import { TASK_CATEGORIES, durationFromTimes, formatDuration, formatTime } from '../data/taskOptions.js';

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  taskToEdit = null,
  initialDate = null
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('assignment');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [difficulty, setDifficulty] = useState(3);
  const [estimatedHours, setEstimatedHours] = useState(2.0);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [importance, setImportance] = useState('Medium');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category || 'assignment');
      setDeadlineDate(taskToEdit.deadlineDate || '');
      setDeadlineTime(taskToEdit.deadlineTime || '23:59');
      setDifficulty(Number(taskToEdit.difficulty) || 3);
      setEstimatedHours(Number(taskToEdit.estimatedHours) || 2.0);
      setStartTime(taskToEdit.startTime || taskToEdit.scheduledStartTime || '');
      setEndTime(taskToEdit.endTime || '');
      setReminderAt(taskToEdit.reminderAt || '');
      setImportance(taskToEdit.importance || 'Medium');
      setStatus(taskToEdit.status || 'pending');
      setNotes(taskToEdit.notes || '');
    } else {
      // Default new task setup
      setTitle('');
      setDescription('');
      setCategory('assignment');
      
      if (initialDate) {
        setDeadlineDate(initialDate);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        setDeadlineDate(`${yyyy}-${mm}-${dd}`);
      }
      
      setDeadlineTime('23:59');
      setDifficulty(3);
      setEstimatedHours(2.0);
      setStartTime('');
      setEndTime('');
      setReminderAt('');
      setImportance('Medium');
      setStatus('pending');
      setNotes('');
    }
    setErrors({});
  }, [taskToEdit, isOpen, initialDate]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required.';
    }
    if (!deadlineDate) {
      newErrors.deadlineDate = 'Deadline date is required.';
    }
    const scheduledDuration = durationFromTimes(startTime, endTime);
    if ((startTime || endTime) && scheduledDuration === null) {
      newErrors.timeRange = 'Choose an end time later than the start time. Overnight scheduling is not supported.';
    }
    if (scheduledDuration === null && (!estimatedHours || Number(estimatedHours) <= 0)) {
      newErrors.estimatedHours = 'Estimated hours must be greater than 0.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      deadlineDate,
      deadlineTime: deadlineTime || '23:59',
      difficulty: Number(difficulty),
      estimatedHours: durationFromTimes(startTime, endTime) ?? Number(estimatedHours),
      startTime: startTime || null,
      endTime: endTime || null,
      reminderAt: reminderAt || null,
      importance,
      status,
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {taskToEdit ? 'Edit Task' : 'Create New PriorityFirst Task'}
          </h2>
          <button 
            className="action-icon-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-title-input">
                Task Title <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input 
                id="task-title-input"
                type="text"
                className="form-input"
                placeholder="e.g. Fluid Mechanics Venturi Lab Report"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-desc-input">
                Description (Optional)
              </label>
              <input 
                id="task-desc-input"
                type="text"
                className="form-input"
                placeholder="Brief summary of required deliverables or problem statements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Category & Status */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="task-category-select">
                  Category <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select 
                  id="task-category-select"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {TASK_CATEGORIES.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-status-select">
                  Task Status
                </label>
                <select 
                  id="task-status-select"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Deadline Date & Due Time */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="task-date-input">
                  Deadline Date <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input 
                  id="task-date-input"
                  type="date"
                  className="form-input"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                />
                {errors.deadlineDate && <span className="form-error">{errors.deadlineDate}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-time-input">
                  Due Time (24h)
                </label>
                <input 
                  id="task-time-input"
                  type="time"
                  className="form-input"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                />
              </div>
            </div>

            {/* Scheduled time range */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="task-start-time-input">Scheduled Start Time (Optional)</label>
                <input
                  id="task-start-time-input"
                  type="time"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-end-time-input">Scheduled End Time (Optional)</label>
                <input
                  id="task-end-time-input"
                  type="time"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              {(startTime || endTime) && (
                <div className="time-range-summary" role="status">
                  {durationFromTimes(startTime, endTime) !== null
                    ? <>Estimated time: {formatTime(startTime)} – {formatTime(endTime)} · Duration: {formatDuration(durationFromTimes(startTime, endTime))}</>
                    : 'Add both times, with the end time after the start time.'}
                </div>
              )}
              {errors.timeRange && <span className="form-error">{errors.timeRange}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-reminder-input">Reminder time (optional)</label>
              <input
                id="task-reminder-input"
                type="datetime-local"
                className="form-input"
                value={reminderAt}
                onChange={(e) => setReminderAt(e.target.value)}
              />
              <span className="form-hint">If blank, PriorityFirst reminds you at the deadline. Desktop permissions are required.</span>
            </div>

            {/* Difficulty, Estimated Hours, Importance */}
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label" htmlFor="task-difficulty-select">
                  Difficulty
                </label>
                <select 
                  id="task-difficulty-select"
                  className="form-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                >
                  <option value={1}>1 - Very Easy</option>
                  <option value={2}>2 - Easy</option>
                  <option value={3}>3 - Moderate</option>
                  <option value={4}>4 - Difficult</option>
                  <option value={5}>5 - Challenging</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-hours-input">
                  Est. Hours {!(startTime && endTime) && <span style={{ color: 'var(--danger)' }}>*</span>}
                </label>
                <input 
                  id="task-hours-input"
                  type="number"
                  min="0.1"
                  step="0.5"
                  className="form-input"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  disabled={durationFromTimes(startTime, endTime) !== null}
                />
                {errors.estimatedHours && <span className="form-error">{errors.estimatedHours}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-importance-select">
                  Importance
                </label>
                <select 
                  id="task-importance-select"
                  className="form-select"
                  value={importance}
                  onChange={(e) => setImportance(e.target.value)}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Optional Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-notes-input">
                Optional Notes & References
              </label>
              <textarea 
                id="task-notes-input"
                className="form-textarea"
                rows={3}
                placeholder="Include reference equations, textbook chapters, rubric guidelines, or lab partners..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              id="btn-submit-task"
            >
              <CheckCircle2 size={16} />
              <span>{taskToEdit ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
