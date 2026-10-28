/**
 * PriorityFirst² — Security domain: how the user signs in.
 * Email address and password changes. Never touches profile details or preferences.
 */
import { authService } from './authService';

export const securityService = {
  async changePassword(user, currentPassword, newPassword, confirmPassword) {
    return authService.changePassword(user.id, currentPassword, newPassword, confirmPassword);
  },

  /**
   * Changes the sign-in email. With a cloud account Supabase emails a confirmation link
   * to the new address, and the change completes once it's clicked.
   * Profile details are passed through unchanged.
   */
  async changeEmail(user, newEmail) {
    if ((newEmail || '').trim().toLowerCase() === (user.email || '').toLowerCase()) {
      throw new Error('That is already your email address.');
    }
    return authService.updateProfile(user.id, {
      name: user.name,
      email: newEmail,
      institution: user.institution || '',
      institutionId: user.institutionId || '',
      institutionType: user.institutionType || '',
      department: user.department || '',
      classification: user.classification || user.role || 'Student',
      otherDescription: user.otherDescription || ''
    });
  }
};
