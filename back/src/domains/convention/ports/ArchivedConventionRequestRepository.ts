import type {
  AppellationCode,
  ArchivedConventionRequestId,
  ArchivedConventionRequestWithConventionDetailsFormDto,
  ArchivedConventionRequestWithConventionIdFormDto,
  DateString,
  UserId,
} from "shared";

export type ArchivedConventionRequestEntity = (
  | ArchivedConventionRequestWithConventionIdFormDto
  | (Omit<
      ArchivedConventionRequestWithConventionDetailsFormDto,
      "immersionAppellation"
    > & {
      immersionAppellationCode: AppellationCode;
    })
) & {
  userId: UserId;
  createdAt: DateString;
};

export interface ArchivedConventionRequestRepository {
  save: (
    archivedConventionRequest: ArchivedConventionRequestEntity,
  ) => Promise<void>;
  getById: (
    id: ArchivedConventionRequestId,
  ) => Promise<ArchivedConventionRequestEntity | undefined>;
  getAll: () => Promise<ArchivedConventionRequestEntity[]>;
}
