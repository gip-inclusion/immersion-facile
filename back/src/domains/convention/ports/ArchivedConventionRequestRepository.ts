import type {
  AppellationCode,
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
  getAll: () => Promise<ArchivedConventionRequestEntity[]>;
}
