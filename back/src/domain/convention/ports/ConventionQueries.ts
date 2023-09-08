import {
  ConventionId,
  ConventionReadDto,
  ConventionScope,
  ConventionStatus,
  ListConventionsRequestDto,
} from "shared";

export type GetConventionsByFiltersQueries = {
  startDateGreater?: Date;
  startDateLessOrEqual?: Date;
  withStatuses?: ConventionStatus[];
};

export interface ConventionQueries {
  getLatestConventions: (
    requestDto: ListConventionsRequestDto,
  ) => Promise<ConventionReadDto[]>;
  getConventionById: (
    id: ConventionId,
  ) => Promise<ConventionReadDto | undefined>;
  getAllConventionsForThoseEndingThatDidntReceivedAssessmentLink: (
    dateEnd: Date,
  ) => Promise<ConventionReadDto[]>;

  getConventionsByFilters(
    filters: GetConventionsByFiltersQueries,
  ): Promise<ConventionReadDto[]>;

  getConventionsByScope(params: {
    scope: ConventionScope;
    limit: number;
    filters: GetConventionsByFiltersQueries;
  }): Promise<ConventionReadDto[]>;
}
