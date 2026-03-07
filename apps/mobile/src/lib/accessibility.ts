const FALLBACK_SWITCH_LABEL = 'Setting toggle';
const FALLBACK_SERVER_LABEL = 'Enable MCP server';
const FALLBACK_BUTTON_LABEL = 'Action button';
const DEFAULT_TOUCH_TARGET_SIZE = 44;
const DEFAULT_TOUCH_TARGET_PADDING = 6;
const DEFAULT_TOUCH_TARGET_GAP = 2;

const normalizeLabel = (label: string): string => {
  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed : '';
};

export const createSwitchAccessibilityLabel = (settingName: string): string => {
  const normalizedName = normalizeLabel(settingName);
  if (!normalizedName) {
    return FALLBACK_SWITCH_LABEL;
  }
  return `${normalizedName} toggle`;
};

export const createMcpServerSwitchAccessibilityLabel = (serverName: string): string => {
  const normalizedServerName = normalizeLabel(serverName);
  if (!normalizedServerName) {
    return FALLBACK_SERVER_LABEL;
  }
  return `Enable ${normalizedServerName} MCP server`;
};

export const createButtonAccessibilityLabel = (actionName: string): string => {
  const normalizedName = normalizeLabel(actionName);
  if (!normalizedName) {
    return FALLBACK_BUTTON_LABEL;
  }
  return `${normalizedName} button`;
};

export const createMinimumTouchTargetStyle = ({
  minSize = DEFAULT_TOUCH_TARGET_SIZE,
  horizontalPadding = DEFAULT_TOUCH_TARGET_PADDING,
  verticalPadding = DEFAULT_TOUCH_TARGET_PADDING,
  horizontalMargin = DEFAULT_TOUCH_TARGET_GAP,
}: {
  minSize?: number;
  horizontalPadding?: number;
  verticalPadding?: number;
  horizontalMargin?: number;
} = {}) => ({
  minWidth: minSize,
  minHeight: minSize,
  paddingHorizontal: horizontalPadding,
  paddingVertical: verticalPadding,
  marginHorizontal: horizontalMargin,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

