/**
 * PriorityFirst² — Shared input validation (regex).
 * Used by both the forms (live messages) and the services (final check before saving).
 */

// Full name: letters in any language (ñ, é, ü…), single spaces between words, and
// hyphens / apostrophes / periods inside names: "Juan Dela Cruz Jr.", "Ma. Clara O'Neil-Santos"
export const NAME_REGEX = /^(?=.{2,60}$)\p{L}+(?:['.-]\p{L}+)*\.?(?: \p{L}+(?:['.-]\p{L}+)*\.?)*$/u;

// Email: name@domain.tld — no spaces, no ".." , no dot at the start/end of the name part,
// domain labels of letters/numbers/hyphens and a 2+ letter ending
export const EMAIL_REGEX = /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

// Password: 8–128 chars with a lowercase letter, an uppercase letter, a number and a symbol,
// and no space at the start or end
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S(?:.{6,126})\S$/;

// Task title: 2–120 chars, must include a letter or number (no symbol-only titles like "!!!")
export const TASK_TITLE_REGEX = /^(?=.{2,120}$)(?=.*[\p{L}\p{N}])[^\p{Cc}]+$/u;

// No control characters (hidden characters pasted from other apps); newlines allowed in long text
export const SAFE_TEXT_REGEX = /^[^\p{Cc}]*$/u;
export const SAFE_MULTILINE_REGEX = /^(?:[^\p{Cc}]|[\n\r\t])*$/u;

// The same character repeated 6+ times in a row ("aaaaaa", "!!!!!!") is treated as junk
export const REPEATED_JUNK_REGEX = /(.)\1{5,}/u;

export const LIMITS = {
  description: 500,
  notes: 2000,
  otherDescription: 80
};

/** Tidies a name before checking: trims and collapses repeated spaces */
export const cleanName = (value) => String(value || '').trim().replace(/\s+/g, ' ');

export function validateName(value) {
  const name = cleanName(value);
  if (name.length < 2) return 'Full name must be at least 2 characters.';
  if (name.length > 60) return 'Full name must be 60 characters or less.';
  if (/\d/.test(name)) return 'Full name cannot contain numbers.';
  if (!NAME_REGEX.test(name)) return 'Use letters only, with spaces, hyphens (-), apostrophes (\') or periods (.) between names.';
  if (REPEATED_JUNK_REGEX.test(name)) return 'Please enter your real full name.';
  return '';
}

export function validateEmail(value) {
  const email = String(value || '').trim();
  if (!email) return 'Please enter your email address.';
  if (/\s/.test(email)) return 'Email address cannot contain spaces.';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address, like name@example.com.';
  return '';
}

export function validateTaskTitle(value) {
  const title = String(value || '').trim();
  if (!title) return 'Title is required.';
  if (title.length < 2) return 'Title must be at least 2 characters.';
  if (title.length > 120) return 'Title must be 120 characters or less.';
  if (!TASK_TITLE_REGEX.test(title)) return 'Title must include letters or numbers, not only symbols.';
  if (REPEATED_JUNK_REGEX.test(title)) return 'Title looks like repeated characters. Please describe the task.';
  return '';
}

export function validateLongText(value, label, maxLength, { multiline = true } = {}) {
  const text = String(value || '');
  if (text.trim().length > maxLength) return `${label} must be ${maxLength} characters or less.`;
  if (!(multiline ? SAFE_MULTILINE_REGEX : SAFE_TEXT_REGEX).test(text)) return `${label} contains hidden characters. Please retype it.`;
  return '';
}
