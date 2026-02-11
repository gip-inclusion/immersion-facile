import type { ConventionDraftDto, ConventionDraftId, DateString } from "shared";

export type GetConventionDraftFilters = {
  ids?: ConventionDraftId[];
  lastUpdatedAt?: Date;
};

export interface ConventionDraftRepository {
  getById: (id: ConventionDraftId) => Promise<ConventionDraftDto | undefined>;
  getConventionDraftIdsByFilters: (
    filters: GetConventionDraftFilters,
  ) => Promise<ConventionDraftId[]>;
  save: (conventionDraft: ConventionDraftDto, now: DateString) => Promise<void>;
  delete: (ids: ConventionDraftId[]) => Promise<void>;
}
