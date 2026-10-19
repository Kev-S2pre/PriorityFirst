import React, { useState } from 'react';
import { 
  CheckCircle2, 
  LogIn, 
  UserPlus, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  KeyRound,
  CheckCircle
} from 'lucide-react';
import { authService, VERIFIED_TEST_ACCOUNT } from '../services/authService.js';

export default function AuthView({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
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
  const [regDepartment, setRegDepartment] = useState('Mechanical Engineering');
  const [regInstitution, setRegInstitution] = useState('Faculty of Engineering');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Status & Validation
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Helper to fill verified test account credentials into the form fields
  const handleFillTestCredentials = () => {
    setLoginEmail(VERIFIED_TEST_ACCOUNT.email);
    setLoginPassword(VERIFIED_TEST_ACCOUNT.rawPassword);
    setError('');
    setSuccessMessage('Verified test account credentials loaded into fields. Click "Sign In" to authenticate.');
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
      errors.email = 'Please provide a valid academic email address.';
    }

    if (!regPassword || regPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
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
        institution: regInstitution,
        department: regDepartment
      });

      // MANDATORY REQUIREMENT: Do NOT automatically log in after registration!
      // Display confirmation and switch to login page for manual authentication.
      setSuccessMessage('Registration successful! Please enter your credentials to sign in.');
      setLoginEmail(regEmail);
      setLoginPassword('');
      setMode('login');
      
      // Clear registration form
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
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
            PriorityFirst <span className="brand-badge">PF</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Engineering Task Prioritization & Academic Scheduling
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
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
              {/* Verified Test Account Callout Box */}
              <div 
                style={{ 
                  background: 'rgba(59, 130, 246, 0.08)', 
                  border: '1px solid rgba(59, 130, 246, 0.25)', 
                  borderRadius: '10px', 
                  padding: '12px 14px',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <KeyRound size={14} />
                    Verified Test Account
                  </span>
                  <button 
                    type="button"
                    onClick={handleFillTestCredentials}
                    style={{ 
                      fontSize: '11px', 
                      color: 'var(--primary)', 
                      background: 'rgba(59, 130, 246, 0.15)', 
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    id="btn-fill-test-account"
                  >
                    Auto-Fill Credentials
                  </button>
                </div>
                <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  <div>Email: <strong style={{ color: 'var(--text-main)' }}>{VERIFIED_TEST_ACCOUNT.email}</strong></div>
                  <div>Password: <strong style={{ color: 'var(--text-main)' }}>{VERIFIED_TEST_ACCOUNT.rawPassword}</strong></div>
                </div>
              </div>

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
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
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
                  Academic Email <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    id="reg-email"
                    type="email"
                    className="form-input"
                    placeholder="maria.santos@university.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <Mail size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-department">
                    Department
                  </label>
                  <select 
                    id="reg-department"
                    className="form-select"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                  >
                    <option value="Civil & Structural Engineering">Civil & Structural Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical & Electronics">Electrical & Electronics</option>
                    <option value="Chemical Engineering">Chemical Engineering</option>
                    <option value="Computer & Software Eng">Computer & Software Eng</option>
                    <option value="Industrial Engineering">Industrial Engineering</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-institution">
                    Institution / University
                  </label>
                  <input 
                    id="reg-institution"
                    type="text"
                    className="form-input"
                    placeholder="e.g. University of Technology"
                    value={regInstitution}
                    onChange={(e) => setRegInstitution(e.target.value)}
                  />
                </div>
              </div>

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
                      placeholder="Min. 6 chars"
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

        {/* Security / Cryptographic Hashing Notice */}
        <div style={{ padding: '0.85rem 2rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          <strong>Cryptographic Security:</strong> Passwords are authenticated via salted SHA-256 Web Crypto hashing. Plaintext passwords are never stored.
        </div>
      </div>
    </div>
  );
}
