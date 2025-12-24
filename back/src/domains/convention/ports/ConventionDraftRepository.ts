import type { ConventionDraftDto, ConventionDraftId, DateString } from "shared";

export interface ConventionDraftRepository {
  getById: (id: ConventionDraftId) => Promise<ConventionDraftDto | undefined>;
  save: (conventionDraft: ConventionDraftDto, now: DateString) => Promise<void>;
}
