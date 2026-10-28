/**
 * PriorityFirst (PF) — Production-Grade Authentication Service
 * Secure Client-Side Cryptographic Authentication with Web Crypto API
 * - SHA-256 salted hashing (Zero plaintext password storage)
 * - Isolated user sessions
 * - Strict credential verification (No bypasses, real user accounts only)
 * When Supabase is configured, accounts live in Supabase Auth (see cloudAuth below)
 * and this file's local-account code is only used as an offline fallback.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isVerifiedInstitutionId, isOfficialSchool } from './institutionService';
import { INSTITUTION_TYPES, isValidDepartment } from '../data/profileOptions';
import { assertStrongPassword } from './passwordPolicy';
import { validateName, validateEmail, validateLongText, cleanName as tidyName, LIMITS } from './validation';

// Throws the validator's message, if any
function assertValid(message) {
  if (message) throw new Error(message);
}

const AUTH_SESSION_KEY = 'priorityfirst_session_v2';
const USERS_STORAGE_KEY = 'priorityfirst_users_v2';
const CLASSIFICATIONS = ['Student', 'Professional', 'Worker', 'Athlete', 'Other'];

// Institution and department are optional, but when given they must come from the verified
// lists and belong together: a CHED school for "school", a Wikidata entry for the other types,
// and a course/department from that type's list
async function checkInstitutionFields({ institution, institutionId, institutionType, department, classification }) {
  const name = (institution || '').trim();
  if (name) {
    if (!INSTITUTION_TYPES.some(t => t.value === institutionType) || !isVerifiedInstitutionId(institutionId)) {
      throw new Error('Please pick your institution from the search results so it can be verified, or leave it blank.');
    }
    const isSchoolId = institutionId.startsWith('CHED-');
    if (isSchoolId !== (institutionType === 'school')) {
      throw new Error('The institution does not match the selected institution type. Please pick it again.');
    }
    if (isSchoolId && !(await isOfficialSchool(institutionId, name))) {
      throw new Error('This school is not on the official CHED list. Please pick it again from the search results.');
    }
  }
  if (!isValidDepartment((department || '').trim(), institutionType, classification)) {
    throw new Error('Please choose your course / department from the list.');
  }
}

function saveSession(user) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
  return user;
}

function friendlyAuthError(error) {
  const message = error?.message || '';
  if (/invalid login credentials/i.test(message)) return 'Invalid email or password. Please verify your credentials.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first. Check your inbox for the confirmation link.';
  if (/already registered|already exists/i.test(message)) return 'An account with this email address already exists. Please sign in instead.';
  if (/failed to fetch|network/i.test(message)) return 'Cannot reach the server. Check your internet connection and try again.';
  if (/schema cache|does not exist|PGRST20\d|42703/i.test(`${message} ${error?.code || ''}`)) {
    return 'The cloud database needs an update. Run the latest file in supabase/migrations in the Supabase SQL Editor, then try again.';
  }
  return message || 'Something went wrong. Please try again.';
}

function profileToSessionUser(authUser, profile) {
  const classification = profile?.classification || 'Student';
  return {
    id: authUser.id,
    name: profile?.display_name || authUser.user_metadata?.display_name || authUser.email.split('@')[0],
    email: authUser.email,
    institution: profile?.institution || '',
    institutionId: profile?.institution_id || '',
    institutionType: profile?.institution_type || '',
    department: profile?.department || '',
    role: classification,
    classification,
    otherDescription: profile?.other_description || '',
    avatar: profile?.avatar || '',
    pendingEmail: authUser.new_email || '',
    createdAt: authUser.created_at || '',
    loginTimestamp: new Date().toISOString()
  };
}

// Supabase-backed accounts: profile data is saved in the cloud and works on any device
const cloudAuth = {
  async loadProfile(authUser) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    if (error) throw new Error(friendlyAuthError(error));
    if (data) return data;

    // Profile row missing (e.g. created before the sign-up trigger existed): create it now
    const meta = authUser.user_metadata || {};
    const fresh = {
      id: authUser.id,
      display_name: meta.display_name || authUser.email.split('@')[0],
      classification: CLASSIFICATIONS.includes(meta.classification) ? meta.classification : 'Student',
      other_description: meta.other_description || '',
      institution: meta.institution_id ? (meta.institution || '') : '',
      institution_id: meta.institution_id || null,
      institution_type: meta.institution_type || '',
      department: meta.department || ''
    };
    let inserted = await supabase.from('profiles').insert(fresh).select().single();
    if (inserted.error && /institution_(id|type)|schema cache|42703|PGRST204/i.test(`${inserted.error.message} ${inserted.error.code}`)) {
      // Database not yet updated with the institution columns: create the profile without them
      const { institution_id: _id, institution_type: _type, ...withoutInstitutionColumns } = fresh;
      inserted = await supabase.from('profiles').insert({ ...withoutInstitutionColumns, institution: '' }).select().single();
    }
    if (inserted.error) throw new Error(friendlyAuthError(inserted.error));
    return inserted.data;
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyAuthError(error));
    const profile = await this.loadProfile(data.user);
    return saveSession(profileToSessionUser(data.user, profile));
  },

  async register({ name, email, password, acceptedTermsAt, institution, institutionId, institutionType, department, classification, otherDescription }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: name,
          accepted_terms_at: acceptedTermsAt,
          classification,
          other_description: otherDescription,
          institution,
          institution_id: institutionId || null,
          institution_type: institutionType || '',
          department
        }
      }
    });
    if (error) throw new Error(friendlyAuthError(error));
    // Supabase hides duplicate sign-ups by returning a user with no identities
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    const needsConfirmation = !data.session;
    if (data.session) {
      // Keep the existing flow: users sign in explicitly after registering
      await supabase.auth.signOut();
    }
    return {
      success: true,
      needsConfirmation,
      message: needsConfirmation
        ? 'Account created! Check your email and click the confirmation link, then sign in.'
        : 'Account created successfully! Please sign in with your credentials.',
      email
    };
  },

  async restoreSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
    try {
      const profile = await this.loadProfile(data.session.user);
      return saveSession(profileToSessionUser(data.session.user, profile));
    } catch {
      // Offline: keep using the cached profile
      return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || 'null');
    }
  },

  async updateProfile(user, fields) {
    const baseFields = {
      display_name: fields.name,
      institution: fields.institution,
      department: fields.department,
      classification: fields.classification,
      other_description: fields.otherDescription
    };
    let { error } = await supabase.from('profiles').update({
      ...baseFields,
      institution_id: fields.institutionId || null,
      institution_type: fields.institutionType || ''
    }).eq('id', user.id);

    // Database not yet updated with the institution columns: profiles without an
    // institution can still be saved; ones with an institution need the update
    const missingColumns = error && /institution_(id|type)|schema cache|42703|PGRST204/i.test(`${error.message} ${error.code}`);
    if (missingColumns && !fields.institution) {
      ({ error } = await supabase.from('profiles').update(baseFields).eq('id', user.id));
    }
    if (error) throw new Error(friendlyAuthError(error));

    let pendingEmail = user.pendingEmail || '';
    if (fields.email !== user.email) {
      const res = await supabase.auth.updateUser({ email: fields.email }, { emailRedirectTo: window.location.origin });
      if (res.error) throw new Error(friendlyAuthError(res.error));
      pendingEmail = fields.email;
    }

    return saveSession({
      ...user,
      name: fields.name,
      institution: fields.institution,
      institutionId: fields.institutionId,
      institutionType: fields.institutionType,
      department: fields.department,
      role: fields.classification,
      classification: fields.classification,
      otherDescription: fields.otherDescription,
      pendingEmail
    });
  },

  async updateAvatar(user, avatar) {
    const { error } = await supabase.from('profiles').update({ avatar }).eq('id', user.id);
    if (error) throw new Error(friendlyAuthError(error));
    return saveSession({ ...user, avatar });
  },

  async changePassword(user, currentPassword, newPassword) {
    const check = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (check.error) throw new Error('Current password is incorrect.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(friendlyAuthError(error));
  }
};

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

    assertValid(validateEmail(cleanEmail));
    if (!cleanPassword) {
      throw new Error('Please enter your password.');
    }

    if (isSupabaseConfigured) {
      return cloudAuth.login(cleanEmail, cleanPassword);
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
      institutionId: userRecord.institutionId || '',
      institutionType: userRecord.institutionType || '',
      department: userRecord.department || '',
      role: userRecord.classification || userRecord.role || 'Student',
      classification: userRecord.classification || userRecord.role || 'Student',
      otherDescription: userRecord.otherDescription || '',
      avatar: userRecord.avatar || '',
      createdAt: userRecord.createdAt || '',
      loginTimestamp: new Date().toISOString()
    };

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  /**
   * Register a new student account
   * MANDATORY: Does NOT automatically log the user in.
   */
  async register({ name, email, password, confirmPassword, acceptedTerms = false, institution = '', institutionId = '', institutionType = '', department = '', classification = 'Student', otherDescription = '' }) {
    await this.init();

    const cleanName = tidyName(name);
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanConfirm = (confirmPassword || '').trim();

    assertValid(validateName(cleanName));
    assertValid(validateEmail(cleanEmail));
    assertValid(otherDescription ? validateLongText(otherDescription, 'Role description', LIMITS.otherDescription, { multiline: false }) : '');

    assertStrongPassword(password || '', { email: cleanEmail, name: cleanName });

    if (cleanPassword !== cleanConfirm) {
      throw new Error('Passwords do not match. Please re-type your password confirmation.');
    }

    if (!acceptedTerms) {
      throw new Error('You must agree to the Terms and Conditions to create an account.');
    }
    const acceptedTermsAt = new Date().toISOString();

    await checkInstitutionFields({ institution, institutionId, institutionType, department, classification });

    if (isSupabaseConfigured) {
      return cloudAuth.register({
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        acceptedTermsAt,
        institution: institution.trim(),
        institutionId,
        institutionType: institution.trim() ? institutionType : '',
        department: department.trim(),
        classification: CLASSIFICATIONS.includes(classification) ? classification : 'Other',
        otherDescription: otherDescription.trim()
      });
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
      institutionId: institution.trim() ? institutionId : '',
      institutionType: institution.trim() ? institutionType : '',
      department: department.trim(),
      acceptedTermsAt,
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
  async updateProfile(userId, { name, email, institution = '', institutionId = '', institutionType = '', department = '', classification = 'Student', otherDescription = '' }) {
    const cleanName = tidyName(name);
    const cleanEmail = (email || '').trim().toLowerCase();

    assertValid(validateName(cleanName));
    assertValid(validateEmail(cleanEmail));
    assertValid(otherDescription ? validateLongText(otherDescription, 'Role description', LIMITS.otherDescription, { multiline: false }) : '');
    await checkInstitutionFields({ institution, institutionId, institutionType, department, classification });

    if (isSupabaseConfigured) {
      const cloudClassification = CLASSIFICATIONS.includes(classification) ? classification : 'Other';
      return cloudAuth.updateProfile(this.getCurrentUser(), {
        name: cleanName,
        email: cleanEmail,
        institution: institution.trim(),
        institutionId: institution.trim() ? institutionId : '',
        institutionType: institution.trim() ? institutionType : '',
        department: department.trim(),
        classification: cloudClassification,
        otherDescription: cloudClassification === 'Other' ? otherDescription.trim() : ''
      });
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
      institutionId: institution.trim() ? institutionId : '',
      institutionType: institution.trim() ? institutionType : '',
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
      institutionId: users[index].institutionId,
      institutionType: users[index].institutionType,
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
  async updateAvatar(userId, avatar = '') {
    if (isSupabaseConfigured) {
      return cloudAuth.updateAvatar(this.getCurrentUser(), avatar);
    }

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
    const sessionUser = this.getCurrentUser() || {};
    assertStrongPassword(newPassword || '', { email: sessionUser.email || '', name: sessionUser.name || '' });

    if (isSupabaseConfigured) {
      const cleanNew = (newPassword || '').trim();
      if (cleanNew !== (confirmPassword || '').trim()) {
        throw new Error('New passwords do not match.');
      }
      return cloudAuth.changePassword(this.getCurrentUser(), (currentPassword || '').trim(), cleanNew);
    }

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
    if (isSupabaseConfigured) {
      supabase.auth.signOut();
    }
  },

  /**
   * Emails a password-reset link (cloud accounts). The reply is the same whether or not
   * the email has an account, so the form can't be used to discover who is registered.
   */
  async requestPasswordReset(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (validateEmail(cleanEmail)) {
      throw new Error('Please enter the email address you registered with, like name@example.com.');
    }
    if (!isSupabaseConfigured) {
      throw new Error('Password reset by email needs a cloud account. Accounts saved only on this device cannot be reset.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: window.location.origin });
    if (error && !/rate limit|security purposes/i.test(error.message)) {
      throw new Error(friendlyAuthError(error));
    }
    if (error) {
      throw new Error('Too many reset requests. Please wait a minute and try again.');
    }
  },

  /**
   * Sets a new password after the user opens the reset link from their email
   */
  async completePasswordReset(newPassword, confirmPassword) {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      throw new Error('This reset link has expired. Please request a new one.');
    }
    assertStrongPassword(newPassword || '', { email: user.email, name: user.user_metadata?.display_name || '' });
    if ((newPassword || '').trim() !== (confirmPassword || '').trim()) {
      throw new Error('New passwords do not match.');
    }
    const { error } = await supabase.auth.updateUser({ password: (newPassword || '').trim() });
    if (error) throw new Error(friendlyAuthError(error));
    // Sign out of the temporary reset session so the user signs in with the new password
    await supabase.auth.signOut();
    localStorage.removeItem(AUTH_SESSION_KEY);
  },

  /**
   * Calls onRecovery() when the app was opened from a password-reset email link
   */
  onPasswordRecovery(onRecovery) {
    if (!isSupabaseConfigured) return () => {};
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') onRecovery();
    });
    return () => data.subscription.unsubscribe();
  },

  /**
   * Re-checks the saved session on app start (cloud accounts only).
   * Returns the fresh user, or null if the session has ended.
   */
  async restoreSession() {
    if (!isSupabaseConfigured) return this.getCurrentUser();
    return cloudAuth.restoreSession();
  },

  /**
   * Finds tasks saved in this browser by a local (pre-cloud) account with this email
   */
  getLocalTasksForEmail(email) {
    const localUser = this.getRegisteredUsers().find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!localUser) return { localUser: null, tasks: [] };
    try {
      const tasks = JSON.parse(localStorage.getItem(`priorityfirst_tasks_${localUser.id}_v1`) || '[]');
      return { localUser, tasks: Array.isArray(tasks) ? tasks : [] };
    } catch {
      return { localUser, tasks: [] };
    }
  }
};

// Auto-run init to ensure test user exists in storage
if (typeof window !== 'undefined') {
  authService.init();
}
