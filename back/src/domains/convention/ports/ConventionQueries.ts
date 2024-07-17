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

export type GetConventionsFilters = {
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

export type GetConventionsSortBy = keyof Pick<
  ConventionDto,
  "dateValidation" | "dateStart"
>;

export type GetConventionsParams = {
  filters: GetConventionsFilters;
  sortBy: GetConventionsSortBy;
};

export interface ConventionQueries {
  getConventionById: (
    id: ConventionId,
  ) => Promise<ConventionReadDto | undefined>;
  findSimilarConventions(
    params: FindSimilarConventionsParams,
  ): Promise<ConventionId[]>;

  // TODO: a voir si on veut pas à terme unifier en une seule query les 3 queries si dessous
  getConventions(params: GetConventionsParams): Promise<ConventionDto[]>;
  getAllConventionsForThoseEndingThatDidntGoThrough: (
    dateEnd: Date,
    assessmentEmailKind: AssessmentEmailKind,
  ) => Promise<ConventionDto[]>;
  getConventionsByScope(params: {
    scope: ConventionScope;
    limit: number;
    filters: GetConventionsFilters;
  }): Promise<ConventionReadDto[]>;
}
