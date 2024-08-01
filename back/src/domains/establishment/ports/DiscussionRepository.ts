import {
  AppellationCode,
  DiscussionDto,
  DiscussionId,
  DiscussionStatus,
  Email,
  LocationId,
  SiretDto,
} from "shared";

export type HasDiscussionMatchingParams = {
  siret: SiretDto;
  appellationCode: AppellationCode;
  potentialBeneficiaryEmail: Email;
  establishmentRepresentativeEmail: Email;
  since: Date;
  addressId: LocationId;
};

export type GetDiscussionsParams = {
  filters: {
    status?: DiscussionStatus;
    sirets?: SiretDto[];
    createdSince?: Date;
    lastAnsweredByCandidate?: { from: Date; to: Date };
  };
  limit: number;
};

export interface DiscussionRepository {
  insert: (discussion: DiscussionDto) => Promise<void>;
  update: (discussion: DiscussionDto) => Promise<void>;
  getById: (discussionId: DiscussionId) => Promise<DiscussionDto | undefined>;
  getDiscussions(params: GetDiscussionsParams): Promise<DiscussionDto[]>;
  countDiscussionsForSiretSince: (
    siret: SiretDto,
    since: Date,
  ) => Promise<number>;
  hasDiscussionMatching: (
    params: Partial<HasDiscussionMatchingParams>,
  ) => Promise<boolean>;
}
