import type {
  NotificationService,
  NotificationOptions,
} from '../interfaces/notification-service';

/**
 * Mock NotificationService for testing.
 * Records all notifications and allows configuring isSupported().
 */
export class MockNotificationService implements NotificationService {
  /** All simple notifications shown */
  readonly notifications: Array<{ title: string; body: string }> = [];
  /** All notifications shown with options */
  readonly notificationsWithOptions: NotificationOptions[] = [];
  /** Configure whether notifications are reported as supported */
  supported = true;

  showNotification(title: string, body: string): void {
    this.notifications.push({ title, body });
  }

  showNotificationWithOptions(options: NotificationOptions): void {
    this.notificationsWithOptions.push(options);
  }

  isSupported(): boolean {
    return this.supported;
  }

  /** Reset all recorded notifications. */
  reset(): void {
    this.notifications.length = 0;
    this.notificationsWithOptions.length = 0;
  }
}
