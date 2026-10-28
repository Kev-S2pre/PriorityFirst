import React from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Layers, 
  Award,
  BookOpen,
  FolderGit2,
  Activity,
  Calculator,
  FileText
} from 'lucide-react';
import { calculateTimeRemaining } from '../services/prioritizationEngine';
import { TASK_CATEGORIES } from '../data/taskOptions.js';

export default function AnalyticsView({ tasks }) {
  const totalCount = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const activeTasks = tasks.filter(t => t.status !== 'completed');

  const completionRate = totalCount > 0 ? Math.round((completedTasks.length / totalCount) * 100) : 0;

  // Workload Hours Analysis
  const totalCompletedHours = completedTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
  const totalRemainingHours = activeTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
  const totalPlannedHours = totalCompletedHours + totalRemainingHours;
  const hoursCompletionRate = totalPlannedHours > 0 ? Math.round((totalCompletedHours / totalPlannedHours) * 100) : 0;

  // On-time vs Overdue Analysis
  const overdueCount = activeTasks.filter(t => {
    const { isOverdue } = calculateTimeRemaining(t.deadlineDate, t.deadlineTime);
    return isOverdue;
  }).length;

  const onTimeScore = totalCount > 0 ? Math.max(0, Math.round(((totalCount - overdueCount) / totalCount) * 100)) : 100;

  // Category Breakdown Analysis
  const categoryIcons = {
    assignment: BookOpen, project: FolderGit2, 'laboratory activity': Activity,
    calculation: Calculator, report: FileText, 'personal responsibility': Layers
  };
  const categories = TASK_CATEGORIES.map(({ value, label }) => ({ key: value, label, icon: categoryIcons[value] || Layers }));

  const categoryData = categories.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat.key);
    const catCompleted = catTasks.filter(t => t.status === 'completed');
    const catHours = catTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
    const catCompletedHours = catCompleted.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
    const pct = catTasks.length > 0 ? Math.round((catCompleted.length / catTasks.length) * 100) : 0;

    return {
      ...cat,
      totalCount: catTasks.length,
      completedCount: catCompleted.length,
      hours: catHours,
      completedHours: catCompletedHours,
      completionRate: pct
    };
  });

  // Difficulty Distribution
  const difficultyLevels = [1, 2, 3, 4, 5].map(lvl => {
    const lvlTasks = tasks.filter(t => Number(t.difficulty) === lvl);
    const lvlHours = lvlTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
    return {
      level: lvl,
      count: lvlTasks.length,
      hours: lvlHours
    };
  });

  return (
    <div className="analytics-view">
      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <BarChart3 size={26} style={{ color: 'var(--primary)' }} />
          <span>Progress Tracking & Performance Analytics</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Objective summaries of task completion velocity, workload distribution, and deadline discipline.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {/* Overall Completion */}
        <div className="stat-card completed">
          <div className="stat-header">
            <span className="stat-label">Completion Velocity</span>
            <div className="stat-icon"><CheckCircle2 size={18} /></div>
          </div>
          <div className="stat-value">{completionRate}%</div>
          <span className="stat-subtext">{completedTasks.length} of {totalCount} tasks completed</span>
        </div>

        {/* Study Hours Completed */}
        <div className="stat-card in_progress">
          <div className="stat-header">
            <span className="stat-label">Invested Workload</span>
            <div className="stat-icon"><Clock size={18} /></div>
          </div>
          <div className="stat-value">{totalCompletedHours.toFixed(1)}h</div>
          <span className="stat-subtext">{totalRemainingHours.toFixed(1)}h remaining of {totalPlannedHours.toFixed(1)}h total</span>
        </div>

        {/* Schedule Discipline Score */}
        <div className="stat-card total">
          <div className="stat-header">
            <span className="stat-label">On-Time Discipline</span>
            <div className="stat-icon"><Award size={18} /></div>
          </div>
          <div className="stat-value" style={{ color: onTimeScore >= 80 ? 'var(--success)' : 'var(--warning)' }}>
            {onTimeScore}%
          </div>
          <span className="stat-subtext">
            {overdueCount === 0 ? 'Flawless! Zero overdue items' : `${overdueCount} task(s) currently overdue`}
          </span>
        </div>

        {/* Workload Progress Ratio */}
        <div className="stat-card due_today">
          <div className="stat-header">
            <span className="stat-label">Hours Ratio</span>
            <div className="stat-icon"><TrendingUp size={18} /></div>
          </div>
          <div className="stat-value">{hoursCompletionRate}%</div>
          <span className="stat-subtext">Total time commitment fulfilled</span>
        </div>
      </div>

      {/* Two-Column Analytics Layout */}
      <div className="dashboard-grid">
        {/* Left Column: Category Progress Breakdown */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title">
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              <span>Task Category Breakdown</span>
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {categoryData.filter(cat => cat.totalCount > 0).map(cat => {
                const Icon = cat.icon;
                return (
                  <div key={cat.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Icon size={16} style={{ color: 'var(--primary)' }} />
                        {cat.label}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {cat.completedCount}/{cat.totalCount} tasks • {cat.completedHours.toFixed(1)}/{cat.hours.toFixed(1)} hrs ({cat.completionRate}%)
                      </span>
                    </div>

                    <div className="priority-bar-meter" style={{ height: '8px' }}>
                      <div 
                        className="priority-bar-fill" 
                        style={{ 
                          width: `${cat.completionRate}%`,
                          background: cat.completionRate === 100 ? 'var(--success)' : 'var(--primary-gradient)'
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Cognitive Difficulty Distribution & Study Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Difficulty Breakdown */}
          <div className="glass-card">
            <div className="card-header">
              <div className="card-title">
                <BarChart3 size={18} style={{ color: 'var(--warning)' }} />
                <span>Cognitive Difficulty Distribution</span>
              </div>
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {difficultyLevels.map(lvl => {
                  const labelMap = {
                    1: 'Level 1: Very Easy',
                    2: 'Level 2: Easy',
                    3: 'Level 3: Moderate',
                    4: 'Level 4: Difficult',
                    5: 'Level 5: Very Challenging'
                  };
                  const pct = totalCount > 0 ? Math.round((lvl.count / totalCount) * 100) : 0;

                  return (
                    <div key={lvl.level}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 600 }}>{labelMap[lvl.level]}</span>
                        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {lvl.count} tasks ({lvl.hours.toFixed(1)}h)
                        </span>
                      </div>
                      <div className="priority-bar-meter">
                        <div 
                          className="priority-bar-fill" 
                          style={{ 
                            width: `${pct}%`,
                            background: lvl.level >= 4 ? 'var(--danger)' : lvl.level === 3 ? 'var(--warning)' : 'var(--success)'
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Academic Engineering Insights Card */}
          <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="card-body">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                <span>Time Management & Critical Thinking Insights</span>
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Based on engineering student productivity research, high-difficulty calculations and laboratory reports require 25-40% more revision time than initially estimated. Prioritizing Level 4 & 5 tasks at least 48 hours prior to submission significantly reduces critical submission errors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
