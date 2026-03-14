// Re-export from shared package — the canonical source is @dotagents/shared
export {
  DEFAULT_STT_MODELS,
  KNOWN_STT_MODEL_IDS,
  isCloudSttProvider,
  isKnownSttModel,
  getDefaultSttModel,
  getConfiguredSttModel,
} from "@dotagents/shared"
export type { CloudSttProviderId, SttModelConfig } from "@dotagents/shared"
