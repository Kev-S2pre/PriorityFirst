import { generateSampleTasks } from '../data/sampleTasks.js';

const TASKS_KEY = 'priorityfirst_tasks_v1';
const INITIALIZED_KEY = 'priorityfirst_initialized_v1';
const SETTINGS_KEY = 'priorityfirst_settings_v1';

export const DEFAULT_WEIGHTS = {
  urgency: 0.40,      // 40%
  importance: 0.25,   // 25%
  workload: 0.20,     // 20%
  difficulty: 0.15    // 15%
};

export const DEFAULT_SETTINGS = {
  theme: 'light', // 'light' | 'dark'
  weights: { ...DEFAULT_WEIGHTS },
  weightPreset: 'balanced', // 'balanced' | 'urgent' | 'deep_work' | 'quick_wins'
  browserNotificationsEnabled: false,
  soundAlertsEnabled: true,
  dailyWorkloadLimitHours: 8, // Realistic working capacity per day
};

function getTasksKey(userId) {
  return userId ? `priorityfirst_tasks_${userId}_v1` : TASKS_KEY;
}

function getInitKey(userId) {
  return userId ? `priorityfirst_init_${userId}_v1` : INITIALIZED_KEY;
}

/**
 * Validates a single task schema to ensure data integrity
 */
function isValidTask(task) {
  if (!task || typeof task !== 'object') return false;
  if (typeof task.id !== 'string' || !task.id.trim()) return false;
  if (typeof task.title !== 'string' || !task.title.trim()) return false;
  if (!task.deadlineDate || typeof task.deadlineDate !== 'string') return false;
  return true;
}

/**
 * Sanitizes and normalizes a task object
 */
function sanitizeTask(task) {
  return {
    id: task.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: (task.title || 'Untitled Task').trim(),
    description: (task.description || '').trim(),
    category: task.category || 'assignment',
    deadlineDate: task.deadlineDate || new Date().toISOString().split('T')[0],
    deadlineTime: task.deadlineTime || '23:59',
    difficulty: Math.max(1, Math.min(5, Number(task.difficulty) || 3)),
    estimatedHours: Math.max(0.1, Number(task.estimatedHours) || 1.0),
    importance: ['Low', 'Medium', 'High', 'Critical'].includes(task.importance) ? task.importance : 'Medium',
    status: ['pending', 'in_progress', 'completed', 'overdue'].includes(task.status) ? task.status : 'pending',
    notes: (task.notes || '').trim(),
    createdAt: task.createdAt || new Date().toISOString(),
    completedAt: task.completedAt || null,
    scheduledStartTime: task.scheduledStartTime || null,
  };
}

/**
 * Storage Service - Decoupled persistence layer
 * Supports user-isolated task queues and preferences
 */
