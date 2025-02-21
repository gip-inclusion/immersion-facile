type CrispMetadata = {
  email: string;
  segments: string[];
  nickname?: string;
  subject?: string;
};

export type InitiateCrispConversationParams = {
  message: string;
  metadata: CrispMetadata;
  helperNote: string;
};

export interface CrispApi {
  initiateConversation: (
    params: InitiateCrispConversationParams,
  ) => Promise<void>;
}

export type CrispConfig = {
  id: string;
  key: string;
  websiteId: string;
};
