import {
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  ConventionScope,
  ConventionStatus,
  FindSimilarConventionsParams,
  SiretDto,
} from "shared";
import { AssessmentEmailDomainTopic } from "../../core/events/events";

export type GetConventionsByFiltersQueries = {
  startDateGreater?: Date;
  startDateLessOrEqual?: Date;
  dateSubmissionEqual?: Date;
  dateSubmissionSince?: Date;
  withStatuses?: ConventionStatus[];
  withSirets?: SiretDto[];
};

export interface ConventionQueries {
  getConventionById: (
    id: ConventionId,
  ) => Promise<ConventionReadDto | undefined>;
  getAllConventionsForThoseEndingThatDidntGoThrough: (
    dateEnd: Date,
    sendingTopic: AssessmentEmailDomainTopic,
  ) => Promise<ConventionDto[]>;

  getConventionsByFilters(
    filters: GetConventionsByFiltersQueries,
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
