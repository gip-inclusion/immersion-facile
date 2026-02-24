import { isBefore } from "date-fns";
import { propEq, toPairs } from "ramda";
import {
  type AgencyId,
  type ConventionDto,
  type ConventionId,
  type ConventionReadDto,
  type ConventionScope,
  type ConventionsWithErroredBroadcastFeedbackFilters,
  type ConventionWithBroadcastFeedback,
  conventionSchema,
  type DataWithPagination,
  errors,
  type GetPaginatedConventionsFilters,
  isFunctionalBroadcastFeedbackError,
  NotFoundError,
  type PaginationQueryParams,
  type SiretDto,
  type UserId,
} from "shared";
import { validateAndParseZodSchema } from "../../../config/helpers/validateAndParseZodSchema";
import { assesmentEntityToConventionAssessmentFields } from "../../../utils/convention";
import { createLogger } from "../../../utils/logger";
import type { InMemoryAgencyRepository } from "../../agency/adapters/InMemoryAgencyRepository";
import type { InMemoryUserRepository } from "../../core/authentication/connected-user/adapters/InMemoryUserRepository";
import type { InMemoryBroadcastFeedbacksRepository } from "../../core/saved-errors/adapters/InMemoryBroadcastFeedbacksRepository";
import type {
  ConventionQueries,
  GetConventionIdsParams,
  GetConventionsFilters,
  GetConventionsParams,
  GetPaginatedConventionsForAgencyUserParams,
} from "../ports/ConventionQueries";
import type { InMemoryAssessmentRepository } from "./InMemoryAssessmentRepository";
import type { InMemoryConventionRepository } from "./InMemoryConventionRepository";

const logger = createLogger(__filename);

export class InMemoryConventionQueries implements ConventionQueries {
  public paginatedConventionsParams: GetPaginatedConventionsForAgencyUserParams[] =
    [];

  constructor(
    private readonly conventionRepository: InMemoryConventionRepository,
    private readonly agencyRepository: InMemoryAgencyRepository,
    private readonly userRepository: InMemoryUserRepository,
    private readonly assessmentRepository: InMemoryAssessmentRepository,
    private readonly broadcastFeedbacksRepository: InMemoryBroadcastFeedbacksRepository,
  ) {}

  public async getUserIdsWithNoActiveConvention({
    userIds,
    since,
  }: {
    userIds: UserId[];
    since: Date;
  }): Promise<UserId[]> {
    if (userIds.length === 0) return [];

    const users = this.userRepository.users.filter((u) =>
      userIds.includes(u.id),
    );

    return users
      .filter(
        (user) =>
          !this.conventionRepository.conventions.some((convention) => {
            if (new Date(convention.dateEnd) < since) return false;
            const conventionEmails = [
              convention.signatories.beneficiary.email,
              convention.establishmentTutor.email,
              convention.signatories.establishmentRepresentative.email,
              convention.signatories.beneficiaryRepresentative?.email,
              convention.signatories.beneficiaryCurrentEmployer?.email,
            ].filter(Boolean);
            return conventionEmails.includes(user.email);
          }),
      )
      .map((u) => u.id);
  }

  public async getConventionIdsByFilters(
    params: GetConventionIdsParams,
  ): Promise<ConventionId[]> {
    const results = this.conventionRepository.conventions
      .filter(makeApplyFiltersToGetConventionIds(params.filters))
      .map((convention) => convention.id);

    return params.limit ? results.slice(0, params.limit - 1) : results;
  }

