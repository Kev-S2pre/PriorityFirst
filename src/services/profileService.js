/**
 * PriorityFirst² — Profile domain: who the user is.
 * Name, photo, classification and institution only. It never changes the email address
 * or password (see securityService) or app preferences (see storageService settings).
 */
import { authService } from './authService';

export const profileService = {
  /**
   * Saves identity details. The email is always kept as it is — changing it is a
   * security action handled in Settings › Security.
   */
  async updateProfile(user, fields) {
    return authService.updateProfile(user.id, { ...fields, email: user.email });
  },

  async updateAvatar(user, avatar) {
    return authService.updateAvatar(user.id, avatar);
  }
};
