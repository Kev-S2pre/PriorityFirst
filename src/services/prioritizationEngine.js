import { DEFAULT_WEIGHTS } from './storageService.js';

/**
 * Multi-Criteria Decision Analysis (MCDA) Prioritization Engine
 * Fully transparent, deterministic, and explainable without black-box AI
 */

export const PRESET_WEIGHTS = {
  balanced: {
    name: 'Balanced',
    description: 'Balances urgency, importance, workload pressure, and difficulty for everyday planning.',
    weights: { urgency: 0.40, importance: 0.25, workload: 0.20, difficulty: 0.15 }
  },
  urgent: {
    name: 'Deadline-Driven (Crunch Mode)',
    description: 'Focuses heavily on imminent deadlines and overdue responsibilities.',
    weights: { urgency: 0.60, importance: 0.20, workload: 0.15, difficulty: 0.05 }
  },
  deep_work: {
    name: 'Cognitive / Deep Work First',
    description: 'Gives challenging, high-focus work equal weight so it gets started early.',
    weights: { urgency: 0.25, importance: 0.25, workload: 0.25, difficulty: 0.25 }
  },
  quick_wins: {
    name: 'Momentum / Quick Wins',
    description: 'Surfaces manageable tasks with shorter durations to build momentum.',
    weights: { urgency: 0.35, importance: 0.35, workload: 0.10, difficulty: 0.20 }
  }
};

/**
 * Calculates time remaining until deadline in milliseconds and hours
 */
export function calculateTimeRemaining(deadlineDate, deadlineTime = '23:59') {
  const now = new Date();
  const [year, month, day] = deadlineDate.split('-').map(Number);
  const [hours, minutes] = (deadlineTime || '23:59').split(':').map(Number);
  
  const target = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return {
    diffMs,
    diffHours,
    isOverdue: diffMs < 0,
    isDueToday: diffHours >= 0 && diffHours <= 24 && target.getDate() === now.getDate(),
    formattedDeadline: target.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ` at ${deadlineTime || '23:59'}`
  };
}

/**
 * Computes individual subscores and composite priority score
 */
