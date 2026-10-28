import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon,
  AlertTriangle,
  Layers,
  ChevronDown,
  Edit3
} from 'lucide-react';
import { calculateTimeRemaining } from '../services/prioritizationEngine.js';
import { categoryClassName, taskTimeSummary } from '../data/taskOptions.js';

// Calculate exact Day of Year (1 - 366)
function getDayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Calculate exact ISO Week Number (1 - 53)
function getISOWeekNumber(d) {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// Format Date as YYYY-MM-DD local string
function toDateStr(year, month, day) {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function ScheduleCalendar({
  tasks,
  onOpenAddTask,
  onEditTask,
  onToggleComplete
}) {
  const today = useMemo(() => new Date(), []);
  
  // Navigation state (Defaulting to current month & year)
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth()); // 0-indexed
  
  // Selected date state
  const [selectedDate, setSelectedDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  
  // Start Day of the week: 1 = Monday (as in screenshot), 0 = Sunday, 6 = Saturday
  const [startDayOfWeek, setStartDayOfWeek] = useState(1);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  // Header Summary metrics for selected date
  const selectedDayInfo = useMemo(() => {
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'short' }) + '.';
    const dayNumber = selectedDate.getDate();
    const monthYear = `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    const dayOfYear = getDayOfYear(selectedDate);
    const weekNumber = getISOWeekNumber(selectedDate);

    // Is the selected date actually today?
    const isToday = (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    );

    return {
      dayName,
      dayNumber,
      monthYear,
      dayOfYear,
      weekNumber,
      isToday,
      dateStr: toDateStr(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    };
  }, [selectedDate, today]);

  // Weekday column headers based on chosen start day
  const weekdayHeaders = useMemo(() => {
    const standardDays = [
      { id: 0, label: 'SUN' },
      { id: 1, label: 'MON' },
      { id: 2, label: 'TUE' },
      { id: 3, label: 'WED' },
      { id: 4, label: 'THU' },
      { id: 5, label: 'FRI' },
      { id: 6, label: 'SAT' }
    ];
    const headers = [];
    for (let i = 0; i < 7; i++) {
      headers.push(standardDays[(startDayOfWeek + i) % 7]);
    }
    return headers;
  }, [startDayOfWeek]);

  // Generate 7-column calendar grid
  const calendarCells = useMemo(() => {
    const cells = [];
    
    // Days in current month
    const totalDaysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // First day of current month (0 = Sun, 1 = Mon...)
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    
    // Calculate leading padding from previous month
    const leadingCount = (firstDayIndex - startDayOfWeek + 7) % 7;
    const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // Previous month cells (muted grey)
    for (let i = leadingCount - 1; i >= 0; i--) {
      const dayNum = totalDaysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = toDateStr(prevYear, prevMonth, dayNum);

      cells.push({
        dayNumber: dayNum,
        year: prevYear,
        month: prevMonth,
        isCurrentMonth: false,
        dateStr,
        isToday: (
          prevYear === today.getFullYear() &&
          prevMonth === today.getMonth() &&
          dayNum === today.getDate()
        ),
        isSelected: dateStr === selectedDayInfo.dateStr
      });
    }

    // Current month cells
    for (let day = 1; day <= totalDaysInCurrentMonth; day++) {
      const dateStr = toDateStr(currentYear, currentMonth, day);
      cells.push({
        dayNumber: day,
        year: currentYear,
        month: currentMonth,
        isCurrentMonth: true,
        dateStr,
        isToday: (
          currentYear === today.getFullYear() &&
          currentMonth === today.getMonth() &&
          day === today.getDate()
        ),
        isSelected: dateStr === selectedDayInfo.dateStr
      });
    }

    // Trailing days from next month to complete rows (35 or 42 cells total)
    const targetTotal = cells.length > 35 ? 42 : 35;
    const trailingCount = targetTotal - cells.length;
    for (let day = 1; day <= trailingCount; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = toDateStr(nextYear, nextMonth, day);

      cells.push({
        dayNumber: day,
        year: nextYear,
        month: nextMonth,
        isCurrentMonth: false,
        dateStr,
        isToday: (
          nextYear === today.getFullYear() &&
          nextMonth === today.getMonth() &&
          day === today.getDate()
        ),
        isSelected: dateStr === selectedDayInfo.dateStr
      });
    }

    return cells;
  }, [currentYear, currentMonth, startDayOfWeek, today, selectedDayInfo.dateStr]);

  // Tasks mapped by date
  const tasksByDate = useMemo(() => {
    const map = new Map();
    tasks.forEach(t => {
      const dateKey = t.deadlineDate;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(t);
    });
    return map;
  }, [tasks]);

  // Tasks for currently selected day
  const selectedDayTasks = tasksByDate.get(selectedDayInfo.dateStr) || [];

  // Years range for dropdown selector (2020 to 2035)
  const yearsList = useMemo(() => {
    const list = [];
    for (let y = 2020; y <= 2035; y++) list.push(y);
    return list;
  }, []);

  return (
    <div className="schedule-calendar-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Outer White Card Container matching attached screenshot */}
      <div 
        className="calendar-reference-card"
        style={{
          backgroundColor: '#ffffff',
          color: '#111827',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          padding: '24px 28px',
          marginBottom: '24px'
        }}
      >
        {/* HEADER SECTION (Matching screenshot top-left) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', paddingBottom: '18px', borderBottom: '1px solid #e5e7eb' }}>
          {/* Day of Week & Day Number Badge */}
          <div 
            style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '12px',
              padding: '8px 16px',
              textAlign: 'center',
              minWidth: '70px',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', lineHeight: 1.2 }}>
              {selectedDayInfo.dayName}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: 1.1, marginTop: '2px' }}>
              {selectedDayInfo.dayNumber}
            </div>
          </div>

          {/* Month, Year, Day of Year, Week # */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.01em' }}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <div style={{ fontSize: '13px', color: '#6b7280', margin: '3px 0' }}>
              Day {selectedDayInfo.dayOfYear}, Week {selectedDayInfo.weekNumber}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
              {selectedDayInfo.isToday ? 'Today' : `Selected Date (${selectedDayInfo.dateStr})`}
            </div>
          </div>
        </div>

        {/* CONTROLS ROW (Year, Nav arrows, Month, Start Day, Today Button) */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '12px', 
            padding: '18px 0 16px' 
          }}
        >
          {/* Left Controls Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Year Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                aria-label="Select Year"
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '6px 30px 6px 12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#111827',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {yearsList.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} />
            </div>

            {/* Prev Month Button */}
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                borderRadius: '6px',
                color: '#374151',
                cursor: 'pointer'
              }}
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Month Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                aria-label="Select Month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '6px 30px 6px 12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#111827',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {MONTH_ABBR.map((abbr, idx) => (
                  <option key={abbr} value={idx}>{abbr}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} />
            </div>

            {/* Next Month Button */}
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                borderRadius: '6px',
                color: '#374151',
                cursor: 'pointer'
              }}
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>

            {/* Start Day Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                aria-label="Calendar Start Day"
                value={startDayOfWeek}
                onChange={(e) => setStartDayOfWeek(Number(e.target.value))}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '6px 30px 6px 12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#111827',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value={1}>Start Day</option>
                <option value={1}>Monday</option>
                <option value={0}>Sunday</option>
                <option value={6}>Saturday</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} />
            </div>
          </div>

          {/* Right Controls Group: Today Button */}
          <div>
            <button
              onClick={handleGoToToday}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '6px 18px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              id="btn-calendar-today"
            >
              Today
            </button>
          </div>
        </div>

        {/* CALENDAR WEEKDAY LABELS (7 columns matching screenshot) */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            textAlign: 'center', 
            padding: '12px 0 8px',
            borderTop: '1px solid #f3f4f6'
          }}
        >
          {weekdayHeaders.map(day => (
            <div 
              key={day.id}
              style={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: '#6b7280', 
                letterSpacing: '0.05em' 
              }}
            >
              {day.label}
            </div>
          ))}
        </div>

        {/* 7-COLUMN CALENDAR GRID */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            rowGap: '12px',
            columnGap: '8px',
            padding: '8px 0 16px'
          }}
        >
          {calendarCells.map((cell, idx) => {
            const cellTasks = tasksByDate.get(cell.dateStr) || [];
            const hasTasks = cellTasks.length > 0;
            const hasCritical = cellTasks.some(t => t.importance === 'Critical' || t.status === 'overdue');
            const hasHigh = cellTasks.some(t => t.importance === 'High');

            return (
              <div 
                key={`${cell.dateStr}-${idx}`}
                onClick={() => {
                  setSelectedDate(new Date(cell.year, cell.month, cell.dayNumber));
                  if (!cell.isCurrentMonth) {
                    setCurrentYear(cell.year);
                    setCurrentMonth(cell.month);
                  }
                }}
                style={{
                  minHeight: '62px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  borderRadius: '8px',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                  // Today outline matching screenshot: rounded blue border
                  border: cell.isToday ? '2px solid #2563eb' : (cell.isSelected ? '2px solid #93c5fd' : '2px solid transparent'),
                  backgroundColor: cell.isSelected ? 'rgba(37, 99, 235, 0.05)' : 'transparent'
                }}
                title={`${cell.dateStr}${hasTasks ? ` (${cellTasks.length} task${cellTasks.length > 1 ? 's' : ''})` : ''}`}
              >
                {/* Upper-left 'T' indicator for Today matching screenshot */}
                {cell.isToday && (
                  <span 
                    style={{ 
                      position: 'absolute', 
                      top: '3px', 
                      left: '5px', 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      color: '#2563eb',
                      lineHeight: 1
                    }}
                  >
                    T
                  </span>
                )}

                {/* Day number */}
                <span
                  style={{
                    fontSize: '19px',
                    fontWeight: cell.isCurrentMonth ? 700 : 400,
                    color: !cell.isCurrentMonth 
                      ? '#9ca3af' 
                      : (cell.isToday ? '#111827' : '#1f2937'),
                    lineHeight: 1
                  }}
                >
                  {cell.dayNumber}
                </span>

                {/* Task Indicators below number */}
                {hasTasks && (
                  <div style={{ display: 'flex', gap: '3px', marginTop: '5px' }}>
                    <span 
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: hasCritical ? '#ef4444' : (hasHigh ? '#f59e0b' : '#3b82f6')
                      }} 
                    />
                    {cellTasks.length > 1 && (
                      <span 
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981'
                        }} 
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* INTEGRATED SELECTED DATE TASK LIST */}
      <div 
        className="glass-card" 
        style={{ 
          borderRadius: '16px', 
          overflow: 'hidden',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div 
          className="card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarIcon size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Tasks Scheduled for {selectedDayInfo.dayName} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDayInfo.dayNumber}, {selectedDate.getFullYear()}
              </h3>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'} due on this date
              </span>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ fontSize: '13px', padding: '6px 14px' }}
            onClick={() => onOpenAddTask(selectedDayInfo.dateStr)}
            id="btn-calendar-add-task-date"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Task for this Date</span>
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {selectedDayTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <CalendarIcon size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)', marginBottom: '4px' }}>
                No tasks due on this date.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 16px' }}>
                You have no scheduled coursework or laboratory deadlines on this day.
              </p>
              <button 
                className="btn-secondary" 
                style={{ fontSize: '13px', margin: '0 auto' }}
                onClick={() => onOpenAddTask(selectedDayInfo.dateStr)}
              >
                <Plus size={14} />
                <span>Schedule a Task</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedDayTasks.map(task => {
                const isCompleted = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '14px 18px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '10px',
                      opacity: isCompleted ? 0.65 : 1,
                      borderLeft: `4px solid ${
                        isCompleted ? 'var(--success)' : 
                        task.importance === 'Critical' ? 'var(--danger)' : 
                        task.importance === 'High' ? 'var(--warning)' : 'var(--primary)'
                      }`
                    }}
                  >
                    {/* Left: Completion & Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '220px' }}>
                      <button
                        className={`task-status-btn ${isCompleted ? 'checked' : ''}`}
                        onClick={() => onToggleComplete(task.id)}
                        title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                        aria-label={`Toggle completion for ${task.title}`}
                      >
                        {isCompleted && <CheckCircle2 size={16} strokeWidth={3} />}
                      </button>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                          <span className={`category-badge ${categoryClassName(task.category)}`} style={{ fontSize: '11px', padding: '1px 6px' }}>
                            {task.category}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: task.importance === 'Critical' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                            {task.importance}
                          </span>
                        </div>

                        <h4 
                          style={{ 
                            fontSize: '15px', 
                            fontWeight: 700, 
                            color: isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            margin: 0
                          }}
                        >
                          {task.title}
                        </h4>
                        
                        {task.description && (
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Meta & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>Due {task.deadlineTime || '23:59'}</span>
                        <span>•</span>
                        <span>{taskTimeSummary(task).range || taskTimeSummary(task).duration}</span>
                      </div>

                      <button
                        className="action-icon-btn"
                        onClick={() => onEditTask(task)}
                        title="Edit task"
                        aria-label="Edit task"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
