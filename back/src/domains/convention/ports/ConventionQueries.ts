import type {
  AgencyId,
  AppellationCode,
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  ConventionScope,
  ConventionStatus,
  ConventionsWithErroredBroadcastFeedbackFilters,
  ConventionWithBroadcastFeedback,
  DataWithPagination,
  DateString,
  Email,
  GetConventionsForAgencyUserParams,
  OptionalDateRange,
  PaginationQueryParams,
  SiretDto,
  UserId,
} from "shared";

export type GetConventionsFilters = {
  agencyId?: AgencyId;
  ids?: ConventionId[];
  startDateGreater?: Date;
  startDateLessOrEqual?: Date;
  dateSubmissionEqual?: Date;
  dateSubmissionSince?: Date;
  endDate?: OptionalDateRange;
  updateDate?: OptionalDateRange;
  withStatuses?: ConventionStatus[];
  withSirets?: SiretDto[];
};

export type GetConventionsSortBy = keyof Pick<
  ConventionDto,
  "dateValidation" | "dateStart"
>;

export type GetConventionsParams = {
  filters: GetConventionsFilters;
  sortBy: GetConventionsSortBy;
};

export type GetPaginatedConventionsForAgencyUserParams =
  GetConventionsForAgencyUserParams & {
    agencyUserId: UserId;
    pagination: Required<PaginationQueryParams>;
  };

export type GetConventionIdsParams = {
  filters: {
    withAppelationCodes?: AppellationCode[];
    withDateStart?: OptionalDateRange;
    withSirets?: SiretDto[];
    withStatuses?: ConventionStatus[];
    withBeneficiary?: {
      birthdate?: DateString;
      lastName?: string;
    };
    withEstablishmentRepresentative?: {
      email?: Email;
    };
    withEstablishmentTutor?: {
      email?: Email;
    };
  };
  limit?: number;
};

export interface ConventionQueries {
  getConventionIdsByFilters(
    params: GetConventionIdsParams,
  ): Promise<ConventionId[]>;

  getConventionById: (
    id: ConventionId,
  ) => Promise<ConventionReadDto | undefined>;

  getPaginatedConventionsForAgencyUser(
    params: GetPaginatedConventionsForAgencyUserParams,
  ): Promise<DataWithPagination<ConventionReadDto>>;

  // TODO: a voir si on veut pas à terme unifier en une seule query les 3 queries si dessous
  getConventions(params: GetConventionsParams): Promise<ConventionDto[]>;
  getConventionsByScope(params: {
    scope: ConventionScope;
    limit: number;
    filters: GetConventionsFilters;
  }): Promise<ConventionReadDto[]>;

  getConventionsWithErroredBroadcastFeedbackForAgencyUser(params: {
    userAgencyIds: AgencyId[];
    pagination: PaginationQueryParams;
    filters?: ConventionsWithErroredBroadcastFeedbackFilters;
  }): Promise<DataWithPagination<ConventionWithBroadcastFeedback>>;
}
