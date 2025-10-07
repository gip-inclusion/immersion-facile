import type {
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  ConventionScope,
  ConventionStatus,
  DataWithPagination,
  DateRange,
  DateString,
  FindSimilarConventionsParams,
  GetConventionsForAgencyUserParams,
  NumberEmployeesRange,
  PaginationQueryParams,
  SiretDto,
  UserId,
} from "shared";

export type GetConventionsFilters = {
  ids?: ConventionId[];
  startDateGreater?: Date;
  startDateLessOrEqual?: Date;
  dateSubmissionEqual?: Date;
  dateSubmissionSince?: Date;
  endDate?: Partial<DateRange>;
  updateDate?: Partial<DateRange>;
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

export type ConventionMarketingData = {
  siret: SiretDto;
  dateValidation?: DateString;
  dateEnd: DateString;
  establishmentRepresentative: {
    email: string;
    firstName: string;
    lastName: string;
  };
  establishmentNumberEmployeesRange?: NumberEmployeesRange;
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
  ): Promise<DataWithPagination<ConventionReadDto>>;

  // TODO: a voir si on veut pas à terme unifier en une seule query les 3 queries si dessous
  getConventions(params: GetConventionsParams): Promise<ConventionDto[]>;
  getConventionsByScope(params: {
    scope: ConventionScope;
    limit: number;
    filters: GetConventionsFilters;
  }): Promise<ConventionReadDto[]>;

  getConventionsMarketingData(params: {
    siret: SiretDto;
  }): Promise<ConventionMarketingData[]>;
}
