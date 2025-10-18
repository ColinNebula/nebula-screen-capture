import { writable } from 'svelte/store';

// Notifications store
export const notifications = writable([]);

// Helper to add notification
export function addNotification(message, type = 'info', duration = 5000) {
  const id = Date.now() + Math.random();
  const notification = { id, message, type, timestamp: Date.now() };
  
  notifications.update(n => [...n, notification]);
  
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }
  
  return id;
}

// Helper to remove notification
export function removeNotification(id) {
  notifications.update(n => n.filter(notif => notif.id !== id));
}

// Helper to clear all notifications
export function clearNotifications() {
  notifications.set([]);
}
