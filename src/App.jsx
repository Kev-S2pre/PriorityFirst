import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import PrioritizerView from './components/PrioritizerView';
import ScheduleCalendar from './components/ScheduleCalendar';
import AnalyticsView from './components/AnalyticsView';
import TaskModal from './components/TaskModal';
import SettingsModal from './components/SettingsModal';
import AuthView from './components/AuthView';
import ConfirmModal from './components/ConfirmModal';

import { storageService, DEFAULT_WEIGHTS } from './services/storageService';
import { authService } from './services/authService';
import { cloudSync, isCloudEnabled } from './services/cloudSync';
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
  const [taskManagerFilter, setTaskManagerFilter] = useState('all');

  // Navigation helper that can also preset filters in TaskManager
  const handleNavigateWithFilter = (tab, filter = 'all') => {
    setActiveTab(tab);
    if (filter) {
      setTaskManagerFilter(filter);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [newTaskDate, setNewTaskDate] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState('profile');

  // Reusable confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'primary',
    onConfirm: null
  });

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

  // ---- Cloud auto-save (Supabase) ----
  // syncStatus: 'local' (no cloud configured) | 'loading' | 'saving' | 'saved' | 'offline'
  const [syncStatus, setSyncStatus] = useState(isCloudEnabled ? 'loading' : 'local');
  const cloudReadyRef = useRef(false);      // this user's cloud data has been loaded
  const baselineTasksRef = useRef(tasks);   // tasks as last loaded, to spot edits made before loading finished
  const localDirtyRef = useRef(false);      // edits made while offline / before loading, not yet uploaded
  const pendingPushRef = useRef(false);     // a save is queued or in flight
  const lastLoadRef = useRef(0);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const loadFromCloud = useCallback(async (user) => {
    if (!isCloudEnabled || !user) return;
    cloudReadyRef.current = false;
    lastLoadRef.current = Date.now();
    setSyncStatus('loading');
    try {
      const { tasks: cloudTasks, settings: cloudSettings } = await cloudSync.pull(user.id);
      const normalizedCloud = storageService.saveTasks(cloudTasks, user.id);
      cloudSync.markSynced(user.id, normalizedCloud);

      let nextTasks = normalizedCloud;
      const migratedKey = `priorityfirst_cloud_migrated_${user.id}`;
      if (localDirtyRef.current) {
        // Keep edits made while offline: local versions win, cloud-only tasks are kept
        const merged = new Map(normalizedCloud.map(t => [t.id, t]));
        tasksRef.current.forEach(t => merged.set(t.id, t));
        nextTasks = storageService.saveTasks([...merged.values()], user.id);
      } else if (normalizedCloud.length === 0 && !localStorage.getItem(migratedKey)) {
        // First cloud sign-in: bring over tasks from an older account saved in this browser
        const { tasks: legacyTasks } = authService.getLocalTasksForEmail(user.email);
        if (legacyTasks.length > 0) {
          nextTasks = storageService.saveTasks(legacyTasks, user.id);
          showToast(`Moved ${nextTasks.length} tasks from this device into your account`, 'success');
        }
      }
      localStorage.setItem(migratedKey, 'true');

      if (nextTasks !== normalizedCloud) {
        await cloudSync.pushTasks(user.id, nextTasks);
      }
      localDirtyRef.current = false;
      baselineTasksRef.current = nextTasks;
      setTasks(nextTasks);

      if (cloudSettings) {
        setSettings(storageService.saveSettings(cloudSettings));
      } else {
        await cloudSync.pushSettings(user.id, storageService.getSettings());
      }

      cloudReadyRef.current = true;
      setSyncStatus('saved');
    } catch (err) {
      console.error('Cloud load failed:', err);
      setSyncStatus('offline');
    }
  }, [showToast]);

  // Re-check the saved session and load this user's cloud data on app start
  useEffect(() => {
    if (!isCloudEnabled || !currentUser) return;
    authService.restoreSession().then(user => {
      if (!user) {
        setCurrentUser(null);
        setTasks([]);
        showToast('Your session has ended. Please sign in again.', 'info');
        return;
      }
      setCurrentUser(user);
      loadFromCloud(user);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save tasks shortly after every change
  useEffect(() => {
    if (!isCloudEnabled || !currentUser) return undefined;
    if (!cloudReadyRef.current) {
      if (tasks !== baselineTasksRef.current) localDirtyRef.current = true;
      return undefined;
    }
    pendingPushRef.current = true;
    const timer = setTimeout(async () => {
      setSyncStatus('saving');
      try {
        await cloudSync.pushTasks(currentUser.id, tasks);
        setSyncStatus('saved');
      } catch (err) {
        console.error('Cloud save failed:', err);
        // Keep the change locally and upload it when the connection returns
        cloudReadyRef.current = false;
        localDirtyRef.current = true;
        setSyncStatus('offline');
      } finally {
        pendingPushRef.current = false;
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [tasks, currentUser]);

  // Auto-save settings (theme, weights, preferences) to the user's account
  useEffect(() => {
    if (!isCloudEnabled || !currentUser || !cloudReadyRef.current) return undefined;
    const timer = setTimeout(() => {
      cloudSync.pushSettings(currentUser.id, settings).catch(err => console.error('Settings sync failed:', err));
    }, 800);
    return () => clearTimeout(timer);
  }, [settings, currentUser]);

  // Pick up changes from other devices when returning to the app or coming back online
  useEffect(() => {
    if (!isCloudEnabled || !currentUser) return undefined;
    const refresh = () => {
      if (document.visibilityState !== 'visible' || pendingPushRef.current) return;
      if (cloudReadyRef.current && Date.now() - lastLoadRef.current < 30000) return;
      loadFromCloud(currentUser);
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
    };
  }, [currentUser, loadFromCloud]);

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
    const cachedTasks = storageService.getTasks(user.id);
    cloudReadyRef.current = false;
    localDirtyRef.current = false;
    baselineTasksRef.current = cachedTasks;
    setCurrentUser(user);
    setTasks(cachedTasks);
    setActiveTab('dashboard');
    showToast(`Welcome back, ${user.name}!`, 'success');
    loadFromCloud(user);
  };

  const handleLogout = () => {
    if (currentUser) cloudSync.forget(currentUser.id);
    cloudReadyRef.current = false;
    localDirtyRef.current = false;
    setSyncStatus(isCloudEnabled ? 'loading' : 'local');
    authService.logout();
    setCurrentUser(null);
    showToast('Logged out of session', 'info');
  };

  // Task Actions
  const handleOpenAddTask = (date = null) => {
    setTaskToEdit(null);
    // Only accept a date string (buttons may pass a click event)
    setNewTaskDate(typeof date === 'string' ? date : null);
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
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Task?',
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      confirmText: 'Delete Task',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: () => {
        storageService.deleteTask(id, currentUser?.id);
        setTasks(storageService.getTasks(currentUser?.id));
        showToast(`Task "${title}" removed`, 'info');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
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
    a.download = `PriorityFirst2_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported PriorityFirst² backup file', 'success');
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
    setConfirmDialog({
      isOpen: true,
      title: 'Load Engineering Sample Tasks?',
      message: 'Reset current tasks and load the standard Engineering Student sample dataset? Any unsaved custom tasks might be overwritten or supplemented.',
      confirmText: 'Load Samples',
      cancelText: 'Cancel',
      confirmVariant: 'primary',
      onConfirm: () => {
        const samples = storageService.loadSampleData(currentUser?.id);
        setTasks(samples);
        showToast('Restored engineering coursework sample tasks', 'success');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleClearAllTasks = () => {
    const cleared = storageService.clearAllTasks(currentUser?.id);
    setTasks(cleared);
    showToast('All tasks cleared', 'info');
  };

  return (
    <div className="app-wrapper">
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={(tab) => handleNavigateWithFilter(tab, 'all')}
        onOpenSettings={(section = 'profile') => {
          setSettingsSection(section);
          setIsSettingsModalOpen(true);
        }}
        notifications={notifications}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        tasksCount={tasks.length}
        currentUser={currentUser}
        syncStatus={syncStatus}
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
                onNavigateTab={handleNavigateWithFilter}
              />
            )}

            {activeTab === 'tasks' && (
              <TaskManager 
                tasks={tasks}
                rankedTasks={rankedTasks}
                initialStatusFilter={taskManagerFilter}
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
        onDelete={handleDeleteTask}
        taskToEdit={taskToEdit}
        initialDate={newTaskDate}
      />

      {/* Settings, Backups & LocalStorage Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        initialSection={settingsSection}
        currentUser={currentUser}
        onProfileUpdated={(user) => {
          setCurrentUser(user);
          showToast('Profile updated', 'success');
        }}
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

      {/* Global Confirmation Dialog */}
      <ConfirmModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        confirmVariant={confirmDialog.confirmVariant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
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
