import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import PrioritizerView from './components/PrioritizerView';
import ScheduleCalendar from './components/ScheduleCalendar';
import AnalyticsView from './components/AnalyticsView';
import TaskModal from './components/TaskModal';
import SettingsModal from './components/SettingsModal';
import AuthView from './components/AuthView';

import { storageService, DEFAULT_WEIGHTS } from './services/storageService';
import { authService } from './services/authService';
import { prioritizeTasks } from './services/prioritizationEngine';
import { 
  generateNotifications, 
  playNotificationSound,
  startReminderScheduler
} from './services/notificationService';

export default function App() {
  // Simulated Authentication Session State
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  // Load tasks and settings from localStorage
  const [tasks, setTasks] = useState(() => storageService.getTasks(currentUser?.id));
  const [settings, setSettings] = useState(() => storageService.getSettings());
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Transient Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Theme synchronization with HTML document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings.theme]);

  useEffect(() => {
    if (!currentUser) return undefined;
    return startReminderScheduler(tasks, settings, (task) => {
      if (settings.soundAlertsEnabled) playNotificationSound();
      showToast(`Reminder: ${task.title}`, 'info');
    });
  }, [currentUser, tasks, settings, showToast]);

  // Compute prioritized tasks deterministically using active weights
  const rankedTasks = useMemo(() => {
    return prioritizeTasks(tasks, settings.weights || DEFAULT_WEIGHTS);
  }, [tasks, settings.weights]);

  // Real-time reminders based on actual task deadlines
  const notifications = useMemo(() => {
    return generateNotifications(tasks);
  }, [tasks]);

  // Initial chime sound if enabled and urgent tasks exist
  useEffect(() => {
    if (settings.soundAlertsEnabled) {
      const urgentCount = notifications.filter(n => n.severity === 'critical' || n.severity === 'warning').length;
      if (urgentCount > 0) {
        // play subtle chime once after interaction or mount
        playNotificationSound();
      }
    }
  }, []); // Run on initial launch

  // Authentication Session Handlers
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setTasks(storageService.getTasks(user.id));
    setActiveTab('dashboard');
    showToast(
      user.isDemo 
        ? `Logged in as Demo User (${user.name})` 
        : `Welcome back, ${user.name}!`,
      'success'
    );
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    showToast('Logged out of session', 'info');
  };

  // Task Actions
  const handleOpenAddTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData) => {
    try {
      if (taskToEdit) {
        const updated = storageService.updateTask(taskToEdit.id, taskData, currentUser?.id);
        setTasks(storageService.getTasks(currentUser?.id));
        showToast(`Task "${updated.title}" updated successfully`, 'success');
      } else {
        const created = storageService.createTask(taskData, currentUser?.id);
        setTasks(storageService.getTasks(currentUser?.id));
        showToast(`New task "${created.title}" added to queue`, 'success');
      }
    } catch (err) {
      showToast('Error saving task: ' + err.message, 'error');
    }
  };

  const handleDeleteTask = (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      storageService.deleteTask(id, currentUser?.id);
      setTasks(storageService.getTasks(currentUser?.id));
      showToast(`Task "${title}" removed`, 'info');
    }
  };

  const handleToggleComplete = (id) => {
    const updated = storageService.toggleComplete(id, currentUser?.id);
    if (updated) {
      setTasks(storageService.getTasks(currentUser?.id));
      const isDone = updated.status === 'completed';
      showToast(
        isDone ? `✓ Completed: "${updated.title}"` : `Reopened: "${updated.title}"`,
        isDone ? 'success' : 'info'
      );
      if (isDone && settings.soundAlertsEnabled) {
        playNotificationSound();
      }
    }
  };

  // Prioritization Settings Updates
  const handleUpdateWeights = (newWeights, presetKey = 'custom') => {
    const updatedSettings = storageService.saveSettings({
      weights: newWeights,
      weightPreset: presetKey
    });
    setSettings(updatedSettings);
    showToast(`Prioritization model updated: ${presetKey.replace('_', ' ').toUpperCase()}`, 'info');
  };

  // Theme Toggle
  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = storageService.saveSettings({ theme: nextTheme });
    setSettings(updated);
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const jsonStr = storageService.exportBackup(currentUser?.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PriorityFirst_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported PriorityFirst backup file', 'success');
  };

  const handleImportBackup = (jsonString) => {
    try {
      const imported = storageService.importBackup(jsonString, currentUser?.id);
      setTasks(imported);
      setSettings(storageService.getSettings());
      showToast(`Successfully imported ${imported.length} tasks`, 'success');
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error');
      throw err;
    }
  };

  const handleResetSampleData = () => {
    if (window.confirm('Reset current tasks to the standard Engineering Student sample dataset?')) {
      const samples = storageService.loadSampleData(currentUser?.id);
      setTasks(samples);
      showToast('Restored engineering coursework sample tasks', 'success');
    }
  };

  const handleClearAllTasks = () => {
    const cleared = storageService.clearAllTasks(currentUser?.id);
    setTasks(cleared);
    showToast('All tasks cleared from local storage', 'info');
  };

  return (
    <div className="app-wrapper">
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddTask={handleOpenAddTask}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        notifications={notifications}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        tasksCount={tasks.length}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {!currentUser ? (
          /* Unauthenticated Gate: Login & Registration */
          <AuthView onAuthSuccess={handleAuthSuccess} />
        ) : (
          /* Protected Academic Features */
          <>
            {activeTab === 'dashboard' && (
              <Dashboard 
                tasks={tasks}
                rankedTasks={rankedTasks}
                onOpenAddTask={handleOpenAddTask}
                onEditTask={handleEditTask}
                onToggleComplete={handleToggleComplete}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'tasks' && (
              <TaskManager 
                tasks={tasks}
                rankedTasks={rankedTasks}
                onOpenAddTask={handleOpenAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
              />
            )}

            {activeTab === 'prioritizer' && (
              <PrioritizerView 
                rankedTasks={rankedTasks}
                activeWeights={settings.weights || DEFAULT_WEIGHTS}
                weightPreset={settings.weightPreset || 'balanced'}
                onUpdateWeights={handleUpdateWeights}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
              />
            )}

            {activeTab === 'schedule' && (
              <ScheduleCalendar 
                tasks={tasks}
                onOpenAddTask={handleOpenAddTask}
                onEditTask={handleEditTask}
                onToggleComplete={handleToggleComplete}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView 
                tasks={tasks}
              />
            )}
          </>
        )}
      </main>

      {/* Task Creation & Edit Modal */}
      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
      />

      {/* Settings, Backups & LocalStorage Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetSampleData={handleResetSampleData}
        onClearAllTasks={handleClearAllTasks}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          const updated = storageService.saveSettings(newSettings);
          setSettings(updated);
        }}
        tasksCount={tasks.length}
      />

      {/* Transient Notification Toast */}
      {toast && (
        <div 
          className="app-toast"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: toast.type === 'error' ? 'var(--danger)' : (toast.type === 'success' ? '#059669' : 'var(--bg-surface-elevated)'),
            color: '#ffffff',
            boxShadow: 'var(--shadow-modal)',
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
