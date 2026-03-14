/**
 * UserInteraction — abstracts user-facing dialogs and prompts.
 *
 * Desktop (Electron): uses `dialog.showOpenDialog()`, `dialog.showSaveDialog()`, `shell.openExternal()`.
 * CLI: uses terminal prompts, file-path input, and system `open` command.
 */
export interface UserInteraction {
  /**
   * Show an error dialog/message to the user.
   */
  showError(title: string, message: string): void;

  /**
   * Show a warning dialog/message to the user.
   */
  showWarning(title: string, message: string): void;

  /**
   * Show an informational dialog/message to the user.
   */
  showInfo(title: string, message: string): void;

  /**
   * Prompt the user to pick one or more files.
   * Returns the selected file path(s), or null if cancelled.
   */
  pickFile(options: FilePickerOptions): Promise<string[] | null>;

  /**
   * Prompt the user to save a file to a specific location.
   * Returns the chosen file path, or null if cancelled.
   */
  saveFile(options: FileSaveOptions): Promise<string | null>;

  /**
   * Request user approval for an action (e.g., tool execution).
   * Returns true if approved, false if denied.
   */
  requestApproval(request: ApprovalRequest): Promise<boolean>;

  /**
   * Open an external URL in the user's default browser.
   */
  openExternal(url: string): Promise<void>;

  /**
   * Show a confirmation dialog (yes/no).
   * Returns true if confirmed, false otherwise.
   */
  confirm(title: string, message: string): Promise<boolean>;
}

export interface FilePickerOptions {
  /** Dialog title */
  title?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** File type filters (e.g., [{ name: 'JSON', extensions: ['json'] }]) */
  filters?: Array<{ name: string; extensions: string[] }>;
  /** Default path to open */
  defaultPath?: string;
}

export interface FileSaveOptions {
  /** Dialog title */
  title?: string;
  /** Default file name */
  defaultName?: string;
  /** File type filters */
  filters?: Array<{ name: string; extensions: string[] }>;
  /** Default path to open */
  defaultPath?: string;
}

export interface ApprovalRequest {
  /** Name of the tool or action requiring approval */
  toolName: string;
  /** Arguments or details of the action */
  args: Record<string, unknown>;
  /** Optional description for the user */
  description?: string;
}
