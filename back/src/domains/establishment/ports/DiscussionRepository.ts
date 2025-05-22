import type {
  AppellationCode,
  DataWithPagination,
  DateRange,
  DiscussionDto,
  DiscussionId,
  DiscussionInList,
  DiscussionStatus,
  Email,
  GetPaginatedDiscussionsParams,
  LocationId,
  PaginationQueryParams,
  SiretDto,
  UserId,
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
    statuses?: [DiscussionStatus, ...DiscussionStatus[]];
    sirets?: SiretDto[];
    createdSince?: Date;
    createdBetween?: DateRange;
    answeredByEstablishment?: boolean;
  };
  limit: number;
};

export type GetPaginatedDiscussionsForUserParams =
  GetPaginatedDiscussionsParams & {
    pagination: Required<PaginationQueryParams>;
    userId: UserId;
  };

export interface DiscussionRepository {
  insert: (discussion: DiscussionDto) => Promise<void>;
  update: (discussion: DiscussionDto) => Promise<void>;
  getById: (discussionId: DiscussionId) => Promise<DiscussionDto | undefined>;
  getDiscussions(params: GetDiscussionsParams): Promise<DiscussionDto[]>;
  getPaginatedDiscussionsForUser: (
    params: GetPaginatedDiscussionsForUserParams,
  ) => Promise<DataWithPagination<DiscussionInList>>;
  countDiscussionsForSiretSince: (
    siret: SiretDto,
    since: Date,
  ) => Promise<number>;
  hasDiscussionMatching: (
    params: Partial<HasDiscussionMatchingParams>,
  ) => Promise<boolean>;
}
