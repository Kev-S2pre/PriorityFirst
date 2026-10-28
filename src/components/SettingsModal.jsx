import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  HardDrive,
  Bell,
  Volume2,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Mail,
  SlidersHorizontal,
  Sun,
  Moon,
  Settings as SettingsIcon
} from 'lucide-react';
import { browserNotificationService, playNotificationSound } from '../services/notificationService';
import { securityService } from '../services/securityService';
import { isCloudEnabled } from '../services/cloudSync';
import PasswordStrength from './PasswordStrength';

// Settings: how the app behaves. Identity (name, photo, institution) lives in My Profile.
const SECTIONS = [
  { id: 'general', label: 'General', icon: SlidersHorizontal },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'data', label: 'Privacy & Data', icon: HardDrive }
];

const SETTINGS_SECTIONS = SECTIONS.map(s => s.id);

function SettingRow({ icon: Icon, iconColor, title, description, children }) {
  return (
    <div className="settings-row">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', minWidth: 0 }}>
        {Icon && <Icon size={18} style={{ color: iconColor || 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{title}</div>
          {description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{description}</div>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`settings-switch ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export default function SettingsModal({
  isOpen,
  onClose,
  initialSection = 'general',
  currentUser,
  onAccountUpdated,
  onExportBackup,
  onImportBackup,
  onResetSampleData,
  onClearAllTasks,
  settings,
  onUpdateSettings,
  tasksCount
}) {
  const [section, setSection] = useState(initialSection);
  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState({ type: '', message: '' });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [importError, setImportError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  // Reset form state each time the window opens
  useEffect(() => {
    if (isOpen) {
      setSection(SETTINGS_SECTIONS.includes(initialSection) ? initialSection : 'general');
      setNewEmail('');
      setEmailStatus({ type: '', message: '' });
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordStatus({ type: '', message: '' });
      setConfirmClear(false);
    }
  }, [isOpen, initialSection]);

  if (!isOpen) return null;

  const notificationPermission = browserNotificationService.getPermission();

  const handleEmailSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await securityService.changeEmail(currentUser, newEmail);
      onAccountUpdated(updated);
      setNewEmail('');
      setEmailStatus({
        type: 'success',
        message: isCloudEnabled
          ? `Check ${updated.pendingEmail || newEmail} and click the confirmation link to finish changing your email.`
          : 'Email address updated.'
      });
    } catch (err) {
      setEmailStatus({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await securityService.changePassword(currentUser, passwords.current, passwords.next, passwords.confirm);
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordStatus({ type: 'success', message: 'Password updated. Use it the next time you sign in.' });
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotifications = async (enable) => {
    if (!enable) {
      onUpdateSettings({ browserNotificationsEnabled: false });
      return;
    }
    const result = await browserNotificationService.requestPermission();
    if (result === 'granted') {
      onUpdateSettings({ browserNotificationsEnabled: true });
      browserNotificationService.send('PriorityFirst² Notifications Active', {
        body: 'You will receive reminders for approaching and due deadlines.'
      });
    } else {
      onUpdateSettings({ browserNotificationsEnabled: false });
    }
  };

  const handleToggleSound = (enable) => {
    onUpdateSettings({ soundAlertsEnabled: enable });
    if (enable) {
      playNotificationSound();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        onImportBackup(event.target.result);
        setImportError('');
        setShowImportArea(false);
      } catch (err) {
        setImportError('Failed to import file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleManualImport = () => {
    try {
      if (!importText.trim()) return;
      onImportBackup(importText);
      setImportError('');
      setImportText('');
      setShowImportArea(false);
    } catch (err) {
      setImportError('Invalid JSON format: ' + err.message);
    }
  };

  const statusMessage = (status) => status.message && (
    <div className={`settings-status ${status.type}`}>{status.message}</div>
  );

  const activeSection = SECTIONS.find(s => s.id === section) || SECTIONS[0];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SettingsIcon size={20} style={{ color: 'var(--primary)' }} />
            <h2 className="modal-title">Settings</h2>
          </div>
          <button className="action-icon-btn" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="settings-layout">
          <nav className="settings-nav" aria-label="Settings sections">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`settings-nav-btn ${section === id ? 'active' : ''}`}
                onClick={() => setSection(id)}
                id={`settings-tab-${id}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="settings-content">
            <h3 className="settings-section-title">{activeSection.label}</h3>

            {section === 'general' && (
              <div className="settings-stack">
                <div>
                  <div className="settings-subtitle">Theme</div>
                  <div className="settings-theme-grid">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon }
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        className={`settings-theme-option ${settings.theme === id ? 'active' : ''}`}
                        onClick={() => onUpdateSettings({ theme: id })}
                        aria-pressed={settings.theme === id}
                        id={`theme-option-${id}`}
                      >
                        <Icon size={22} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <SettingRow
                  icon={SlidersHorizontal}
                  title="Daily Workload Limit"
                  description="How many focused hours you can realistically work per day. Used for scheduling and overload warnings."
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      className="form-input"
                      style={{ width: '80px' }}
                      value={settings.dailyWorkloadLimitHours}
                      onChange={(e) => {
                        const hours = Math.min(16, Math.max(1, Number(e.target.value) || 1));
                        onUpdateSettings({ dailyWorkloadLimitHours: hours });
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>hours</span>
                  </div>
                </SettingRow>
                <p className="form-hint">Priority weights can be tuned on the Prioritizer page.</p>
              </div>
            )}

            {section === 'notifications' && (
              <div className="settings-stack">
                <SettingRow
                  icon={Bell}
                  title="Desktop Notifications"
                  description={`Browser permission: ${notificationPermission}. Reminders run while PriorityFirst² is open.`}
                >
                  <Toggle
                    label="Desktop notifications"
                    checked={settings.browserNotificationsEnabled && notificationPermission === 'granted'}
                    onChange={handleToggleNotifications}
                  />
                </SettingRow>
                {notificationPermission === 'denied' && (
                  <p className="form-hint" style={{ color: 'var(--danger)' }}>
                    Notifications are blocked by your browser. Enable them in the site permissions, then reopen Settings.
                  </p>
                )}
                <SettingRow
                  icon={Volume2}
                  iconColor="var(--success)"
                  title="Audio Chime Alerts"
                  description="Play a short chime when high-priority tasks approach their deadline."
                >
                  <Toggle label="Audio chime alerts" checked={!!settings.soundAlertsEnabled} onChange={handleToggleSound} />
                </SettingRow>
              </div>
            )}

            {section === 'security' && (
              <div className="settings-stack">
                {/* Email address */}
                <form onSubmit={handleEmailSave} className="settings-stack">
                  <div className="settings-subtitle">Email address</div>
                  <div className="profile-readonly">
                    <Mail size={15} />
                    <span>{currentUser?.email}</span>
                  </div>
                  {currentUser?.pendingEmail && currentUser.pendingEmail !== currentUser.email && (
                    <p className="form-hint">Waiting for confirmation: {currentUser.pendingEmail}</p>
                  )}
                  <div className="form-group">
                    <label className="form-label" htmlFor="new-email">New email address</label>
                    <input id="new-email" type="email" className="form-input" maxLength={254} autoComplete="email"
                      placeholder="you@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  </div>
                  {statusMessage(emailStatus)}
                  <div className="settings-actions">
                    <button type="submit" className="btn-secondary" id="btn-change-email" disabled={isSaving || !newEmail.trim()}>
                      <Mail size={15} />
                      <span>Change Email</span>
                    </button>
                  </div>
                </form>

                <div className="settings-divider" />

                {/* Password */}
                <form onSubmit={handlePasswordSave} className="settings-stack">
                  <div className="settings-subtitle">Password</div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="pw-current">Current Password</label>
                    <input id="pw-current" type="password" className="form-input" autoComplete="current-password"
                      value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="pw-new">New Password</label>
                      <input id="pw-new" type="password" className="form-input" autoComplete="new-password"
                        value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="pw-confirm">Confirm New Password</label>
                      <input id="pw-confirm" type="password" className="form-input" autoComplete="new-password"
                        value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                    </div>
                  </div>

                  <PasswordStrength
                    password={passwords.next}
                    confirmPassword={passwords.confirm}
                    email={currentUser?.email}
                    name={currentUser?.name}
                  />

                  {statusMessage(passwordStatus)}

                  <div className="settings-actions">
                    <button type="submit" className="btn-primary" id="btn-change-password"
                      disabled={isSaving || !passwords.current || !passwords.next || !passwords.confirm}>
                      <Lock size={15} />
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {section === 'data' && (
              <div className="settings-stack">
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.35rem' }}>
                    <ShieldCheck size={18} />
                    <span>{isCloudEnabled ? 'Saved to your cloud account' : 'Stored on this device'}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {isCloudEnabled
                      ? `${tasksCount} tasks are saved automatically to your account and are available on any device you sign in to. Only you can see them.`
                      : `${tasksCount} tasks are saved in this browser's local storage. Data stays private to this device and is not synced automatically; use a backup to move it.`}
                  </p>
                </div>

                <div className="grid-2-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button className="btn-secondary" style={{ justifyContent: 'center' }} onClick={onExportBackup} id="btn-export-backup">
                    <Download size={16} />
                    <span>Export Backup</span>
                  </button>
                  <button className="btn-secondary" style={{ justifyContent: 'center' }} onClick={() => setShowImportArea(prev => !prev)} id="btn-toggle-import">
                    <Upload size={16} />
                    <span>Import Backup</span>
                  </button>
                </div>

                {showImportArea && (
                  <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-card)' }}>
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Upload a <code>.json</code> backup file or paste JSON content below:
                    </div>
                    <input type="file" accept=".json" onChange={handleFileUpload} style={{ marginBottom: '0.75rem', fontSize: '0.8rem', maxWidth: '100%' }} />
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Paste JSON backup text here..."
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                    />
                    {importError && (
                      <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.35rem' }}>{importError}</div>
                    )}
                    <button className="btn-primary" style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={handleManualImport}>
                      Confirm Import
                    </button>
                  </div>
                )}

                <div className="settings-danger">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--danger)' }}>
                    <AlertTriangle size={16} />
                    <span>Danger Zone</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" onClick={onResetSampleData} title="Load the engineering coursework sample dataset">
                      <RefreshCw size={15} />
                      <span>Load Sample Tasks</span>
                    </button>

                    {!confirmClear ? (
                      <button
                        className="btn-secondary"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                        onClick={() => setConfirmClear(true)}
                        id="btn-clear-tasks-confirm"
                      >
                        <Trash2 size={15} />
                        <span>Clear All Tasks</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn-primary"
                          style={{ background: 'var(--danger)', fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
                          onClick={() => {
                            onClearAllTasks();
                            setConfirmClear(false);
                            onClose();
                          }}
                        >
                          Confirm Wipe
                        </button>
                        <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }} onClick={() => setConfirmClear(false)}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
