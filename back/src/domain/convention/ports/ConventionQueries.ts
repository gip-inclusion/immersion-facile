import {
  ConventionId,
  ConventionReadDto,
  ConventionStatus,
  ListConventionsRequestDto,
} from "shared";

export type GetConventionByFiltersQueries = {
  startDateGreater?: Date;
  startDateLessOrEqual?: Date;
  withStatuses?: ConventionStatus[];
};

export interface ConventionQueries {
  getConventionsByFilters(
    filters: GetConventionByFiltersQueries,
  ): Promise<ConventionReadDto[]>;
  getLatestConventions: (
    requestDto: ListConventionsRequestDto,
  ) => Promise<ConventionReadDto[]>;
  getConventionById: (
    id: ConventionId,
  ) => Promise<ConventionReadDto | undefined>;
  getAllConventionsForThoseEndingThatDidntReceivedAssessmentLink: (
    dateEnd: Date,
  ) => Promise<ConventionReadDto[]>;
}
