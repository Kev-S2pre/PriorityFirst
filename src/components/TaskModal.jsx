import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Clock, Calendar } from 'lucide-react';

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
    if (!estimatedHours || Number(estimatedHours) <= 0) {
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
      estimatedHours: Number(estimatedHours),
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
                  <option value="assignment">Assignment</option>
                  <option value="project">Project</option>
                  <option value="laboratory activity">Laboratory Activity</option>
                  <option value="calculation">Calculation</option>
                  <option value="report">Report</option>
                  <option value="personal responsibility">Personal Responsibility</option>
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
                  Est. Hours <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input 
                  id="task-hours-input"
                  type="number"
                  min="0.1"
                  step="0.5"
                  className="form-input"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
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
