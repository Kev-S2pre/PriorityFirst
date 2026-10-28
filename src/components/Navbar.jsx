import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  LayoutDashboard, 
  ListTodo, 
  Sliders, 
  Calendar, 
  BarChart3, 
  Plus, 
  Bell, 
  Moon, 
  Sun, 
  Settings, 
  AlertTriangle,
  Clock,
  X,
  LogOut,
  User
} from 'lucide-react';
import ConfirmModal from './ConfirmModal.jsx';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenAddTask,
  onOpenSettings,
  notifications,
  theme,
  onToggleTheme,
  tasksCount,
  currentUser,
  onLogout
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const popoverRef = useRef(null);

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const criticalCount = notifications.filter(n => n.severity === 'critical' || n.severity === 'warning').length;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo & Name */}
        <div className="brand-section">
          <div className="brand-logo-icon" title="PriorityFirst">
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>
          <div className="brand-title-wrap">
            <div className="brand-name">
              PriorityFirst
              <span className="brand-badge">PF</span>
            </div>
            <span className="brand-subtitle">Time-Management & Task Prioritization</span>
          </div>
        </div>

        {/* Navigation Tabs (Protected) */}
        {currentUser ? (
          <nav className="nav-tabs" aria-label="Main Navigation">
            <button 
              className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
              id="nav-tab-dashboard"
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button 
              className={`nav-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
              id="nav-tab-tasks"
            >
              <ListTodo size={16} />
              <span>Tasks</span>
              {tasksCount > 0 && <span className="nav-tab-badge">{tasksCount}</span>}
            </button>

            <button 
              className={`nav-tab-btn ${activeTab === 'prioritizer' ? 'active' : ''}`}
              onClick={() => setActiveTab('prioritizer')}
              id="nav-tab-prioritizer"
            >
              <Sliders size={16} />
              <span>Prioritizer</span>
            </button>

            <button 
              className={`nav-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
              id="nav-tab-schedule"
            >
              <Calendar size={16} />
              <span>Schedule</span>
            </button>

            <button 
              className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
              id="nav-tab-analytics"
            >
              <BarChart3 size={16} />
              <span>Analytics</span>
            </button>
          </nav>
        ) : (
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Academic Session Authentication
          </div>
        )}

        {/* Action Buttons */}
        <div className="navbar-actions">
          {/* Quick Add Task (Protected) */}
          {currentUser && (
            <button 
              className="btn-primary"
              onClick={onOpenAddTask}
              id="btn-quick-add-task"
              title="Create a new task"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>New Task</span>
            </button>
          )}

          {/* Notifications Bell (Protected) */}
          {currentUser && (
            <div style={{ position: 'relative' }} ref={popoverRef}>
              <button 
                className="icon-btn"
                onClick={() => setShowNotifications(prev => !prev)}
                title="Notifications & Reminders"
                id="btn-notifications-toggle"
                aria-label="View notifications"
              >
                <Bell size={18} />
                {criticalCount > 0 && (
                  <span className="icon-badge">{criticalCount}</span>
                )}
              </button>

            {/* Notification Dropdown Popover */}
            {showNotifications && (
              <div className="notifications-popover">
                <div className="notif-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Bell size={16} className="text-primary" />
                    <span>In-App Reminders</span>
                  </div>
                  <button 
                    className="action-icon-btn" 
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close notifications"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5, color: 'var(--success)' }} />
                      <p>All caught up! No imminent deadlines or overdue tasks.</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notif-item ${n.severity}`}>
                        <div style={{ marginTop: '2px' }}>
                          {n.severity === 'critical' && <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />}
                          {n.severity === 'warning' && <Clock size={16} style={{ color: 'var(--warning)' }} />}
                          {n.severity === 'info' && <Calendar size={16} style={{ color: 'var(--info)' }} />}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {n.dueTimeFormatted}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                            {n.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ padding: '0.65rem 1rem', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border-subtle)', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Reminders are computed in real time from your saved tasks.
                </div>
              </div>
            )}
          </div>
        )}

          {/* Theme Toggle */}
          <button 
            className="icon-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            id="btn-theme-toggle"
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Settings & Storage */}
          <button 
            className="icon-btn"
            onClick={onOpenSettings}
            title="Settings, Backups & Local Storage"
            id="btn-settings-toggle"
            aria-label="Open settings"
          >
            <Settings size={18} />
          </button>

          {/* User Profile & Logout */}
          {currentUser && (
            <div className="navbar-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.25rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border-subtle)' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.45rem', 
                  padding: '4px 10px', 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
                title={`${currentUser.name} · ${currentUser.classification || currentUser.role || 'User'} (${currentUser.email})`}
              >
                <div 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: 'var(--radius-full)', 
                    background: 'var(--primary-gradient)', 
                    color: '#ffffff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700 
                  }}
                >
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.name.split(' ')[0]}
                </span>
              </div>

              <button 
                className="icon-btn"
                onClick={() => setShowLogoutConfirm(true)}
                title="Log Out of Session"
                id="btn-logout"
                aria-label="Log Out"
                style={{ color: 'var(--danger)' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmModal 
        isOpen={showLogoutConfirm}
        title="Sign Out of Session?"
        message="Are you sure you want to log out? Your session will end and you will return to the login screen."
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmVariant="danger"
        icon={LogOut}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
}
