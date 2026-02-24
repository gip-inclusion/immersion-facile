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
  OptionalDateRange,
  SiretDto,
  UserId,
  WithRequiredPagination,
  WithSort,
} from "shared";

export type HasDiscussionMatchingParams = {
  siret: SiretDto;
  appellationCode: AppellationCode;
  potentialBeneficiaryEmail: Email;
  since: Date;
  addressId: LocationId;
};

export type GetDiscussionIdsParams = {
  filters: {
    updatedBetween?: OptionalDateRange;
    statuses?: DiscussionStatus[];
  };
  orderBy: "updatedAt";
  limit: number;
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

export type GetPaginatedDiscussionsForUserParams = WithRequiredPagination &
  WithSort<DiscussionOrderKey> & {
    filters?: {
      statuses?: DiscussionStatus[];
      search?: string;
    };
    userId: UserId;
  };

export interface DiscussionRepository {
  getUserIdsWithNoRecentExchange(params: {
    userIds: UserId[];
    since: Date;
  }): Promise<UserId[]>;
  insert: (discussion: DiscussionDto) => Promise<void>;
  update: (discussion: DiscussionDto) => Promise<void>;
  archiveDiscussions: (discussionIds: DiscussionId[]) => Promise<void>;
  getById: (discussionId: DiscussionId) => Promise<DiscussionDto | undefined>;
  getDiscussionIds(params: GetDiscussionIdsParams): Promise<DiscussionId[]>;
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
