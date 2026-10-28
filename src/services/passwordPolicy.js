/**
 * PriorityFirst² — Password policy for new accounts and password changes.
 * Existing passwords keep working at sign-in; the rules apply whenever a password is set.
 */
import { PASSWORD_REGEX } from './validation';

export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A–Z)', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lower', label: 'One lowercase letter (a–z)', test: (pw) => /[a-z]/.test(pw) },
  { id: 'number', label: 'One number (0–9)', test: (pw) => /\d/.test(pw) },
  { id: 'symbol', label: 'One symbol (e.g. ! @ # $ %)', test: (pw) => /[^A-Za-z0-9\s]/.test(pw) },
  { id: 'spaces', label: 'No spaces at the start or end', test: (pw) => pw.length > 0 && pw === pw.trim() }
];

// Common passwords that pass the character rules but are easy to guess
const COMMON_WORDS = /(password|passw0rd|p@ssw|qwerty|asdfgh|123456|abcdef|iloveyou|letmein|welcome)/;
const COMMON_PASSWORDS = ['password1!', 'p@ssw0rd', 'p@ssword1', 'qwerty123!', 'welcome1!', 'admin123!', 'iloveyou1!', 'abc123!@#', 'passw0rd!'];

export function checkPassword(password = '', { email = '', name = '' } = {}) {
  const results = PASSWORD_RULES.map(rule => ({ ...rule, passed: rule.test(password) }));
  const passedCount = results.filter(r => r.passed).length;

  const lower = password.toLowerCase();
  const personal = [email.split('@')[0], ...name.split(/\s+/)]
    .map(part => part.toLowerCase())
    .filter(part => part.length >= 3);
  const isCommon = COMMON_PASSWORDS.includes(lower) || COMMON_WORDS.test(lower);
  const hasPersonalInfo = personal.some(part => lower.includes(part));

  // A password that can't be used never looks better than Fair
  const missing = results.length - passedCount;
  let score;
  if (missing === 0) score = password.length >= 12 ? 4 : 3;  // Strong / Good
  else if (missing === 1) score = 2;                          // Fair
  else score = password.length > 0 ? 1 : 0;                   // Weak
  if (isCommon || hasPersonalInfo) score = Math.min(score, 1);
  const allRulesPass = missing === 0;

  return {
    results,
    isCommon,
    hasPersonalInfo,
    score,
    label: ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][score],
    isValid: allRulesPass && PASSWORD_REGEX.test(password) && !isCommon && !hasPersonalInfo
  };
}

/**
 * Throws a readable error if the password doesn't meet the policy
 */
export function assertStrongPassword(password, context) {
  const check = checkPassword(password, context);
  if (check.isValid) return;
  if (check.isCommon) throw new Error('This password is too common. Please choose a less predictable one.');
  if (check.hasPersonalInfo) throw new Error('Your password should not contain your name or email.');
  const missing = check.results.filter(r => !r.passed).map(r => r.label.toLowerCase());
  throw new Error(`Password needs: ${missing.join(', ')}.`);
}
