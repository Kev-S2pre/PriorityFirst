import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, Camera, User, Mail, CalendarDays, BadgeCheck, ArrowRight } from 'lucide-react';
import { profileService } from '../services/profileService';
import InstitutionFields from './InstitutionFields';
import { defaultInstitutionType, isValidDepartment } from '../data/profileOptions';

const CLASSIFICATIONS = ['Student', 'Professional', 'Worker', 'Athlete', 'Other'];

function profileFromUser(user) {
  return {
    name: user?.name || '',
    institution: user?.institution || '',
    institutionId: user?.institutionId || '',
    institutionType: user?.institutionType || defaultInstitutionType(user?.classification || user?.role),
    department: user?.department || '',
    classification: user?.classification || user?.role || 'Student',
    otherDescription: user?.otherDescription || ''
  };
}

// Center-crops an image file to a small square JPEG data URL so it stays small
function resizeImageFile(file, size = 192) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file could not be read as an image.'));
    };
    img.src = url;
  });
}

const formatJoined = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

/**
 * My Profile — identity only: photo, name, role and institution.
 * Preferences, password and email live in Settings.
 */
export default function ProfilePanel({ isOpen, onClose, currentUser, onProfileUpdated, onOpenSecurity }) {
  const [profile, setProfile] = useState(() => profileFromUser(currentUser));
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Fresh form each time the panel opens (not after saving, so the message stays)
  useEffect(() => {
    if (isOpen) {
      setProfile(profileFromUser(currentUser));
      setStatus({ type: '', message: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  const original = profileFromUser(currentUser);
  const isDirty = Object.keys(profile).some(key => profile[key] !== original[key]);
  const joined = formatJoined(currentUser.createdAt);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      onProfileUpdated(await profileService.updateProfile(currentUser, profile));
      setStatus({ type: 'success', message: 'Profile saved.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', message: 'Please choose an image file (JPG, PNG, GIF or WebP).' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'Image is too large. Choose one under 10 MB.' });
      return;
    }
    try {
      const avatar = await resizeImageFile(file);
      onProfileUpdated(await profileService.updateAvatar(currentUser, avatar));
      setStatus({ type: 'success', message: 'Profile picture updated.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  const handleAvatarRemove = async () => {
    try {
      onProfileUpdated(await profileService.updateAvatar(currentUser, ''));
      setStatus({ type: 'success', message: 'Profile picture removed.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <div className="modal-dialog profile-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} style={{ color: 'var(--primary)' }} />
            <h2 className="modal-title" id="profile-title">My Profile</h2>
          </div>
          <button className="action-icon-btn" onClick={onClose} aria-label="Close profile">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="profile-form">
          <div className="modal-body">
            {/* Identity strip */}
            <div className="settings-profile-head">
              <div className="settings-avatar">
                {currentUser.avatar
                  ? <img src={currentUser.avatar} alt="Profile picture" />
                  : (currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U')}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
                <div className="profile-meta">
                  <span><BadgeCheck size={13} /> {original.classification}</span>
                  {joined && <span><CalendarDays size={13} /> Member since {joined}</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                  <label className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }} id="btn-upload-avatar">
                    <Camera size={14} />
                    <span>{currentUser.avatar ? 'Change Photo' : 'Upload Photo'}</span>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} hidden id="input-avatar-file" />
                  </label>
                  {currentUser.avatar && (
                    <button type="button" className="btn-secondary" onClick={handleAvatarRemove} id="btn-remove-avatar"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <h3 className="profile-section-title">Personal details</h3>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-name">Full Name</label>
                <input id="profile-name" className="form-input" value={profile.name} maxLength={60}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div className="form-group">
                <span className="form-label">Email Address</span>
                <div className="profile-readonly" id="profile-email">
                  <Mail size={15} />
                  <span>{currentUser.email}</span>
                </div>
                <button type="button" className="forgot-link" style={{ alignSelf: 'flex-start' }} id="btn-change-email-link" onClick={onOpenSecurity}>
                  Change email in Settings › Security <ArrowRight size={12} style={{ verticalAlign: '-1px' }} />
                </button>
              </div>
            </div>

            <h3 className="profile-section-title">Affiliation</h3>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-classification">I am a</label>
                <select id="profile-classification" className="form-select" value={profile.classification}
                  onChange={(e) => {
                    const next = e.target.value;
                    setProfile({
                      ...profile,
                      classification: next,
                      institutionType: profile.institution ? profile.institutionType : defaultInstitutionType(next),
                      department: isValidDepartment(profile.department, profile.institutionType, next) ? profile.department : ''
                    });
                  }}>
                  {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {profile.classification === 'Other' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-other">Describe your role</label>
                  <input id="profile-other" className="form-input" value={profile.otherDescription} maxLength={80}
                    onChange={(e) => setProfile({ ...profile, otherDescription: e.target.value })} />
                </div>
              )}
            </div>

            <InstitutionFields
              idPrefix="profile"
              classification={profile.classification}
              value={profile}
              onChange={(next) => setProfile({ ...profile, ...next })}
            />

            {status.message && <div className={`settings-status ${status.type}`}>{status.message}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" disabled={!isDirty || isSaving}
              onClick={() => { setProfile(original); setStatus({ type: '', message: '' }); }}>
              Reset
            </button>
            <button type="submit" className="btn-primary" disabled={!isDirty || isSaving} id="btn-save-profile">
              <Save size={15} />
              <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
