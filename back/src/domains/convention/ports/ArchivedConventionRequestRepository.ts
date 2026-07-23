import type {
  ArchivedConventionRequestFormDto,
  DateString,
  UserId,
} from "shared";

export type ArchivedConventionRequestEntity = ArchivedConventionRequestFormDto & {
  userId: UserId;
  createdAt: DateString;
};

export interface ArchivedConventionRequestRepository {
  save: (
    archivedConventionRequest: ArchivedConventionRequestEntity,
  ) => Promise<void>;
  getAll: () => Promise<ArchivedConventionRequestEntity[]>;
}