export const storageService = {
  /**
   * Retrieves all tasks from browser localStorage for a specific user
   */
  getTasks(userId = null) {
    try {
      const storageKey = getTasksKey(userId);
      const initKey = getInitKey(userId);

      const stored = localStorage.getItem(storageKey);
      const isInitialized = localStorage.getItem(initKey);

      if (!stored) {
        if (!isInitialized) {
          // If previous global tasks exist, migrate them to this user
          const existingGlobal = localStorage.getItem(TASKS_KEY);
          if (existingGlobal) {
            try {
              const globalParsed = JSON.parse(existingGlobal);
              if (Array.isArray(globalParsed) && globalParsed.length > 0) {
                localStorage.setItem(storageKey, existingGlobal);
                localStorage.setItem(initKey, 'true');
                return globalParsed.filter(isValidTask).map(sanitizeTask);
              }
            } catch {
              // fallback to fresh sample tasks
            }
          }

          // First visit / test user: Seed with realistic engineering student sample tasks
          const initialTasks = generateSampleTasks();
          localStorage.setItem(storageKey, JSON.stringify(initialTasks));
          localStorage.setItem(initKey, 'true');
          return initialTasks;
        }
        return [];
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        console.warn('Storage corrupted, resetting to empty list');
        return [];
      }

      return parsed.filter(isValidTask).map(sanitizeTask);
    } catch (err) {
      console.error('Failed to read from localStorage:', err);
      return [];
    }
  },

  /**
   * Saves task array to localStorage for a specific user
   */
  saveTasks(tasks, userId = null) {
    try {
      if (!Array.isArray(tasks)) {
        throw new Error('Tasks must be an array');
      }
      const storageKey = getTasksKey(userId);
      const initKey = getInitKey(userId);

      const sanitized = tasks.map(sanitizeTask);
      localStorage.setItem(storageKey, JSON.stringify(sanitized));
      localStorage.setItem(initKey, 'true');
      return sanitized;
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      throw err;
    }
  },

  /**
   * Creates a new task
   */
  createTask(taskData, userId = null) {
    const tasks = this.getTasks(userId);
    const newTask = sanitizeTask({
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: taskData.status || 'pending'
    });

    tasks.unshift(newTask);
    this.saveTasks(tasks, userId);
    return newTask;
  },

  /**
   * Updates an existing task
   */
  updateTask(id, updates, userId = null) {
    const tasks = this.getTasks(userId);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Task with ID ${id} not found`);
    }

    const currentTask = tasks[index];
    const isNowCompleted = updates.status === 'completed' && currentTask.status !== 'completed';
    const isUncompleted = updates.status && updates.status !== 'completed' && currentTask.status === 'completed';

    const updatedTask = sanitizeTask({
      ...currentTask,
      ...updates,
      id: currentTask.id,
      completedAt: isNowCompleted ? new Date().toISOString() : (isUncompleted ? null : currentTask.completedAt)
    });

    tasks[index] = updatedTask;
    this.saveTasks(tasks, userId);
    return updatedTask;
  },

  /**
   * Toggles completion status of a task
   */
  toggleComplete(id, userId = null) {
    const tasks = this.getTasks(userId);
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    return this.updateTask(id, { status: newStatus }, userId);
  },

  /**
   * Deletes a task by ID
   */
  deleteTask(id, userId = null) {
    const tasks = this.getTasks(userId);
    const filtered = tasks.filter(t => t.id !== id);
    this.saveTasks(filtered, userId);
    return filtered;
  },

  /**
   * Resets data to initial sample tasks
   */
  loadSampleData(userId = null) {
    const samples = generateSampleTasks();
    this.saveTasks(samples, userId);
    return samples;
  },

  /**
   * Clears all tasks
   */
  clearAllTasks(userId = null) {
    const storageKey = getTasksKey(userId);
    const initKey = getInitKey(userId);
    localStorage.removeItem(storageKey);
    localStorage.setItem(initKey, 'true');
    return [];
  },

  /**
   * Export all user data as JSON file content
   */
  exportBackup(userId = null) {
    const data = {
      system: 'PriorityFirst',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      userId: userId || 'anonymous',
      tasks: this.getTasks(userId),
      settings: this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * Imports tasks from JSON backup string with validation
   */
  importBackup(jsonString, userId = null) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || (!Array.isArray(parsed.tasks) && !Array.isArray(parsed))) {
        throw new Error('Invalid JSON format: Expected a tasks array or backup object.');
      }

      const tasksToImport = Array.isArray(parsed) ? parsed : parsed.tasks;
      const validTasks = tasksToImport.filter(isValidTask).map(sanitizeTask);

      if (validTasks.length === 0 && tasksToImport.length > 0) {
        throw new Error('No valid tasks found in the imported file.');
      }

      this.saveTasks(validTasks, userId);

      if (parsed.settings && typeof parsed.settings === 'object') {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }

      return validTasks;
    } catch (err) {
      console.error('Import backup failed:', err);
      throw err;
    }
  },

  /**
   * Get Settings
   */
  getSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (!stored) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  /**
   * Save Settings
   */
  saveSettings(settings) {
    try {
      const updated = { ...this.getSettings(), ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.error('Failed to save settings:', err);
      return { ...DEFAULT_SETTINGS };
    }
  }
};
