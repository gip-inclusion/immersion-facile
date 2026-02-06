import type { ConventionDraftDto, ConventionDraftId, DateString } from "shared";

export type DeleteConventionDraftFilters = {
  ids?: ConventionDraftId[];
  endedSince?: Date;
};

export interface ConventionDraftRepository {
  getById: (id: ConventionDraftId) => Promise<ConventionDraftDto | undefined>;
  save: (conventionDraft: ConventionDraftDto, now: DateString) => Promise<void>;
  delete: (
    filters: DeleteConventionDraftFilters,
  ) => Promise<ConventionDraftId[]>;
}
