/**
 * Push Notification Service - DISABLED
 * 
 * Firebase/FCM push notifications have been removed to ensure smooth
 * Android Studio compilation without Firebase dependencies.
 * 
 * This is a no-op stub that prevents errors when push notification
 * initialization is called.
 */

export const pushNotificationService = {
  // Push notifications are disabled
  isAvailable() {
    console.log('Push notifications are disabled in this build');
    return false;
  },

  // No-op initialize
  async initialize(onNotificationReceived) {
    console.log('Push notification service is disabled');
    return Promise.resolve();
  },

  // No-op register token
  async registerTokenWithBackend(pushToken) {
    console.log('Push notification token registration is disabled');
    return Promise.resolve();
  },

  // No-op get delivered notifications
  async getDeliveredNotifications() {
    return [];
  },

  // No-op remove delivered notifications
  async removeDeliveredNotifications(notifications) {
    return Promise.resolve();
  },

  // No-op remove all delivered notifications
  async removeAllDeliveredNotifications() {
    return Promise.resolve();
  }
};

export default pushNotificationService;