export function calculateTaskPriority(task, customWeights = DEFAULT_WEIGHTS) {
  // Normalize weights to sum to 1.0. A weight set to 0 stays 0; only missing weights use the defaults.
  const pick = (key) => {
    const value = Number(customWeights?.[key]);
    return Number.isFinite(value) && value >= 0 ? value : DEFAULT_WEIGHTS[key];
  };
  const raw = {
    urgency: pick('urgency'),
    importance: pick('importance'),
    workload: pick('workload'),
    difficulty: pick('difficulty')
  };
  const totalW = raw.urgency + raw.importance + raw.workload + raw.difficulty || 1;

  const w = {
    urgency: raw.urgency / totalW,
    importance: raw.importance / totalW,
    workload: raw.workload / totalW,
    difficulty: raw.difficulty / totalW,
  };

  if (task.status === 'completed') {
    return {
      score: 0,
      urgencyScore: 0,
      importanceScore: 0,
      workloadScore: 0,
      difficultyScore: 0,
      priorityLevel: 'Completed',
      explanation: 'Task is marked as completed. No further action needed.',
      reasons: ['Completed'],
      diffHours: 0,
      isOverdue: false,
      isDueToday: false
    };
  }

  const { diffHours, isOverdue, isDueToday } = calculateTimeRemaining(task.deadlineDate, task.deadlineTime);

  // 1. URGENCY SUBSCORE (0 to 100)
  let urgencyScore = 0;
  if (isOverdue) {
    // Overdue tasks peak at max urgency
    urgencyScore = 100;
  } else if (diffHours <= 6) {
    // 0 to 6 hours left
    urgencyScore = Math.round(95 + (1 - diffHours / 6) * 5);
  } else if (diffHours <= 24) {
    // 6 to 24 hours left
    urgencyScore = Math.round(80 + (1 - (diffHours - 6) / 18) * 15);
  } else if (diffHours <= 72) {
    // 1 to 3 days left
    urgencyScore = Math.round(60 + (1 - (diffHours - 24) / 48) * 20);
  } else if (diffHours <= 168) {
    // 3 to 7 days left
    urgencyScore = Math.round(35 + (1 - (diffHours - 72) / 96) * 25);
  } else {
    // > 1 week left
    urgencyScore = Math.max(10, Math.round(35 - Math.min(25, (diffHours - 168) / 168 * 20)));
  }

  // 2. IMPORTANCE SUBSCORE (0 to 100)
  const importanceMap = {
    'Critical': 100,
    'High': 75,
    'Medium': 50,
    'Low': 25
  };
  const importanceScore = importanceMap[task.importance] || 50;

  // 3. WORKLOAD SUBSCORE (0 to 100)
  // Combines total estimated hours and ratio of estimated hours to remaining time
  const estHours = Math.max(0.25, Number(task.estimatedHours) || 1.0);
  let workloadPressure = 0;
  if (isOverdue) {
    workloadPressure = 100;
  } else {
    const timeRatio = estHours / Math.max(0.5, diffHours); // > 0.5 means task takes > half the remaining window
    const ratioComponent = Math.min(50, Math.round(timeRatio * 50));
    const durationComponent = Math.min(50, Math.round((estHours / 8) * 50));
    workloadPressure = Math.min(100, ratioComponent + durationComponent);
  }

  // 4. DIFFICULTY / COGNITIVE EFFORT SUBSCORE (0 to 100)
  // Level 1: 20, Level 2: 40, Level 3: 60, Level 4: 80, Level 5: 100
  const difficulty = Math.max(1, Math.min(5, Number(task.difficulty) || 3));
  const difficultyScore = difficulty * 20;

  // COMPOSITE WEIGHTED SCORE
  const composite = (urgencyScore * w.urgency) +
                    (importanceScore * w.importance) +
                    (workloadPressure * w.workload) +
                    (difficultyScore * w.difficulty);

  const finalScore = Math.round(Math.min(100, Math.max(0, composite)));

  // Priority classification
  let priorityLevel = 'Low';
  if (finalScore >= 80) priorityLevel = 'Critical';
  else if (finalScore >= 65) priorityLevel = 'High';
  else if (finalScore >= 45) priorityLevel = 'Medium';

  // GENERATE RATIONALE & EXPLANATION
  const reasons = [];
  const explanationBullets = [];

  if (isOverdue) {
    const overdueHrs = Math.abs(Math.round(diffHours));
    reasons.push(`Overdue by ${overdueHrs > 24 ? Math.round(overdueHrs / 24) + 'd' : overdueHrs + 'h'}`);
    explanationBullets.push(`Overdue deadline needs immediate attention to limit the impact of missing it.`);
  } else if (diffHours <= 12) {
    reasons.push(`Due in ${Math.round(diffHours)} hours`);
    explanationBullets.push(`Deadline is imminent (${Math.round(diffHours)}h remaining), giving this task urgent precedence.`);
  } else if (isDueToday) {
    reasons.push('Due today');
    explanationBullets.push(`Due today before midnight; needs a slot in today's plan.`);
  } else if (diffHours <= 48) {
    reasons.push('Due within 48h');
    explanationBullets.push(`Due within 2 days; early initiation prevents crunch.`);
  }

  if (task.importance === 'Critical') {
    reasons.push('Critical importance');
    explanationBullets.push(`Marked 'Critical', so the outcome carries the most weight.`);
  } else if (task.importance === 'High') {
    reasons.push('High importance');
  }

  if (estHours >= 4) {
    reasons.push(`Substantial effort (${estHours} hrs)`);
    explanationBullets.push(`Requires substantial preparation time (${estHours} hours), necessitating early scheduling.`);
  }

  if (difficulty >= 4) {
    reasons.push(`High difficulty (Level ${difficulty}/5)`);
    explanationBullets.push(`High complexity (Level ${difficulty}) demands fresh focus and may need help or extra preparation.`);
  }

  // Fallback reason if list is sparse
  if (reasons.length === 0) {
    reasons.push(`Scheduled for ${task.deadlineDate}`);
    explanationBullets.push(`Standard priority task with sufficient lead time.`);
  }

  const primaryExplanation = explanationBullets.join(' ');

  return {
    score: finalScore,
    urgencyScore,
    importanceScore,
    workloadScore: workloadPressure,
    difficultyScore,
    priorityLevel,
    reasons,
    explanation: primaryExplanation,
    diffHours,
    isOverdue,
    isDueToday,
    weightsUsed: w
  };
}

/**
 * Analyzes and sorts an array of tasks by calculated priority score
 */
export function prioritizeTasks(tasks, weights = DEFAULT_WEIGHTS) {
  if (!Array.isArray(tasks)) return [];

  // Exclude or separate completed tasks
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const evaluatedActive = activeTasks.map(task => {
    const priority = calculateTaskPriority(task, weights);
    return {
      ...task,
      priority
    };
  });

  // Sort descending by priority score
  evaluatedActive.sort((a, b) => {
    if (b.priority.score !== a.priority.score) {
      return b.priority.score - a.priority.score;
    }
    // Tie-breaker: earlier deadline
    return a.priority.diffHours - b.priority.diffHours;
  });

  // Assign 1-indexed rank
  const rankedActive = evaluatedActive.map((task, idx) => ({
    ...task,
    rank: idx + 1
  }));

  const evaluatedCompleted = completedTasks.map(task => ({
    ...task,
    priority: calculateTaskPriority(task, weights),
    rank: null
  }));

  return [...rankedActive, ...evaluatedCompleted];
}
