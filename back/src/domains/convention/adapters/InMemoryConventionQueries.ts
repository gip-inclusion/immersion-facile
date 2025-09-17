import { addDays, isBefore } from "date-fns";
import subDays from "date-fns/subDays";
import { propEq, toPairs } from "ramda";
import {
  type ConventionDto,
  type ConventionId,
  type ConventionReadDto,
  type ConventionScope,
  type ConventionStatus,
  conventionSchema,
  type DataWithPagination,
  errors,
  type FindSimilarConventionsParams,
  NotFoundError,
  type SiretDto,
  type UserId,
} from "shared";
import { validateAndParseZodSchema } from "../../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../../utils/logger";
import type { InMemoryAgencyRepository } from "../../agency/adapters/InMemoryAgencyRepository";
import type { InMemoryUserRepository } from "../../core/authentication/connected-user/adapters/InMemoryUserRepository";
import type {
  ConventionMarketingData,
  ConventionQueries,
  GetConventionsFilters,
  GetConventionsParams,
  GetPaginatedConventionsForAgencyUserParams,
} from "../ports/ConventionQueries";
import type { InMemoryConventionRepository } from "./InMemoryConventionRepository";

const logger = createLogger(__filename);

export class InMemoryConventionQueries implements ConventionQueries {
  public paginatedConventionsParams: GetPaginatedConventionsForAgencyUserParams[] =
    [];

  constructor(
    private readonly conventionRepository: InMemoryConventionRepository,
    private readonly agencyRepository: InMemoryAgencyRepository,
    private readonly userRepository: InMemoryUserRepository,
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

  public async getConventionById(
    id: ConventionId,
  ): Promise<ConventionReadDto | undefined> {
    const convention = this.conventionRepository.conventions.find(
      propEq(id, "id"),
    );
    if (!convention) return;

    return this.#addAgencyDataToConvention(convention);
  }

  public getConventionsByFiltersCalled = 0;

  public async getConventions({
    filters,
    sortBy,
  }: GetConventionsParams): Promise<ConventionDto[]> {
    this.getConventionsByFiltersCalled++;

    return this.conventionRepository.conventions
      .filter(makeApplyFiltersToConventions(filters))
      .sort((previous, current) => {
        const previousDate = previous[sortBy];
        const currentDate = current[sortBy];

        if (!previousDate) return 1;
        if (!currentDate) return -1;

        return (
          new Date(previousDate).getTime() - new Date(currentDate).getTime()
        );
      })
      .map((convention) =>
        validateAndParseZodSchema({
          schemaName: "conventionSchema",
          inputSchema: conventionSchema,
          schemaParsingInput: convention,
          id: convention.id,
          logger,
        }),
      );
  }

  public async getConventionsMarketingData({
    siret,
    status,
  }: {
    siret: SiretDto;
    status: ConventionStatus;
  }): Promise<ConventionMarketingData[]> {
    return this.conventionRepository.conventions
      .filter(
        (convention) =>
          convention.siret === siret && convention.status === status,
      )
      .sort((a, b) => {
        const aDate = a.dateValidation;
        const bDate = b.dateValidation;

        if (!aDate) return 1;
        if (!bDate) return -1;

        return new Date(aDate).getTime() - new Date(bDate).getTime();
      })
      .map((convention) => ({
        siret: convention.siret,
        dateValidation: convention.dateValidation || undefined,
        dateEnd: convention.dateEnd,
        establishmentRepresentative: {
          email: convention.signatories.establishmentRepresentative.email,
          firstName:
            convention.signatories.establishmentRepresentative.firstName,
          lastName: convention.signatories.establishmentRepresentative.lastName,
        },
        establishmentNumberEmployeesRange:
          convention.establishmentNumberEmployeesRange || undefined,
      }));
  }

  public async getPaginatedConventionsForAgencyUser(
    params: GetPaginatedConventionsForAgencyUserParams,
  ): Promise<DataWithPagination<ConventionDto>> {
    // Store the params for later inspection in tests
    this.paginatedConventionsParams.push(params);

    // Get all conventions
    const conventions = this.conventionRepository.conventions;

    // Apply pagination
    const { page, perPage } = params.pagination;
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, conventions.length);
    const paginatedData = conventions.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        totalRecords: conventions.length,
        currentPage: page,
        totalPages: Math.ceil(conventions.length / perPage),
        numberPerPage: perPage,
      },
    };
  }

  public async getConventionsByScope(params: {
    scope: ConventionScope;
    limit: number;
    filters: GetConventionsFilters;
  }): Promise<ConventionReadDto[]> {
    return await Promise.all(
      this.conventionRepository.conventions
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
        .map((convention) => this.#addAgencyDataToConvention(convention)),
    );
  }

  public async getLatestConventionBySirets(
    sirets: SiretDto[],
  ): Promise<ConventionReadDto[]> {
    const conventionReadDtos = await Promise.all(
      this.conventionRepository.conventions
        .filter(
          (conventionDto) =>
            sirets?.includes(conventionDto.siret) &&
            !!conventionDto.dateValidation,
        )
        .map((conventionDto) => this.#addAgencyDataToConvention(conventionDto)),
    );

    const latestConventionsBySiret = conventionReadDtos.reduce(
      (acc: Record<SiretDto, ConventionReadDto>, conventionReadDto) => {
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
      },
      {},
    );

    return Object.values(latestConventionsBySiret);
  }

  #addAgencyDataToConvention = async (
    convention: ConventionDto,
  ): Promise<ConventionReadDto> => {
    const agency = this.agencyRepository.agencies.find(
      (agency) => agency.id === convention.agencyId,
    );

    if (!agency)
      throw errors.agency.notFound({ agencyId: convention.agencyId });

    const referedAgency =
      agency.refersToAgencyId &&
      this.agencyRepository.agencies.find(
        (agency) => agency.id === agency.refersToAgencyId,
      );

    const { counsellorIds, validatorIds } = toPairs(agency.usersRights).reduce<{
      counsellorIds: UserId[];
      validatorIds: UserId[];
    }>(
      (acc, item) => {
        const [userId, userRights] = item;

        return {
          counsellorIds: [
            ...acc.counsellorIds,
            ...(userRights?.roles.includes("counsellor") ? [userId] : []),
          ],
          validatorIds: [
            ...acc.validatorIds,
            ...(userRights?.roles.includes("validator") ? [userId] : []),
          ],
        };
      },
      { counsellorIds: [], validatorIds: [] },
    );

    const counsellors = await this.userRepository.getByIds(counsellorIds);
    const validators = await this.userRepository.getByIds(validatorIds);

    return {
      ...convention,
      agencyName: agency.name,
      agencyDepartment: agency.address.departmentCode,
      agencyKind: agency.kind,
      agencySiret: agency.agencySiret,
      agencyCounsellorEmails: counsellors.map(({ email }) => email),
      agencyValidatorEmails: validators.map(({ email }) => email),
      agencyRefersTo: referedAgency
        ? {
            id: referedAgency.id,
            name: referedAgency.name,
            kind: referedAgency.kind,
          }
        : undefined,
    };
  };
}