  public async getConventionById(
    id: ConventionId,
  ): Promise<ConventionReadDto | undefined> {
    const convention = this.conventionRepository.conventions.find(
      propEq(id, "id"),
    );
    if (!convention) return;

    return this.#addAgencyAndAssessmentDataToConvention(convention);
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

  public async getPaginatedConventionsForAgencyUser(
    params: GetPaginatedConventionsForAgencyUserParams,
  ): Promise<DataWithPagination<ConventionReadDto>> {
    // Store the params for later inspection in tests
    this.paginatedConventionsParams.push(params);

    // Get all conventions
    const conventions = this.conventionRepository.conventions;

    // Apply pagination
    const { page, perPage } = params.pagination;
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, conventions.length);
    const paginatedData = conventions.slice(startIndex, endIndex);

    // Transform ConventionDto to ConventionReadDto
    const conventionsRead = await Promise.all(
      paginatedData.map((convention) =>
        this.#addAgencyAndAssessmentDataToConvention(convention),
      ),
    ).then((conventionsRead) =>
      params.filters?.assessmentCompletionStatus
        ? conventionsRead.filter(
            makeApplyAssessmentCompletionStatusFilterConventionsRead(
              params.filters,
            ),
          )
        : conventionsRead,
    );

    return {
      data: conventionsRead,
      pagination: {
        totalRecords: conventionsRead.length,
        currentPage: page,
        totalPages: Math.ceil(conventionsRead.length / perPage),
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
        .map((convention) =>
          this.#addAgencyAndAssessmentDataToConvention(convention),
        ),
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
        .map((conventionDto) =>
          this.#addAgencyAndAssessmentDataToConvention(conventionDto),
        ),
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

  #addAgencyAndAssessmentDataToConvention = async (
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

    const assessment = this.assessmentRepository.assessments.find(
      (assessment) => assessment.conventionId === convention.id,
    );

    return {
      ...convention,
      agencyName: agency.name,
      agencyDepartment: agency.address.departmentCode,
      agencyContactEmail: agency.contactEmail,
      agencyKind: agency.kind,
      agencySiret: agency.agencySiret,
      agencyCounsellorEmails: counsellors.map(({ email }) => email),
      agencyValidatorEmails: validators.map(({ email }) => email),
      agencyRefersTo: referedAgency
        ? {
            id: referedAgency.id,
            name: referedAgency.name,
            contactEmail: referedAgency.contactEmail,
            kind: referedAgency.kind,
            siret: referedAgency.agencySiret,
          }
        : undefined,
      ...assesmentEntityToConventionAssessmentFields(assessment),
    };
  };

  public async getConventionsWithErroredBroadcastFeedbackForAgencyUser({
    userAgencyIds,
    pagination,
    filters = {},
  }: {
    userAgencyIds: AgencyId[];
    pagination: Required<PaginationQueryParams>;
    filters?: ConventionsWithErroredBroadcastFeedbackFilters;
  }): Promise<DataWithPagination<ConventionWithBroadcastFeedback>> {
    const userConventions = this.conventionRepository.conventions.filter(
      (convention) => userAgencyIds.includes(convention.agencyId),
    );

    const results: ConventionWithBroadcastFeedback[] = await Promise.all(
      userConventions.map(async (convention) => {
        const lastBroadcastFeedback =
          await this.broadcastFeedbacksRepository.getLastBroadcastFeedback(
            convention.id,
          );
        return {
          id: convention.id,
          status: convention.status,
          beneficiary: {
            firstname: convention.signatories.beneficiary.firstName,
            lastname: convention.signatories.beneficiary.lastName,
          },
          lastBroadcastFeedback,
        };
      }),
    );

    const filteredResults = results
      .filter(
        (
          result,
        ): result is ConventionWithBroadcastFeedback & {
          lastBroadcastFeedback: NonNullable<
            ConventionWithBroadcastFeedback["lastBroadcastFeedback"]
          >;
        } => result.lastBroadcastFeedback !== null,
      )
      .filter((result) => {
        if (filters.broadcastErrorKind) {
          const message =
            result.lastBroadcastFeedback?.subscriberErrorFeedback?.message;
          if (!message) return false;

          const isFunctional = isFunctionalBroadcastFeedbackError(message);
          if (filters.broadcastErrorKind === "functional" && !isFunctional)
            return false;
          if (filters.broadcastErrorKind === "technical" && isFunctional)
            return false;
        }

        if (filters.conventionStatus && filters.conventionStatus.length > 0) {
          if (!filters.conventionStatus.includes(result.status)) return false;
        }

        if (filters.search) {
          if (result.id.toLowerCase() !== filters.search.toLowerCase())
            return false;
        }

        return true;
      });

    return {
      data: filteredResults
        .sort(
          (a, b) =>
            new Date(b.lastBroadcastFeedback.occurredAt).getTime() -
            new Date(a.lastBroadcastFeedback.occurredAt).getTime(),
        )
        .slice(
          (pagination.page - 1) * pagination.perPage,
          pagination.page * pagination.perPage,
        ),
      pagination: {
        totalRecords: filteredResults.length,
        currentPage: pagination.page,
        totalPages: Math.ceil(filteredResults.length / pagination.perPage),
        numberPerPage: pagination.perPage,
      },
    };
  }
}

const makeApplyFiltersToGetConventionIds =
  ({
    withAppelationCodes,
    withBeneficiary,
    withDateStart,
    withEstablishmentRepresentative,
    withEstablishmentTutor,
    withSirets,
    withStatuses,
  }: GetConventionIdsParams["filters"]) =>
  (convention: ConventionDto) =>
    (
      [
        ({ dateStart }) =>
          withDateStart?.to ? dateStart <= withDateStart : true,
        ({ dateStart }) =>
          withDateStart?.from ? dateStart >= withDateStart : true,
        ({ establishmentTutor }) =>
          withEstablishmentTutor?.email
            ? establishmentTutor.email === withEstablishmentTutor.email
            : true,
        ({ signatories: { establishmentRepresentative } }) =>
          withEstablishmentRepresentative?.email
            ? establishmentRepresentative.email ===
              withEstablishmentRepresentative.email
            : true,
        ({ signatories: { beneficiary } }) =>
          withBeneficiary?.lastName
            ? beneficiary.lastName === withBeneficiary.lastName
            : true,
        ({ signatories: { beneficiary } }) =>
          withBeneficiary?.birthdate
            ? beneficiary.birthdate === withBeneficiary.birthdate
            : true,
        ({ status }) =>
          withStatuses && withStatuses.length > 0
            ? withStatuses.includes(status)
            : true,
        ({ siret }) =>
          withSirets && withSirets.length > 0
            ? withSirets.includes(siret)
            : true,
        ({ immersionAppellation }) =>
          withAppelationCodes && withAppelationCodes.length > 0
            ? withAppelationCodes.includes(immersionAppellation.appellationCode)
            : true,
      ] satisfies Array<(convention: ConventionDto) => boolean>
    ).every((filter) => filter(convention));

const makeApplyFiltersToConventions =
  ({
    agencyIds,
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
        ({ agencyId: conventionAgencyId }) =>
          agencyIds && agencyIds.length > 0
            ? agencyIds.includes(conventionAgencyId)
            : true,
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

const makeApplyAssessmentCompletionStatusFilterConventionsRead =
  ({ assessmentCompletionStatus }: GetPaginatedConventionsFilters) =>
  (convention: ConventionReadDto) => {
    if (!assessmentCompletionStatus) return true;

    return (
      convention.status === "ACCEPTED_BY_VALIDATOR" &&
      (assessmentCompletionStatus === "completed"
        ? convention.assessment !== null
        : convention.assessment === null)
    );
  };
