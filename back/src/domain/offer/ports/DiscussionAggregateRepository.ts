import { AppellationCode, DiscussionId, Email, SiretDto } from "shared";
import { DiscussionAggregate } from "../entities/DiscussionAggregate";

export type HasDiscussionMatchingParams = {
  siret: SiretDto;
  appellationCode: AppellationCode;
  potentialBeneficiaryEmail: Email;
  since: Date;
};

export interface DiscussionAggregateRepository {
  insert: (discussionAggregate: DiscussionAggregate) => Promise<void>;
  update: (discussionAggregate: DiscussionAggregate) => Promise<void>;
  getById: (
    discussionId: DiscussionId,
  ) => Promise<DiscussionAggregate | undefined>;
  countDiscussionsForSiretSince: (
    siret: SiretDto,
    since: Date,
  ) => Promise<number>;
  hasDiscussionMatching: (
    params: HasDiscussionMatchingParams,
  ) => Promise<boolean>;
}
