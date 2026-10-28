import React from 'react';
import { Check, X } from 'lucide-react';
import { checkPassword } from '../services/passwordPolicy';

const LEVEL_COLORS = ['var(--danger)', 'var(--danger)', 'var(--warning)', '#3b82f6', 'var(--success)'];

/**
 * Live strength meter and rule checklist shown while a new password is typed
 */
export default function PasswordStrength({ password, email = '', name = '', confirmPassword }) {
  if (!password) return null;
  const check = checkPassword(password, { email, name });
  const color = LEVEL_COLORS[check.score];

  return (
    <div className="password-strength" aria-live="polite" id="password-strength">
      <div className="password-meter" role="meter" aria-valuemin={0} aria-valuemax={4} aria-valuenow={check.score} aria-label="Password strength">
        {[0, 1, 2, 3].map(i => (
          <span key={i} style={{ background: i < Math.max(1, check.score) ? color : undefined }} />
        ))}
      </div>
      <div className="password-strength-label" style={{ color }}>
        Strength: <strong>{check.label}</strong>
      </div>

      <ul className="password-rules">
        {check.results.map(rule => (
          <li key={rule.id} className={rule.passed ? 'passed' : ''}>
            {rule.passed ? <Check size={13} /> : <X size={13} />}
            <span>{rule.label}</span>
          </li>
        ))}
        {check.hasPersonalInfo && (
          <li className="warning"><X size={13} /><span>Don't use your name or email</span></li>
        )}
        {check.isCommon && (
          <li className="warning"><X size={13} /><span>Too common — easy to guess</span></li>
        )}
        {confirmPassword !== undefined && confirmPassword.length > 0 && (
          <li className={confirmPassword === password ? 'passed' : 'warning'}>
            {confirmPassword === password ? <Check size={13} /> : <X size={13} />}
            <span>{confirmPassword === password ? 'Passwords match' : 'Passwords do not match'}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
