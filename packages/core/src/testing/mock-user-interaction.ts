import type {
  UserInteraction,
  FilePickerOptions,
  FileSaveOptions,
  ApprovalRequest,
} from '../interfaces/user-interaction';

/**
 * Mock UserInteraction for testing.
 * Records all interactions and allows configuring responses.
 */
export class MockUserInteraction implements UserInteraction {
  /** All errors shown */
  readonly errors: Array<{ title: string; message: string }> = [];
  /** All warnings shown */
  readonly warnings: Array<{ title: string; message: string }> = [];
  /** All info messages shown */
  readonly infos: Array<{ title: string; message: string }> = [];
  /** All file picker invocations */
  readonly filePickerCalls: FilePickerOptions[] = [];
  /** All file save invocations */
  readonly fileSaveCalls: FileSaveOptions[] = [];
  /** All approval requests */
  readonly approvalRequests: ApprovalRequest[] = [];
  /** All openExternal calls */
  readonly externalUrls: string[] = [];
  /** All confirm calls */
  readonly confirmCalls: Array<{ title: string; message: string }> = [];

  /** Configure responses for file picker */
  filePickerResult: string[] | null = null;
  /** Configure response for file save */
  fileSaveResult: string | null = null;
  /** Configure response for approval requests */
  approvalResult = true;
  /** Configure response for confirm dialogs */
  confirmResult = true;

  showError(title: string, message: string): void {
    this.errors.push({ title, message });
  }

  showWarning(title: string, message: string): void {
    this.warnings.push({ title, message });
  }

  showInfo(title: string, message: string): void {
    this.infos.push({ title, message });
  }

  async pickFile(options: FilePickerOptions): Promise<string[] | null> {
    this.filePickerCalls.push(options);
    return this.filePickerResult;
  }

  async saveFile(options: FileSaveOptions): Promise<string | null> {
    this.fileSaveCalls.push(options);
    return this.fileSaveResult;
  }

  async requestApproval(request: ApprovalRequest): Promise<boolean> {
    this.approvalRequests.push(request);
    return this.approvalResult;
  }

  async openExternal(url: string): Promise<void> {
    this.externalUrls.push(url);
  }

  async confirm(title: string, message: string): Promise<boolean> {
    this.confirmCalls.push({ title, message });
    return this.confirmResult;
  }

  /** Reset all recorded interactions. */
  reset(): void {
    this.errors.length = 0;
    this.warnings.length = 0;
    this.infos.length = 0;
    this.filePickerCalls.length = 0;
    this.fileSaveCalls.length = 0;
    this.approvalRequests.length = 0;
    this.externalUrls.length = 0;
    this.confirmCalls.length = 0;
  }
}
