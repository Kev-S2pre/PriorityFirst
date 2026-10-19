import React, { useState } from 'react';
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
  AlertTriangle 
} from 'lucide-react';
import { browserNotificationService, playNotificationSound } from '../services/notificationService';

export default function SettingsModal({
  isOpen,
  onClose,
  onExportBackup,
  onImportBackup,
  onResetSampleData,
  onClearAllTasks,
  settings,
  onUpdateSettings,
  tasksCount
}) {
  const [importText, setImportText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [importError, setImportError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const notificationPermission = browserNotificationService.getPermission();

  const handleRequestNotification = async () => {
    const result = await browserNotificationService.requestPermission();
    if (result === 'granted') {
      onUpdateSettings({ browserNotificationsEnabled: true });
      browserNotificationService.send('PriorityFirst Notifications Active', {
        body: 'You will receive reminders for approaching and due deadlines.'
      });
    } else {
      onUpdateSettings({ browserNotificationsEnabled: false });
    }
  };

  const handleToggleSound = () => {
    const nextVal = !settings.soundAlertsEnabled;
    onUpdateSettings({ soundAlertsEnabled: nextVal });
    if (nextVal) {
      playNotificationSound();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        onImportBackup(text);
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

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HardDrive size={20} style={{ color: 'var(--primary)' }} />
            <h2 className="modal-title">Settings & Data Persistence</h2>
          </div>
          <button className="action-icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Storage Explanation Banner */}
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem', color: '#93c5fd', marginBottom: '0.35rem' }}>
              <ShieldCheck size={18} />
              <span>Browser Local Storage Architecture</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              PriorityFirst persists your coursework and configuration directly inside your browser's local storage ({tasksCount} tasks currently stored). All data remains strictly private on this device and persists across browser restarts. Data is not synchronized across different devices automatically.
            </p>
          </div>

          {/* Backup & Portability Actions */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Data Backup & Portability
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button 
                className="btn-secondary"
                style={{ justifyContent: 'center' }}
                onClick={onExportBackup}
                id="btn-export-backup"
              >
                <Download size={16} />
                <span>Export JSON Backup</span>
              </button>

              <button 
                className="btn-secondary"
                style={{ justifyContent: 'center' }}
                onClick={() => setShowImportArea(prev => !prev)}
                id="btn-toggle-import"
              >
                <Upload size={16} />
                <span>Import JSON Backup</span>
              </button>
            </div>

            {/* Import Drop Area */}
            {showImportArea && (
              <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-card)' }}>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Upload a <code>.json</code> backup file or paste JSON content below:
                </div>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleFileUpload}
                  style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}
                />

                <textarea 
                  className="form-textarea"
                  rows={3}
                  placeholder="Paste JSON backup text here..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                />

                {importError && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                    {importError}
                  </div>
                )}

                <button 
                  className="btn-primary" 
                  style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  onClick={handleManualImport}
                >
                  Confirm Import
                </button>
              </div>
            )}
          </div>

          {/* Notifications & Audio Preferences */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Notifications & Sound Preferences
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Browser Web Notifications */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Bell size={18} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Desktop Notifications</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Status: {notificationPermission} (Works while browser tab is open)
                    </div>
                  </div>
                </div>

                <button 
                  className={notificationPermission === 'granted' ? 'btn-secondary' : 'btn-primary'}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  onClick={handleRequestNotification}
                >
                  {notificationPermission === 'granted' ? 'Enabled' : 'Request Permission'}
                </button>
              </div>

              {/* Sound Alerts */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Volume2 size={18} style={{ color: 'var(--success)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Audio Chime Alerts</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Synthesized two-tone chime when high-priority tasks approach
                    </div>
                  </div>
                </div>

                <button 
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  onClick={handleToggleSound}
                >
                  {settings.soundAlertsEnabled ? 'Sound: ON' : 'Sound: OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Reset & Wipe Danger Zone */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Data Management & Reset
            </h3>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                className="btn-secondary"
                onClick={onResetSampleData}
                title="Reload the engineering coursework sample dataset"
              >
                <RefreshCw size={15} />
                <span>Load Engineering Samples</span>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  <button 
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
                    onClick={() => setConfirmClear(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
