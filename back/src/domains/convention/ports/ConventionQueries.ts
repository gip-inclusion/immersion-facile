import {
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  ConventionScope,
  ConventionStatus,
  ExtractFromExisting,
  FindSimilarConventionsParams,
  SiretDto,
  TemplatedEmail,
} from "shared";

export type GetConventionsByFiltersQueries = {
  startDateGreater?: Date;
  startDateLessOrEqual?: Date;
  dateSubmissionEqual?: Date;
  dateSubmissionSince?: Date;
  withStatuses?: ConventionStatus[];
  withSirets?: SiretDto[];
};

export type AssessmentEmailKind = ExtractFromExisting<
  TemplatedEmail["kind"],
  | "ESTABLISHMENT_ASSESSMENT_NOTIFICATION"
  | "BENEFICIARY_ASSESSMENT_NOTIFICATION"
>;

export type ConventionSortByDate = keyof Pick<
  ConventionDto,
  "dateValidation" | "dateStart"
>;

export interface ConventionQueries {
  getConventionById: (
    id: ConventionId,
  ) => Promise<ConventionReadDto | undefined>;
  getAllConventionsForThoseEndingThatDidntGoThrough: (
    dateEnd: Date,
    assessmentEmailKind: AssessmentEmailKind,
  ) => Promise<ConventionDto[]>;

  getConventionsByFilters(
    filters: GetConventionsByFiltersQueries,
    sortByDate?: ConventionSortByDate,
  ): Promise<ConventionDto[]>;

  getConventionsByScope(params: {
    scope: ConventionScope;
    limit: number;
    filters: GetConventionsByFiltersQueries;
  }): Promise<ConventionReadDto[]>;
  findSimilarConventions(
    params: FindSimilarConventionsParams,
  ): Promise<ConventionId[]>;
}
