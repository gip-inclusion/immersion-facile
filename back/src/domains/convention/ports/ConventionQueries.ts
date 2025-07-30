import type {
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  ConventionScope,
  ConventionStatus,
  DataWithPagination,
  DateRange,
  ExtractFromExisting,
  FindSimilarConventionsParams,
  GetConventionsForAgencyUserParams,
  PaginationQueryParams,
  SiretDto,
  TemplatedEmail,
  UserId,
} from "shared";

export type GetConventionsFilters = {
  startDateGreater?: Date;
  startDateLessOrEqual?: Date;
  dateSubmissionEqual?: Date;
  dateSubmissionSince?: Date;
  endDate?: Partial<DateRange>;
  updateDate?: Partial<DateRange>;
  withStatuses?: ConventionStatus[];
  withSirets?: SiretDto[];
};

export type AssessmentEmailKind = ExtractFromExisting<
  TemplatedEmail["kind"],
  | "ASSESSMENT_ESTABLISHMENT_NOTIFICATION"
  | "ASSESSMENT_BENEFICIARY_NOTIFICATION"
  | "ASSESSMENT_AGENCY_NOTIFICATION"
>;

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

export interface ConventionQueries {
  getConventionById: (
    id: ConventionId,
  ) => Promise<ConventionReadDto | undefined>;
  findSimilarConventions(
    params: FindSimilarConventionsParams,
  ): Promise<ConventionId[]>;

  getPaginatedConventionsForAgencyUser(
    params: GetPaginatedConventionsForAgencyUserParams,
  ): Promise<DataWithPagination<ConventionDto>>;

  // TODO: a voir si on veut pas à terme unifier en une seule query les 3 queries si dessous
  getConventions(params: GetConventionsParams): Promise<ConventionDto[]>;
  getConventionsByScope(params: {
    scope: ConventionScope;
    limit: number;
    filters: GetConventionsFilters;
  }): Promise<ConventionReadDto[]>;
}
