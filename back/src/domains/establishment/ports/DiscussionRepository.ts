import {
  AppellationCode,
  DiscussionDto,
  DiscussionId,
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

export interface DiscussionRepository {
  insert: (discussion: DiscussionDto) => Promise<void>;
  update: (discussion: DiscussionDto) => Promise<void>;
  getById: (discussionId: DiscussionId) => Promise<DiscussionDto | undefined>;
  countDiscussionsForSiretSince: (
    siret: SiretDto,
    since: Date,
  ) => Promise<number>;
  hasDiscussionMatching: (
    params: Partial<HasDiscussionMatchingParams>,
  ) => Promise<boolean>;
}
