import {
  ConventionId,
  ConventionReadDto,
  ConventionScope,
  ConventionStatus,
  FindSimilarConventionsParams,
  ListConventionsRequestDto,
} from "shared";
import { AssessmentEmailDomainTopic } from "../../core/eventBus/events";

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
  getAllConventionsForThoseEndingThatDidntGoThroughSendingTopic: (
    dateEnd: Date,
    sendingTopic: AssessmentEmailDomainTopic,
  ) => Promise<ConventionReadDto[]>;

  getConventionsByFilters(
    filters: GetConventionsByFiltersQueries,
  ): Promise<ConventionReadDto[]>;

  getConventionsByScope(params: {
    scope: ConventionScope;
    limit: number;
    filters: GetConventionsByFiltersQueries;
  }): Promise<ConventionReadDto[]>;
  findSimilarConventions(
    params: FindSimilarConventionsParams,
  ): Promise<ConventionId[]>;
}
