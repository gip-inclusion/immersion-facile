import {
  ConventionId,
  ConventionReadDto,
  ListConventionsRequestDto,
} from "shared";

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
}
