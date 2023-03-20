import { propEq } from "ramda";
import {
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  ListConventionsRequestDto,
  validatedConventionStatuses,
  WithConventionId,
} from "shared";
import {
  ConventionQueries,
  GetConventionByFiltersQueries,
} from "../../domain/convention/ports/ConventionQueries";
import { createLogger } from "../../utils/logger";
import { InMemoryOutboxRepository } from "./core/InMemoryOutboxRepository";
import { InMemoryConventionRepository } from "./InMemoryConventionRepository";

export const TEST_AGENCY_NAME = "TEST_AGENCY_NAME";
export const TEST_AGENCY_DEPARTMENT = "75-test";
const logger = createLogger(__filename);

export class InMemoryConventionQueries implements ConventionQueries {
  constructor(
    private readonly conventionRepository: InMemoryConventionRepository,
    private readonly outboxRepository?: InMemoryOutboxRepository,
  ) {}

  async getConventionsByFilters({
    startDateGreater,
    startDateLessOrEqual,
    withStatuses,
  }: GetConventionByFiltersQueries): Promise<ConventionDto[]> {
    return Object.values(this.conventionRepository._conventions)
      .filter((convention) =>
        startDateLessOrEqual
          ? new Date(convention.dateStart) <= startDateLessOrEqual
          : true,
      )
      .filter((convention) =>
        startDateGreater
          ? new Date(convention.dateStart) > startDateGreater
          : true,
      )
      .filter((convention) =>
        withStatuses && withStatuses.length > 0
          ? withStatuses.includes(convention.status)
          : true,
      );
  }

  public async getLatestConventions({
    status,
    agencyId,
  }: ListConventionsRequestDto): Promise<ConventionReadDto[]> {
    logger.info("getAll");
    return Object.values(this.conventionRepository._conventions)
      .filter((dto) => !status || dto.status === status)
      .filter((dto) => !agencyId || dto.agencyId === agencyId)
      .map((dto) => ({
        ...dto,
        agencyName: TEST_AGENCY_NAME,
        agencyDepartment: TEST_AGENCY_DEPARTMENT,
      }));
  }

  public async getConventionById(
    id: ConventionId,
  ): Promise<ConventionReadDto | undefined> {
    logger.info("getAll");
    const storedConvention = this.conventionRepository.conventions.find(
      propEq("id", id),
    );
    return (
      storedConvention && {
        ...storedConvention,
        agencyName: TEST_AGENCY_NAME,
        agencyDepartment: TEST_AGENCY_DEPARTMENT,
      }
    );
  }

  public async getAllConventionsForThoseEndingThatDidntReceivedAssessmentLink(
    dateEnd: Date,
  ): Promise<ConventionReadDto[]> {
    const immersionIdsThatAlreadyGotAnEmail = this.outboxRepository
      ? this.outboxRepository.events
          .filter(propEq("topic", "EmailWithLinkToCreateAssessmentSent"))
          .map((event) => (event.payload as WithConventionId).id)
      : [];
    return Object.values(this.conventionRepository._conventions)
      .filter(
        (convention) =>
          new Date(convention.dateEnd).getDate() === dateEnd.getDate() &&
          validatedConventionStatuses.includes(convention.status) &&
          !immersionIdsThatAlreadyGotAnEmail.includes(convention.id),
      )
      .map((convention) => ({
        ...convention,
        agencyName: TEST_AGENCY_NAME,
        agencyDepartment: TEST_AGENCY_DEPARTMENT,
      }));
  }
}
