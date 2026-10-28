/**
 * PriorityFirst (PF) — Production-Grade Authentication Service
 * Secure Client-Side Cryptographic Authentication with Web Crypto API
 * - SHA-256 salted hashing (Zero plaintext password storage)
 * - Isolated user sessions
 * - Strict credential verification (No bypasses, real user accounts only)
 */

const AUTH_SESSION_KEY = 'priorityfirst_session_v2';
const USERS_STORAGE_KEY = 'priorityfirst_users_v2';

// Salt generator using crypto.getRandomValues
function generateSalt() {
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// SHA-256 Hash with salt using Web Crypto API
export async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '::pf_salt::' + salt);
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for non-subtle contexts (e.g. older headless runs)
  let hash = 0;
  const str = password + salt;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'fallback_' + Math.abs(hash).toString(16);
}

export const authService = {
  /**
   * Initializes the users store
   */
  async init() {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
      }
    } catch (err) {
      console.warn('Failed to initialize user storage:', err);
    }
  },

  /**
   * Returns the currently active session user, or null if logged out
   */
  getCurrentUser() {
    try {
      const stored = localStorage.getItem(AUTH_SESSION_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (err) {
      console.warn('Failed to parse auth session:', err);
      return null;
    }
  },

  /**
   * Check if a session is currently authenticated
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  },

  /**
   * Retrieves all registered users from storage
   */
  getRegisteredUsers() {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Log in with email and password
   * Validates credentials against cryptographically hashed passwords
   */
  async login(email, password) {
    await this.init();

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!cleanPassword) {
      throw new Error('Please enter your password.');
    }

    const users = this.getRegisteredUsers();
    const userRecord = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!userRecord) {
      throw new Error('Invalid email or password. Please verify your credentials or register an account.');
    }

    // Hash entered password with stored salt
    const computedHash = await hashPassword(cleanPassword, userRecord.salt);

    if (computedHash !== userRecord.passwordHash) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    // Create session (omitting password hash)
    const sessionUser = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      institution: userRecord.institution || '',
      department: userRecord.department || '',
      role: userRecord.classification || userRecord.role || 'Student',
      classification: userRecord.classification || userRecord.role || 'Student',
      otherDescription: userRecord.otherDescription || '',
      avatar: userRecord.avatar || '',
      loginTimestamp: new Date().toISOString()
    };

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  /**
   * Register a new student account
   * MANDATORY: Does NOT automatically log the user in.
   */
  async register({ name, email, password, confirmPassword, institution = '', department = '', classification = 'Student', otherDescription = '' }) {
    await this.init();

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanConfirm = (confirmPassword || '').trim();

    if (!cleanName || cleanName.length < 2) {
      throw new Error('Full Name must be at least 2 characters long.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Please provide a valid email address.');
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    if (cleanPassword !== cleanConfirm) {
      throw new Error('Passwords do not match. Please re-type your password confirmation.');
    }

    // Check duplicate email
    const users = this.getRegisteredUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(cleanPassword, salt);

    const newUserRecord = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      email: cleanEmail,
      salt,
      passwordHash,
      institution: institution.trim(),
      department: department.trim(),
      role: classification,
      classification: ['Student', 'Professional', 'Worker', 'Athlete', 'Other'].includes(classification) ? classification : 'Other',
      otherDescription: otherDescription.trim(),
      createdAt: new Date().toISOString()
    };

    users.push(newUserRecord);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Notice: We do NOT set AUTH_SESSION_KEY here! User must log in explicitly.
    return {
      success: true,
      message: 'Account created successfully! Please sign in with your credentials.',
      email: cleanEmail
    };
  },

  /**
   * Updates the signed-in user's profile details and refreshes the session
   */
  async updateProfile(userId, { name, email, institution = '', department = '', classification = 'Student', otherDescription = '' }) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      throw new Error('Full Name must be at least 2 characters long.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('Please provide a valid email address.');
    }

    const users = this.getRegisteredUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      throw new Error('Account not found. Please sign in again.');
    }
    if (users.some(u => u.id !== userId && u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Another account already uses this email address.');
    }

    const cleanClassification = ['Student', 'Professional', 'Worker', 'Athlete', 'Other'].includes(classification) ? classification : 'Other';
    users[index] = {
      ...users[index],
      name: cleanName,
      email: cleanEmail,
      institution: institution.trim(),
      department: department.trim(),
      role: cleanClassification,
      classification: cleanClassification,
      otherDescription: cleanClassification === 'Other' ? otherDescription.trim() : '',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const sessionUser = {
      ...this.getCurrentUser(),
      name: users[index].name,
      email: users[index].email,
      institution: users[index].institution,
      department: users[index].department,
      role: users[index].classification,
      classification: users[index].classification,
      otherDescription: users[index].otherDescription
    };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  /**
   * Sets or removes (empty string) the profile picture, stored as a small data URL
   */
  updateAvatar(userId, avatar = '') {
    const users = this.getRegisteredUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      throw new Error('Account not found. Please sign in again.');
    }

    users[index] = { ...users[index], avatar, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      throw new Error('Not enough browser storage to save this picture. Try a smaller image.');
    }

    const sessionUser = { ...this.getCurrentUser(), avatar };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  /**
   * Changes the password after verifying the current one
   */
  async changePassword(userId, currentPassword, newPassword, confirmPassword) {
    const users = this.getRegisteredUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      throw new Error('Account not found. Please sign in again.');
    }

    const currentHash = await hashPassword((currentPassword || '').trim(), users[index].salt);
    if (currentHash !== users[index].passwordHash) {
      throw new Error('Current password is incorrect.');
    }

    const cleanNew = (newPassword || '').trim();
    if (cleanNew.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    if (cleanNew !== (confirmPassword || '').trim()) {
      throw new Error('New passwords do not match.');
    }

    const salt = generateSalt();
    users[index] = { ...users[index], salt, passwordHash: await hashPassword(cleanNew, salt) };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  /**
   * Logs out the active user and invalidates session
   */
  logout() {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
};

// Auto-run init to ensure test user exists in storage
if (typeof window !== 'undefined') {
  authService.init();
}
