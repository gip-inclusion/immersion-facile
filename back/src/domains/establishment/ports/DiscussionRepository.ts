import type {
  AppellationCode,
  ContactMode,
  DataWithPagination,
  DateRange,
  DiscussionDto,
  DiscussionId,
  DiscussionInList,
  DiscussionOrderKey,
  DiscussionStatus,
  Email,
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
    answeredByEstablishment?: boolean;
    createdBetween?: DateRange;
    createdSince?: Date;
    contactMode?: ContactMode;
    status?: DiscussionStatus;
    sirets?: SiretDto[];
  };
  limit: number;
};

export type GetPaginatedDiscussionsForUserParams = {
  filters?: {
    statuses?: DiscussionStatus[];
    search?: string;
  };
  order: {
    by: DiscussionOrderKey;
    direction: "asc" | "desc";
  };
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
  getObsoleteDiscussions: (params: {
    olderThan: Date;
  }) => Promise<DiscussionId[]>;
}
