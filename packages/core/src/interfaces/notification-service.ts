/**
 * NotificationService — abstracts system-level notifications.
 *
 * Desktop (Electron): uses Electron's Notification API.
 * CLI: uses terminal bell, or simply logs to console (no-op by default).
 */
export interface NotificationService {
  /**
   * Show a system notification with a title and body.
   */
  showNotification(title: string, body: string): void;

  /**
   * Show a system notification with additional options.
   */
  showNotificationWithOptions(options: NotificationOptions): void;

  /**
   * Check if notifications are supported and permitted on this platform.
   */
  isSupported(): boolean;
}

export interface NotificationOptions {
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** Whether the notification is silent (no sound) */
  silent?: boolean;
  /** Optional urgency level */
  urgency?: 'low' | 'normal' | 'critical';
  /** Optional click action callback or identifier */
  clickAction?: string;
}
