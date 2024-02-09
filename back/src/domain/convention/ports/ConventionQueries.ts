import {
  ConventionId,
  ConventionReadDto,
  ConventionScope,
  ConventionStatus,
  FindSimilarConventionsParams,
  SiretDto,
} from "shared";
import { AssessmentEmailDomainTopic } from "../../core/eventBus/events";

export type GetConventionsByFiltersQueries = {
  startDateGreater?: Date;
  startDateLessOrEqual?: Date;
  dateSubmissionEqual?: Date;
  withStatuses?: ConventionStatus[];
  withSirets?: SiretDto[];
};

export interface ConventionQueries {
  getLatestConventionBySirets: (
    sirets: [SiretDto, ...SiretDto[]],
  ) => Promise<ConventionReadDto[]>;
  getConventionById: (
    id: ConventionId,
  ) => Promise<ConventionReadDto | undefined>;
  getAllConventionsForThoseEndingThatDidntGoThrough: (
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
