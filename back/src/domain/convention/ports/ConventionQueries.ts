import {
  ConventionId,
  ConventionReadDto,
  ConventionScope,
  ConventionStatus,
  ListConventionsRequestDto,
} from "shared";

export type GetConventionByFiltersQueries = {
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
    filters: GetConventionByFiltersQueries,
  ): Promise<ConventionReadDto[]>;

  getConventionsByScope(scope: ConventionScope): Promise<ConventionReadDto[]>;
}