const makeApplyFiltersToConventions =
  ({
    ids,
    startDateLessOrEqual,
    startDateGreater,
    withStatuses,
    dateSubmissionEqual,
    dateSubmissionSince,
    withSirets,
    endDate,
    updateDate,
  }: GetConventionsFilters) =>
  (convention: ConventionDto) =>
    (
      [
        ({ id }) => (ids && ids.length > 0 ? ids.includes(id) : true),
        ({ dateEnd }) => (endDate?.to ? new Date(dateEnd) <= endDate.to : true),
        ({ dateEnd }) =>
          endDate?.from ? new Date(dateEnd) >= endDate.from : true,
        ({ updatedAt }) =>
          updateDate?.to && updatedAt
            ? new Date(updatedAt) <= updateDate.to
            : true,
        ({ updatedAt }) =>
          updateDate?.from && updatedAt
            ? new Date(updatedAt) >= updateDate.from
            : true,
        ({ dateStart }) =>
          startDateLessOrEqual
            ? new Date(dateStart) <= startDateLessOrEqual
            : true,
        ({ dateStart }) =>
          startDateGreater ? new Date(dateStart) > startDateGreater : true,
        ({ dateSubmission }) =>
          dateSubmissionEqual
            ? new Date(dateSubmission).getTime() ===
              dateSubmissionEqual.getTime()
            : true,
        ({ dateSubmission }) =>
          dateSubmissionSince
            ? new Date(dateSubmission).getTime() >=
              dateSubmissionSince.getTime()
            : true,
        ({ status }) =>
          withStatuses && withStatuses.length > 0
            ? withStatuses.includes(status)
            : true,

        ({ siret }) =>
          withSirets && withSirets.length > 0
            ? withSirets.includes(siret)
            : true,
      ] satisfies Array<(convention: ConventionDto) => boolean>
    ).every((filter) => filter(convention));
