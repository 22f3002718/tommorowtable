import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Check if running on native platform
const isNative = () => Capacitor.isNativePlatform();

// Storage abstraction that works for both web and mobile
export const authStorage = {
  // Get token
  async getToken() {
    if (isNative()) {
      const { value } = await Preferences.get({ key: TOKEN_KEY });
      return value;
    } else {
      return localStorage.getItem(TOKEN_KEY);
    }
  },

  // Set token
  async setToken(token) {
    if (isNative()) {
      await Preferences.set({ key: TOKEN_KEY, value: token });
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  // Remove token
  async removeToken() {
    if (isNative()) {
      await Preferences.remove({ key: TOKEN_KEY });
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  // Get user
  async getUser() {
    if (isNative()) {
      const { value } = await Preferences.get({ key: USER_KEY });
      return value ? JSON.parse(value) : null;
    } else {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
  },

  // Set user
  async setUser(user) {
    const userStr = JSON.stringify(user);
    if (isNative()) {
      await Preferences.set({ key: USER_KEY, value: userStr });
    } else {
      localStorage.setItem(USER_KEY, userStr);
    }
  },

  // Remove user
  async removeUser() {
    if (isNative()) {
      await Preferences.remove({ key: USER_KEY });
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  // Clear all auth data
  async clearAuth() {
    await this.removeToken();
    await this.removeUser();
  }
};

export default authStorage;
