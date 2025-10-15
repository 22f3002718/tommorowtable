import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const pushNotificationService = {
  // Check if push notifications are available
  isAvailable() {
    if (!Capacitor.isNativePlatform()) return false;
    const platform = Capacitor.getPlatform();
    // Disable Android push by default unless explicitly enabled
    if (platform === 'android' && process.env.REACT_APP_ANDROID_PUSH !== 'true') {
      console.warn('Push notifications disabled on Android (set REACT_APP_ANDROID_PUSH=true to enable).');
      return false;
    }
    return true;
  },

  // Initialize push notifications
  async initialize(onNotificationReceived) {
    try {
      if (!this.isAvailable()) {
        console.log('Push notifications not available or disabled');
        return;
      }

      // Request permission
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission denied');
        return;
      }

      // Register with APNs / FCM
      await PushNotifications.register();

      // Listen for registration success
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token: ' + token.value);
        // Send token to backend
        await this.registerTokenWithBackend(token.value);
      });

      // Listen for registration error
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      // Listen for push notifications received
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      });

      // Listen for notification action performed (user tapped on notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification.actionId, notification.notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification.notification, notification.actionId);
        }
      });
    } catch (err) {
      console.error('Push initialization failed:', err);
      // Do not throw to avoid crashing the app on missing Firebase config
    }
  },

  // Register token with backend
  async registerTokenWithBackend(pushToken) {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token found, skipping push token registration');
        return;
      }

      const platform = Capacitor.getPlatform(); // 'ios' or 'android'
      
      await axios.post(
        `${BACKEND_URL}/api/auth/register-push-token`,
        {
          push_token: pushToken,
          platform: platform
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Push token registered with backend successfully');
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }
  },

  // Get delivered notifications
  async getDeliveredNotifications() {
    if (!this.isAvailable()) return [];
    
    const notificationList = await PushNotifications.getDeliveredNotifications();
    return notificationList.notifications;
  },

  // Remove delivered notifications
  async removeDeliveredNotifications(notifications) {
    if (!this.isAvailable()) return;
    
    await PushNotifications.removeDeliveredNotifications(notifications);
  },

  // Remove all delivered notifications
  async removeAllDeliveredNotifications() {
    if (!this.isAvailable()) return;
    
    await PushNotifications.removeAllDeliveredNotifications();
  }
};

export default pushNotificationService;
