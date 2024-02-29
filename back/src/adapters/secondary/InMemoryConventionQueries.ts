import { addDays, isBefore } from "date-fns";
import subDays from "date-fns/subDays";
import { propEq } from "ramda";
import {
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  ConventionScope,
  FindSimilarConventionsParams,
  SiretDto,
  WithConventionIdLegacy,
  validatedConventionStatuses,
} from "shared";
import { InMemoryAgencyRepository } from "../../domains/agency/adapters/InMemoryAgencyRepository";
import {
  ConventionQueries,
  GetConventionsByFiltersQueries,
} from "../../domains/convention/ports/ConventionQueries";
import { missingAgencyMessage } from "../../domains/convention/useCases/notifications/NotifyLastSigneeThatConventionHasBeenSigned";
import { InMemoryOutboxRepository } from "../../domains/core/events/adapters/InMemoryOutboxRepository";
import { AssessmentEmailDomainTopic } from "../../domains/core/events/events";
import { createLogger } from "../../utils/logger";
import { NotFoundError } from "../primary/helpers/httpErrors";
import { InMemoryConventionRepository } from "./InMemoryConventionRepository";

const logger = createLogger(__filename);

export class InMemoryConventionQueries implements ConventionQueries {
  constructor(
    private readonly conventionRepository: InMemoryConventionRepository,
    private readonly agencyRepository: InMemoryAgencyRepository,
    private readonly outboxRepository?: InMemoryOutboxRepository,
  ) {}

  public async findSimilarConventions(
    params: FindSimilarConventionsParams,
  ): Promise<ConventionId[]> {
    const dateStartToMatch = new Date(params.dateStart);

    return this.conventionRepository.conventions
      .filter(
        ({
          siret,
          immersionAppellation,
          dateStart,
          signatories: { beneficiary },
        }) =>
          siret === params.siret &&
          immersionAppellation.appellationCode === params.codeAppellation &&
          beneficiary.birthdate === params.beneficiaryBirthdate &&
          beneficiary.lastName === params.beneficiaryLastName &&
          dateStartToMatch >= subDays(new Date(dateStart), 7) &&
          dateStartToMatch <= addDays(new Date(dateStart), 7),
      )
      .map((convention) => convention.id);
  }

  public async getAllConventionsForThoseEndingThatDidntGoThrough(
    dateEnd: Date,
    sendingTopic: AssessmentEmailDomainTopic,
  ): Promise<ConventionReadDto[]> {
    const immersionIdsThatAlreadyGotAnEmail = this.outboxRepository
      ? this.outboxRepository.events
          .filter(propEq("topic", sendingTopic))
          .map((event) => (event.payload as WithConventionIdLegacy).id)
      : [];
    return this.conventionRepository.conventions
      .filter(
        (convention) =>
          new Date(convention.dateEnd).getDate() === dateEnd.getDate() &&
          validatedConventionStatuses.includes(convention.status) &&
          !immersionIdsThatAlreadyGotAnEmail.includes(convention.id),
      )
      .map((convention) => this.#addAgencyDataToConvention(convention));
  }

  public async getConventionById(
    id: ConventionId,
  ): Promise<ConventionReadDto | undefined> {
    logger.info("getAll");
    const convention = this.conventionRepository.conventions.find(
      propEq("id", id),
    );
    if (!convention) return;

    return this.#addAgencyDataToConvention(convention);
  }

  public async getConventionsByFilters(
    filters: GetConventionsByFiltersQueries,
  ): Promise<ConventionReadDto[]> {
    return this.conventionRepository.conventions
      .filter(makeApplyFiltersToConventions(filters))
      .map((convention) => this.#addAgencyDataToConvention(convention));
  }

  public async getConventionsByScope(params: {
    scope: ConventionScope;
    limit: number;
    filters: GetConventionsByFiltersQueries;
  }): Promise<ConventionReadDto[]> {
    return this.conventionRepository.conventions
      .filter((convention) => {
        //TODO : dépendance agency repo dans convention repo à gérer plutot dans le usecase pour garder le repo convention indépendant
        const agency = this.agencyRepository.agencies.find(
          (agency) => agency.id === convention.agencyId,
        );

        if (!agency) throw new NotFoundError("agency not found");

        return (
          params.scope.agencyKinds?.includes(agency.kind) ||
          params.scope.agencyIds?.includes(agency.id)
        );
      })
      .filter(makeApplyFiltersToConventions(params.filters))
      .map((convention) => this.#addAgencyDataToConvention(convention));
  }

  public async getLatestConventionBySirets(
    sirets: SiretDto[],
  ): Promise<ConventionReadDto[]> {
    const latestConventionsBySiret = this.conventionRepository.conventions
      .filter(
        (conventionDto) =>
          sirets?.includes(conventionDto.siret) &&
          !!conventionDto.dateValidation,
      )
      .map((conventionDto) => this.#addAgencyDataToConvention(conventionDto))
      .reduce((acc: Record<SiretDto, ConventionReadDto>, conventionReadDto) => {
        const dateFromCurrentConvention =
          acc[conventionReadDto.siret]?.dateValidation;
        const dateFromIncomingConvention = conventionReadDto.dateValidation;

        if (
          !acc[conventionReadDto.siret] ||
          (dateFromCurrentConvention &&
            dateFromIncomingConvention &&
            isBefore(
              new Date(dateFromCurrentConvention),
              new Date(dateFromIncomingConvention),
            ))
        )
          return {
            ...acc,
            [conventionReadDto.siret]: conventionReadDto,
          };

        return acc;
      }, {});

    return Object.values(latestConventionsBySiret);
  }

  #addAgencyDataToConvention = (
    convention: ConventionDto,
  ): ConventionReadDto => {
    const agency = this.agencyRepository.agencies.find(
      (agency) => agency.id === convention.agencyId,
    );

    if (!agency) throw new NotFoundError(missingAgencyMessage(convention));

    const referedAgency =
      agency?.refersToAgencyId &&
      this.agencyRepository.agencies.find(
        (agency) => agency.id === agency.refersToAgencyId,
      );

    return {
      ...convention,
      agencyName: agency.name,
      agencyDepartment: agency.address.departmentCode,
      agencyKind: agency.kind,
      agencySiret: agency.agencySiret,
      agencyCounsellorEmails: agency.counsellorEmails,
      agencyValidatorEmails: agency.validatorEmails,
      agencyRefersTo: referedAgency
        ? {
            id: referedAgency.id,
            name: referedAgency.name,
          }
        : undefined,
    };
  };
}

const makeApplyFiltersToConventions =
  ({
    startDateLessOrEqual,
    startDateGreater,
    withStatuses,
    dateSubmissionEqual,
  }: GetConventionsByFiltersQueries) =>
  (convention: ConventionDto) => {
    if (
      dateSubmissionEqual &&
      new Date(convention.dateSubmission).getTime() !==
        dateSubmissionEqual.getTime()
    )
      return false;

    if (
      startDateLessOrEqual &&
      new Date(convention.dateStart) > startDateLessOrEqual
    )
      return false;

    if (startDateGreater && new Date(convention.dateStart) <= startDateGreater)
      return false;

    if (
      withStatuses &&
      withStatuses.length > 0 &&
      !withStatuses.includes(convention.status)
    )
      return false;

    return true;
  };
