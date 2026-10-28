import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  LogIn, 
  UserPlus, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Mail, 
  X,
  User, 
  CheckCircle
} from 'lucide-react';
import { authService } from '../services/authService.js';
import { isCloudEnabled } from '../services/cloudSync.js';
import InstitutionFields from './InstitutionFields.jsx';
import PasswordStrength from './PasswordStrength.jsx';
import { checkPassword } from '../services/passwordPolicy.js';
import { defaultInstitutionType, isValidDepartment } from '../data/profileOptions.js';

export default function AuthView({ onAuthSuccess, recoveryMode = false, onRecoveryDone }) {
  const [mode, setMode] = useState(recoveryMode ? 'reset' : 'login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isSavingNewPassword, setIsSavingNewPassword] = useState(false);

  // Opened from a password-reset email link
  useEffect(() => {
    if (recoveryMode) setMode('reset');
  }, [recoveryMode]);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAcceptedTerms, setRegAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [regDepartment, setRegDepartment] = useState('');
  const [regInstitution, setRegInstitution] = useState('');
  const [regInstitutionId, setRegInstitutionId] = useState('');
  const [regInstitutionType, setRegInstitutionType] = useState('school');
  const [regClassification, setRegClassification] = useState('Student');
  const [regOtherDescription, setRegOtherDescription] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Status & Validation
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const goTo = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccessMessage('');
    setFieldErrors({});
  };

  // Send a password-reset email
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSendingReset(true);
    try {
      await authService.requestPasswordReset(resetEmail);
      setSuccessMessage(`If an account exists for ${resetEmail.trim()}, a reset link is on its way. Check your inbox (and spam folder).`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSendingReset(false);
    }
  };

  // Save the new password chosen after opening the reset link
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSavingNewPassword(true);
    try {
      await authService.completePasswordReset(newPassword, newPasswordConfirm);
      setNewPassword('');
      setNewPasswordConfirm('');
      onRecoveryDone?.();
      setMode('login');
      setSuccessMessage('Password updated! Sign in with your new password.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSavingNewPassword(false);
    }
  };

  // Handle Standard Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const errors = {};

    if (!loginEmail.trim()) {
      errors.email = 'Email address is required.';
    }
    if (!loginPassword) {
      errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoggingIn(true);
    try {
      // Real cryptographic verification
      const sessionUser = await authService.login(loginEmail, loginPassword);
      onAuthSuccess(sessionUser);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const errors = {};

    if (!regName.trim() || regName.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regEmail.trim() || !emailRegex.test(regEmail.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!checkPassword(regPassword, { email: regEmail, name: regName }).isValid) {
      errors.password = 'Your password does not meet all the requirements below.';
    }

    if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!regAcceptedTerms) {
      errors.terms = 'You must agree to the Terms and Conditions to create an account.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsRegistering(true);
    try {
      // Register with salted SHA-256 password hash
      const result = await authService.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        acceptedTerms: regAcceptedTerms,
        institution: regInstitution,
        institutionId: regInstitutionId,
        institutionType: regInstitutionType,
        department: regDepartment,
        classification: regClassification,
        otherDescription: regOtherDescription
      });

      // MANDATORY REQUIREMENT: Do NOT automatically log in after registration!
      // Display confirmation and switch to login page for manual authentication.
      setSuccessMessage(result.needsConfirmation
        ? result.message
        : 'Registration successful! Please enter your credentials to sign in.');
      setLoginEmail(regEmail);
      setLoginPassword('');
      setMode('login');
      
      // Clear registration form
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegDepartment('');
      setRegInstitution('');
      setRegInstitutionId('');
      setRegInstitutionType('school');
      setRegClassification('Student');
      setRegAcceptedTerms(false);
      setRegOtherDescription('');
      setFieldErrors({});
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
      <div 
        className="glass-card" 
        style={{ 
          maxWidth: '500px', 
          width: '100%', 
          borderRadius: '16px', 
          overflow: 'hidden',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border-card)'
        }}
      >
        {/* Brand Header */}
        <div style={{ padding: '2rem 2rem 1.25rem', textAlign: 'center', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: '44px', height: '44px', margin: '0 auto 0.75rem', borderRadius: '10px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: 'var(--brand-glow)' }}>
            <CheckCircle2 size={24} strokeWidth={2.5} />
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            PriorityFirst² <span className="brand-badge">PF²</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Task prioritization and scheduling for everyday life
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Register (hidden while setting a new password) */}
        {mode !== 'reset' && (
        <div style={{ padding: '1.25rem 2rem 0' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <button 
              className={`view-toggle-btn ${mode === 'login' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.55rem', textAlign: 'center', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}
              onClick={() => { setMode('login'); setError(''); setFieldErrors({}); }}
              id="tab-auth-login"
            >
              Sign In
            </button>
            <button 
              className={`view-toggle-btn ${mode === 'register' ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.55rem', textAlign: 'center', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}
              onClick={() => { setMode('register'); setError(''); setFieldErrors({}); }}
              id="tab-auth-register"
            >
              Register
            </button>
          </div>
        </div>
        )}

        {/* Success Alert Banner */}
        {successMessage && (
          <div style={{ margin: '1rem 2rem 0', padding: '0.75rem 1rem', background: 'var(--success-light)', border: '1px solid var(--success-border)', borderRadius: '8px', color: '#6ee7b7', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {error && (
          <div style={{ margin: '1rem 2rem 0', padding: '0.75rem 1rem', background: 'var(--danger-light)', border: '1px solid var(--danger-border)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div style={{ padding: '1.25rem 2rem 1.75rem' }}>
          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Email Field */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Academic Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    id="login-email"
                    type="email"
                    className="form-input"
                    placeholder="student@priorityfirst.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                  <Mail size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
              </div>

              {/* Password Field with Show/Hide toggle */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                  <label className="form-label" htmlFor="login-password">
                    Password
                  </label>
                  <button
                    type="button"
                    className="terms-link"
                    style={{ fontSize: '0.8rem' }}
                    id="btn-forgot-password"
                    onClick={() => { setResetEmail(loginEmail); goTo('forgot'); }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowLoginPassword(p => !p)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
              </div>

              {/* Sign In Submit Button */}
              <button 
                type="submit" 
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '15px' }}
                disabled={isLoggingIn}
                id="btn-login-submit"
              >
                <LogIn size={16} />
                <span>{isLoggingIn ? 'Authenticating...' : 'Sign In'}</span>
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
                <button 
                  type="button" 
                  style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
                  onClick={() => { setMode('register'); setError(''); setSuccessMessage(''); setFieldErrors({}); }}
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD: request a reset link */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>Reset your password</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Enter the email you registered with and we'll send you a link to set a new password.
                </p>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-email"
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                  <Mail size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '15px' }}
                disabled={isSendingReset}
                id="btn-send-reset"
              >
                <Mail size={16} />
                <span>{isSendingReset ? 'Sending…' : 'Send Reset Link'}</span>
              </button>
              <div style={{ textAlign: 'center', fontSize: '0.825rem' }}>
                <button type="button" className="terms-link" onClick={() => goTo('login')}>Back to Sign In</button>
              </div>
            </form>
          )}

          {/* SET NEW PASSWORD: opened from the reset email link */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>Set a new password</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Choose a new password for your account.
                </p>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  className="form-input"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-password-confirm">Confirm New Password</label>
                <input
                  id="new-password-confirm"
                  type="password"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <PasswordStrength password={newPassword} confirmPassword={newPasswordConfirm} />
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '15px' }}
                disabled={isSavingNewPassword}
                id="btn-save-new-password"
              >
                <span>{isSavingNewPassword ? 'Saving…' : 'Save New Password'}</span>
              </button>
              <div style={{ textAlign: 'center', fontSize: '0.825rem' }}>
                <button type="button" className="terms-link" onClick={() => { onRecoveryDone?.(); goTo('login'); }}>
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* REGISTRATION FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">
                  Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    id="reg-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Maria Santos"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    autoFocus
                  />
                  <User size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">
                  Email <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    id="reg-email"
                    type="email"
                    className="form-input"
                    placeholder="maria@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <Mail size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-classification">
                  Primary classification
                </label>
                <select
                  id="reg-classification"
                  className="form-select"
                  value={regClassification}
                  onChange={(e) => {
                    const next = e.target.value;
                    setRegClassification(next);
                    // Suggest the usual institution type and drop a course/sport that no longer fits
                    if (!regInstitution) setRegInstitutionType(defaultInstitutionType(next));
                    if (!isValidDepartment(regDepartment, regInstitutionType, next)) setRegDepartment('');
                  }}
                >
                  <option value="Student">Student</option>
                  <option value="Professional">Professional</option>
                  <option value="Worker">Worker</option>
                  <option value="Athlete">Athlete</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <InstitutionFields
                idPrefix="reg"
                classification={regClassification}
                value={{
                  institutionType: regInstitutionType,
                  institution: regInstitution,
                  institutionId: regInstitutionId,
                  department: regDepartment
                }}
                onChange={(next) => {
                  setRegInstitutionType(next.institutionType);
                  setRegInstitution(next.institution);
                  setRegInstitutionId(next.institutionId);
                  setRegDepartment(next.department);
                }}
              />

              {regClassification === 'Other' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-other-description">Tell us more (optional)</label>
                  <input
                    id="reg-other-description"
                    type="text"
                    className="form-input"
                    placeholder="How would you describe your role?"
                    value={regOtherDescription}
                    onChange={(e) => setRegOtherDescription(e.target.value)}
                  />
                </div>
              )}

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">
                    Password <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Min. 8 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowRegPassword(p => !p)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                      aria-label="Toggle password visibility"
                    >
                      {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-confirm-password">
                    Confirm Password <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input 
                    id="reg-confirm-password"
                    type={showRegPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Re-enter password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  {fieldErrors.confirmPassword && <span className="form-error">{fieldErrors.confirmPassword}</span>}
                </div>
              </div>

              <PasswordStrength
                password={regPassword}
                confirmPassword={regConfirmPassword}
                email={regEmail}
                name={regName}
              />

              <div className="form-group">
                <label className="terms-check" htmlFor="reg-accept-terms">
                  <input
                    id="reg-accept-terms"
                    type="checkbox"
                    checked={regAcceptedTerms}
                    onChange={(e) => {
                      setRegAcceptedTerms(e.target.checked);
                      if (e.target.checked) setFieldErrors(prev => ({ ...prev, terms: undefined }));
                    }}
                  />
                  <span>
                    I agree to the{' '}
                    <button type="button" className="terms-link" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>
                      Terms and Conditions
                    </button>
                    .
                  </span>
                </label>
                {fieldErrors.terms && <span className="form-error">{fieldErrors.terms}</span>}
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '15px' }}
                disabled={isRegistering}
                id="btn-register-submit"
              >
                <UserPlus size={16} />
                <span>{isRegistering ? 'Registering...' : 'Create Account'}</span>
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                Already registered?{' '}
                <button 
                  type="button" 
                  style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
                  onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); setFieldErrors({}); }}
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>

      </div>

      {showTerms && (
        <div className="modal-overlay" onClick={() => setShowTerms(false)} role="dialog" aria-modal="true" aria-labelledby="terms-title">
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" id="terms-title">Terms and Conditions</h2>
              <button className="action-icon-btn" onClick={() => setShowTerms(false)} aria-label="Close terms">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body terms-body">
              <p>By creating a PriorityFirst² account, you agree to the following:</p>
              <h4>1. Your account</h4>
              <p>You are responsible for keeping your password private and for all activity under your account. Give accurate information when registering and keep it up to date.</p>
              <h4>2. Acceptable use</h4>
              <ul>
                <li>Use PriorityFirst² only for planning and managing your own tasks and schedule.</li>
                <li>Do not try to access other users' accounts or data, or disrupt the service.</li>
                <li>Do not upload offensive, illegal, or misleading content, including profile pictures.</li>
              </ul>
              <h4>3. Your data</h4>
              <p>Your profile, tasks, and settings are stored to provide the service{isCloudEnabled ? ' and are saved to your cloud account so you can use them on any device' : ' on this device'}. Only you can see your tasks. You can export or delete your tasks at any time in Settings.</p>
              <h4>4. Recommendations</h4>
              <p>Task priorities and schedules are suggestions to help you plan. You remain responsible for meeting your own deadlines and commitments.</p>
              <h4>5. Changes and termination</h4>
              <p>These terms may be updated as the service improves. Accounts that break these terms may be suspended.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowTerms(false)}>Close</button>
              <button
                type="button"
                className="btn-primary"
                id="btn-accept-terms"
                onClick={() => {
                  setRegAcceptedTerms(true);
                  setFieldErrors(prev => ({ ...prev, terms: undefined }));
                  setShowTerms(false);
                }}
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
