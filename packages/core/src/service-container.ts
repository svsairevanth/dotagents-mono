/**
 * Lightweight service container for dependency injection.
 *
 * Services are registered by token (string key) and resolved at runtime.
 * Platform-specific adapters (Electron, CLI) register their implementations
 * at app startup, and services resolve dependencies via the container
 * instead of importing platform-specific code directly.
 *
 * Usage:
 *   // At app startup:
 *   container.register('PathResolver', new ElectronPathResolver());
 *   container.register('ProgressEmitter', new ElectronProgressEmitter());
 *
 *   // In service code:
 *   const pathResolver = container.resolve<PathResolver>('PathResolver');
 */

/** A cleanup/dispose function returned when registering a service */
type CleanupFn = () => void | Promise<void>;

interface ServiceRegistration<T = unknown> {
  instance: T;
  cleanup?: CleanupFn;
}

/**
 * The ServiceContainer manages service registrations and their lifecycle.
 */
export class ServiceContainer {
  private registry = new Map<string, ServiceRegistration>();

  /**
   * Register a service instance under a token.
   *
   * @param token - Unique string identifier for the service (e.g., 'PathResolver')
   * @param instance - The service instance to register
   * @param cleanup - Optional cleanup function called when the service is unregistered or the container is cleaned up
   * @throws Error if a service is already registered under the same token
   */
  register<T>(token: string, instance: T, cleanup?: CleanupFn): void {
    if (this.registry.has(token)) {
      throw new Error(
        `Service "${token}" is already registered. Use replace() to override.`
      );
    }
    this.registry.set(token, { instance, cleanup });
  }

  /**
   * Replace an existing service registration.
   * If the previous registration had a cleanup function, it will be called.
   *
   * @param token - The service token to replace
   * @param instance - The new service instance
   * @param cleanup - Optional cleanup function for the new registration
   */
  async replace<T>(token: string, instance: T, cleanup?: CleanupFn): Promise<void> {
    const existing = this.registry.get(token);
    if (existing?.cleanup) {
      await existing.cleanup();
    }
    this.registry.set(token, { instance, cleanup });
  }

  /**
   * Resolve a service by its token.
   *
   * @param token - The service token to look up
   * @returns The registered service instance
   * @throws Error if no service is registered under the given token
   */
  resolve<T>(token: string): T {
    const registration = this.registry.get(token);
    if (!registration) {
      throw new Error(
        `Service "${token}" is not registered. ` +
        `Make sure to register it before resolving. ` +
        `Available services: [${Array.from(this.registry.keys()).join(', ')}]`
      );
    }
    return registration.instance as T;
  }

  /**
   * Try to resolve a service, returning undefined if not registered.
   *
   * @param token - The service token to look up
   * @returns The service instance or undefined
   */
  tryResolve<T>(token: string): T | undefined {
    const registration = this.registry.get(token);
    return registration?.instance as T | undefined;
  }

  /**
   * Check if a service is registered under the given token.
   */
  has(token: string): boolean {
    return this.registry.has(token);
  }

  /**
   * Unregister a service. Calls its cleanup function if one was provided.
   *
   * @param token - The service token to remove
   * @returns true if the service was found and removed, false otherwise
   */
  async unregister(token: string): Promise<boolean> {
    const registration = this.registry.get(token);
    if (!registration) {
      return false;
    }
    if (registration.cleanup) {
      await registration.cleanup();
    }
    this.registry.delete(token);
    return true;
  }

  /**
   * Clean up all registered services (calls all cleanup functions)
   * and clear the registry.
   */
  async cleanup(): Promise<void> {
    const errors: Error[] = [];
    for (const [token, registration] of this.registry) {
      if (registration.cleanup) {
        try {
          await registration.cleanup();
        } catch (error) {
          errors.push(
            new Error(`Cleanup failed for service "${token}": ${error}`)
          );
        }
      }
    }
    this.registry.clear();
    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        `Cleanup failed for ${errors.length} service(s)`
      );
    }
  }

  /**
   * Get the list of all registered service tokens.
   */
  getRegisteredTokens(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Get the total number of registered services.
   */
  get size(): number {
    return this.registry.size;
  }
}

/**
 * Well-known service tokens for the core abstraction interfaces.
 * Use these constants when registering/resolving core services.
 */
export const ServiceTokens = {
  PathResolver: 'PathResolver',
  ProgressEmitter: 'ProgressEmitter',
  UserInteraction: 'UserInteraction',
  NotificationService: 'NotificationService',
} as const;

/**
 * Global default service container instance.
 * Apps should use this shared instance unless they need isolation (e.g., testing).
 */
export const container = new ServiceContainer();
