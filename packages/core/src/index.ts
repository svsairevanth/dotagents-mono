/**
 * @dotagents/core
 *
 * Core agent engine for DotAgents — platform-agnostic services
 * extracted from the Electron desktop app.
 *
 * Provides abstraction interfaces for platform-specific functionality
 * and a service container for dependency injection.
 */

// Abstraction interfaces
export type {
  PathResolver,
} from './interfaces/path-resolver';
export type {
  ProgressEmitter,
} from './interfaces/progress-emitter';
export type {
  UserInteraction,
  FilePickerOptions,
  FileSaveOptions,
  ApprovalRequest,
} from './interfaces/user-interaction';
export type {
  NotificationService,
  NotificationOptions,
} from './interfaces/notification-service';

// Service container
export {
  ServiceContainer,
  ServiceTokens,
  container,
} from './service-container';

// Testing utilities
export {
  MockPathResolver,
  createMockPathResolver,
} from './testing/mock-path-resolver';
export { MockProgressEmitter } from './testing/mock-progress-emitter';
export { MockUserInteraction } from './testing/mock-user-interaction';
export { MockNotificationService } from './testing/mock-notification-service';
