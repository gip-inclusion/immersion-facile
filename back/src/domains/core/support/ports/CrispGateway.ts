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

export interface CrispGateway {
  initiateConversation: (
    params: InitiateCrispConversationParams,
  ) => Promise<void>;
}
