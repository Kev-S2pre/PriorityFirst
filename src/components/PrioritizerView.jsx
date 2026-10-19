import React, { useState } from 'react';
import { 
  Sliders, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Flame, 
  Brain, 
  Zap, 
  Target,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PRESET_WEIGHTS } from '../services/prioritizationEngine';

export default function PrioritizerView({
  rankedTasks,
  activeWeights,
  weightPreset,
  onUpdateWeights,
  onToggleComplete,
  onEditTask
}) {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // Active tasks only for prioritization ranking
  const activeRanked = rankedTasks.filter(t => t.status !== 'completed');
  const completedRanked = rankedTasks.filter(t => t.status === 'completed');

  const handleSelectPreset = (presetKey) => {
    const preset = PRESET_WEIGHTS[presetKey];
    if (preset) {
      onUpdateWeights(preset.weights, presetKey);
    }
  };

  const handleSliderChange = (factor, value) => {
    const num = Number(value) / 100;
    const newWeights = { ...activeWeights, [factor]: num };
    onUpdateWeights(newWeights, 'custom');
  };

  // Convert weights to percentage for display
  const total = (activeWeights.urgency + activeWeights.importance + activeWeights.workload + activeWeights.difficulty) || 1;
  const pctUrgency = Math.round((activeWeights.urgency / total) * 100);
  const pctImportance = Math.round((activeWeights.importance / total) * 100);
  const pctWorkload = Math.round((activeWeights.workload / total) * 100);
  const pctDifficulty = Math.round((activeWeights.difficulty / total) * 100);

  return (
    <div className="prioritizer-view">
      {/* View Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sliders size={26} style={{ color: 'var(--primary)' }} />
          <span>PriorityFirst Transparent Prioritization Engine</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Multi-criteria decision analysis recommending the optimal order to tackle coursework, laboratory activities, and projects.
        </p>
      </div>

      {/* Model Controls Hero */}
      <div className="prioritizer-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Decision Weight Presets
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Choose a prioritization model or customize the factor weights below.
            </p>
          </div>

          <button 
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setShowFormulaDetails(prev => !prev)}
          >
            <HelpCircle size={15} />
            <span>{showFormulaDetails ? 'Hide Formula' : 'How It Works (Formula)'}</span>
          </button>
        </div>

        {/* Preset Buttons */}
        <div className="preset-pills-row">
          {Object.entries(PRESET_WEIGHTS).map(([key, preset]) => (
            <button
              key={key}
              className={`preset-pill ${weightPreset === key ? 'active' : ''}`}
              onClick={() => handleSelectPreset(key)}
            >
              {key === 'balanced' && <Target size={14} />}
              {key === 'urgent' && <Flame size={14} />}
              {key === 'deep_work' && <Brain size={14} />}
              {key === 'quick_wins' && <Zap size={14} />}
              <span>{preset.name}</span>
            </button>
          ))}
          {weightPreset === 'custom' && (
            <span className="preset-pill active">
              <Sliders size={14} />
              <span>Customized Weights</span>
            </span>
          )}
        </div>

        {/* Interactive Sliders */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          {/* Urgency */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--danger)' }}>Urgency (Deadlines)</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{pctUrgency}%</span>
            </div>
            <input 
              type="range"
              min="5"
              max="80"
              value={pctUrgency}
              onChange={(e) => handleSliderChange('urgency', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--danger)' }}
            />
          </div>

          {/* Importance */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Academic Importance</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{pctImportance}%</span>
            </div>
            <input 
              type="range"
              min="5"
              max="80"
              value={pctImportance}
              onChange={(e) => handleSliderChange('importance', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          {/* Workload */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--warning)' }}>Workload Pressure</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{pctWorkload}%</span>
            </div>
            <input 
              type="range"
              min="5"
              max="80"
              value={pctWorkload}
              onChange={(e) => handleSliderChange('workload', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--warning)' }}
            />
          </div>

          {/* Difficulty */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-purple, #a855f7)' }}>Difficulty / Complexity</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{pctDifficulty}%</span>
            </div>
            <input 
              type="range"
              min="5"
              max="80"
              value={pctDifficulty}
              onChange={(e) => handleSliderChange('difficulty', e.target.value)}
              style={{ width: '100%', accentColor: '#a855f7' }}
            />
          </div>
        </div>

        {/* Formula Explanation Card */}
        {showFormulaDetails && (
          <div className="formula-card">
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              Mathematical Prioritization Specification:
            </div>
            <p>
              Priority Score (0-100) = (Urgency × {pctUrgency}%) + (Importance × {pctImportance}%) + (Workload Pressure × {pctWorkload}%) + (Cognitive Difficulty × {pctDifficulty}%)
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <li><strong>Urgency ($S_u$):</strong> Proximity to due date and time. Overdue tasks are clamped to 100 to prevent missed responsibilities.</li>
              <li><strong>Workload Pressure ($S_w$):</strong> Evaluates task duration relative to the available time window before deadline ($E / H$).</li>
              <li><strong>Academic Importance ($S_i$):</strong> Discrete grade/strategic weight (Critical = 100, High = 75, Medium = 50, Low = 25).</li>
              <li><strong>Cognitive Difficulty ($S_d$):</strong> Rating from 1 (Very Easy) to 5 (Very Challenging), requiring fresh focus and early starts.</li>
            </ul>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.4rem' }}>
              Deterministic MCDA — No opaque machine learning. Completely verifiable and reproducible.
            </div>
          </div>
        )}
      </div>

      {/* Ranked Queue Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Ranked Task Order</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            ({activeRanked.length} active tasks)
          </span>
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Recommended execution sequence: Top to Bottom
        </span>
      </div>

      {/* Ranked Tasks List */}
      {activeRanked.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <CheckCircle2 size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--success)' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
            No Active Tasks to Prioritize!
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            All tasks are currently completed. Add new coursework or uncheck completed tasks to regenerate rankings.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeRanked.map((task, index) => {
            const p = task.priority || {};
            const isTopRank = index === 0;
            const isExpanded = expandedTaskId === task.id;

            return (
              <div 
                key={task.id}
                className={`glass-card ${isTopRank ? 'top-priority-border' : ''}`}
                style={{ 
                  padding: '1.25rem',
                  borderLeft: isTopRank ? '5px solid var(--danger)' : index === 1 ? '5px solid var(--warning)' : '1px solid var(--border-card)',
                  background: isTopRank ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.04) 0%, var(--bg-card) 100%)' : 'var(--bg-card)'
                }}
                id={`ranked-task-${task.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Left: Rank, Title, Category */}
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span 
                        className="rank-badge"
                        style={{ 
                          fontSize: '0.85rem',
                          padding: '3px 10px',
                          background: isTopRank ? 'var(--danger)' : (index === 1 ? 'var(--warning)' : 'rgba(255,255,255,0.1)'),
                          color: isTopRank || index === 1 ? '#ffffff' : 'var(--text-main)'
                        }}
                      >
                        Rank #{task.rank}
                      </span>

                      <span className={`category-badge category-${task.category ? task.category.split(' ')[0] : 'assignment'}`}>
                        {task.category}
                      </span>

                      <span className={`priority-score-badge ${p.priorityLevel ? p.priorityLevel.toLowerCase() : ''}`}>
                        Score: {p.score || 0}/100 ({p.priorityLevel || 'Low'})
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                      {task.title}
                    </h3>

                    {task.description && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', lineHeight: 1.45 }}>
                        {task.description}
                      </p>
                    )}

                    {/* Transparent Human Explanation Box */}
                    <div className="action-rationale" style={{ marginTop: '0.5rem' }}>
                      <strong>Priority Rationale:</strong> {p.explanation}
                    </div>
                  </div>

                  {/* Right: Scores Meter & Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', minWidth: '200px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                        onClick={() => onEditTask(task)}
                      >
                        Edit
                      </button>

                      <button 
                        className="btn-primary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                        onClick={() => onToggleComplete(task.id)}
                      >
                        <CheckCircle2 size={14} />
                        <span>Done</span>
                      </button>
                    </div>

                    {/* Criteria Subscore Bars */}
                    <div style={{ width: '100%', maxWidth: '240px', background: 'rgba(0,0,0,0.2)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Urgency</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{p.urgencyScore || 0}%</span>
                      </div>
                      <div className="priority-bar-meter" style={{ marginBottom: '6px' }}>
                        <div className="priority-bar-fill" style={{ width: `${p.urgencyScore || 0}%`, background: 'var(--danger)' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Workload</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{p.workloadScore || 0}%</span>
                      </div>
                      <div className="priority-bar-meter" style={{ marginBottom: '6px' }}>
                        <div className="priority-bar-fill" style={{ width: `${p.workloadScore || 0}%`, background: 'var(--warning)' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Importance</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{p.importanceScore || 0}%</span>
                      </div>
                      <div className="priority-bar-meter" style={{ marginBottom: '6px' }}>
                        <div className="priority-bar-fill" style={{ width: `${p.importanceScore || 0}%`, background: 'var(--primary)' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Difficulty</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{p.difficultyScore || 0}%</span>
                      </div>
                      <div className="priority-bar-meter">
                        <div className="priority-bar-fill" style={{ width: `${p.difficultyScore || 0}%`, background: '#a855f7' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meta details footer */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} style={{ color: p.isOverdue ? 'var(--danger)' : 'var(--text-muted)' }} />
                    <span style={{ color: p.isOverdue ? 'var(--danger)' : 'inherit', fontWeight: p.isOverdue ? 700 : 500 }}>
                      Deadline: {task.deadlineDate} ({task.deadlineTime || '23:59'})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Est: {task.estimatedHours}h</span>
                  </div>

                  <div>
                    <span>Difficulty: Level {task.difficulty}/5</span>
                  </div>

                  <div>
                    <span>Importance: {task.importance}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Section (Collapsed / Informational) */}
      {completedRanked.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Completed Tasks ({completedRanked.length}) — Excluded from Active Prioritization
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.65 }}>
            {completedRanked.map(task => (
              <div 
                key={task.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.65rem 1rem', 
                  background: 'rgba(0,0,0,0.1)', 
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                  <span style={{ textDecoration: 'line-through' }}>{task.title}</span>
                  <span className={`category-badge category-${task.category ? task.category.split(' ')[0] : 'assignment'}`}>
                    {task.category}
                  </span>
                </div>
                <button 
                  style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                  onClick={() => onToggleComplete(task.id)}
                >
                  Reopen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
