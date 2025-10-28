import { addDays, subDays } from "date-fns";
import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";
import { andThen } from "ramda";
import {
  type AssessmentCompletionStatusFilter,
  type ConventionAssessmentFields,
  type ConventionDto,
  type ConventionId,
  type ConventionReadDto,
  type ConventionScope,
  type ConventionStatus,
  calculatePaginationResult,
  conventionReadSchema,
  conventionSchema,
  type DataWithPagination,
  type DateFilter,
  errors,
  type FindSimilarConventionsParams,
  type GetPaginatedConventionsFilters,
  type GetPaginatedConventionsSortBy,
  type NotEmptyArray,
  type PaginationQueryParams,
  pipeWithValue,
  type SiretDto,
  type UserId,
  type WithSort,
} from "shared";
import { validateAndParseZodSchema } from "../../../config/helpers/validateAndParseZodSchema";
import type { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import type { Database } from "../../../config/pg/kysely/model/database";
import { createLogger } from "../../../utils/logger";
import type {
  ConventionMarketingData,
  ConventionQueries,
  GetConventionsFilters,
  GetConventionsParams,
  GetConventionsSortBy,
} from "../ports/ConventionQueries";
import {
  type ConventionQueryBuilder,
  createConventionQueryBuilder,
  createConventionQueryBuilderForAgencyUser,
  getAssessmentFieldsByConventionId,
  getConventionAgencyFieldsForAgencies,
  getReadConventionById,
  type PaginatedConventionQueryBuilder,
} from "./pgConventionSql";

const logger = createLogger(__filename);

export class PgConventionQueries implements ConventionQueries {
  constructor(private transaction: KyselyDb) {}

  public async findSimilarConventions(
    params: FindSimilarConventionsParams,
  ): Promise<ConventionId[]> {
    const dateStartToMatch = new Date(params.dateStart);
    const numberOfDaysTolerance = 7;
    const statusesToIgnore: ConventionStatus[] = [
      "DEPRECATED",
      "REJECTED",
      "CANCELLED",
    ];

    const pgResults = await createConventionQueryBuilder(
      this.transaction,
      false,
    )
      .where("conventions.siret", "=", params.siret)
      .where("conventions.immersion_appellation", "=", +params.codeAppellation)
      .where(
        sql`b.extra_fields ->> 'birthdate'`,
        "=",
        params.beneficiaryBirthdate,
      )
      .where("b.last_name", "=", params.beneficiaryLastName)
      .where(
        "conventions.date_start",
        "<=",
        addDays(dateStartToMatch, numberOfDaysTolerance),
      )
      .where(
        "conventions.date_start",
        ">=",
        subDays(dateStartToMatch, numberOfDaysTolerance),
      )
      .where("conventions.status", "not in", statusesToIgnore)
      .orderBy("conventions.date_start", "desc")
      .limit(20)
      .execute();

    return pgResults.map((pgResult) => conventionSchema.parse(pgResult.dto).id);
  }

  public async getConventionById(
    id: ConventionId,
  ): Promise<ConventionReadDto | undefined> {
    return getReadConventionById(this.transaction, id);
  }

  public async getConventions({
    filters,
    sortBy,
  }: GetConventionsParams): Promise<ConventionDto[]> {
    const conventionsSortByDateToDatabaseConventionsOrderBy: Record<
      GetConventionsSortBy,
      keyof Pick<Database["conventions"], "date_start" | "date_validation">
    > = {
      dateStart: "date_start",
      dateValidation: "date_validation",
    };

    return pipeWithValue(
      createConventionQueryBuilder(this.transaction, false),
      addFiltersToBuilder(filters),
      (builder) =>
        builder
          .orderBy(
            `conventions.${conventionsSortByDateToDatabaseConventionsOrderBy[sortBy]}`,
            "desc",
          )
          .execute(),
      andThen(validateConventionResults),
    );
  }

  public async getConventionsMarketingData({
    siret,
  }: {
    siret: SiretDto;
  }): Promise<ConventionMarketingData[]> {
    const result = await this.transaction
      .selectFrom("conventions")
      .innerJoin(
        "actors as er",
        "er.id",
        "conventions.establishment_representative_id",
      )
      .select((eb) => [
        "conventions.siret as siret",
        "conventions.date_validation as dateValidation",
        "conventions.date_end as dateEnd",
        jsonBuildObject({
          email: eb.ref("er.email"),
          firstName: eb.ref("er.first_name"),
          lastName: eb.ref("er.last_name"),
        }).as("establishmentRepresentative"),
        "conventions.establishment_number_employees as establishmentNumberEmployeesRange",
      ])
      .where("conventions.siret", "=", siret)
      .where("conventions.status", "=", "ACCEPTED_BY_VALIDATOR")
      .orderBy("conventions.date_validation", "asc")
      .execute();

    return result.map((row) => ({
      siret: row.siret,
      dateValidation: row.dateValidation?.toISOString() || undefined,
      dateEnd: row.dateEnd.toISOString(),
      establishmentRepresentative: row.establishmentRepresentative,
      establishmentNumberEmployeesRange:
        row.establishmentNumberEmployeesRange || undefined,
    }));
  }

  public async getConventionsByScope(params: {
    scope: ConventionScope;
    limit: number;
    filters: GetConventionsFilters;
  }): Promise<ConventionReadDto[]> {
    if (
      (params.scope.agencyIds && params.scope.agencyIds.length === 0) ||
      (params.scope.agencyKinds && params.scope.agencyKinds.length === 0)
    )
      return [];

    const conventions = await pipeWithValue(
      createConventionQueryBuilder(this.transaction, true),
      addFiltersToBuilder(params.filters),
      (builder) =>
        params.scope.agencyKinds
          ? builder.where("agencies.kind", "in", params.scope.agencyKinds)
          : builder.where("agencies.id", "in", params.scope.agencyIds),
      (builder) =>
        builder
          .orderBy("conventions.date_start", "desc")
          .limit(params.limit)
          .execute(),
    );

    if (conventions.length === 0) return [];

    const agencyIdsInResult = conventions.map(
      (pgResult) => pgResult.dto.agencyId,
    );
    const uniqAgencyIds = [...new Set(agencyIdsInResult)];

    const agencyFieldsByAgencyIds = await getConventionAgencyFieldsForAgencies(
      this.transaction,
      uniqAgencyIds,
    );

    const assessmentPromises = conventions.map(async (pgResult) => {
      const assessment = await getAssessmentFieldsByConventionId(
        this.transaction,
        pgResult.dto.id,
      );
      return { conventionId: pgResult.dto.id, assessment };
    });

    const assessmentResults = await Promise.all(assessmentPromises);
    const assessmentByConventionId = assessmentResults.reduce(
      (acc, { conventionId, assessment }) => {
        acc[conventionId] = assessment;
        return acc;
      },
      {} as Record<ConventionId, ConventionAssessmentFields>,
    );

    return conventions.map((pgResult) => {
      const agencyFields = agencyFieldsByAgencyIds[pgResult.dto.agencyId];
      if (!agencyFields)
        throw errors.agency.notFound({ agencyId: pgResult.dto.agencyId });

      const assessmentFields = assessmentByConventionId[pgResult.dto.id];

      return validateAndParseZodSchema({
        schemaName: "conventionReadSchema",
        inputSchema: conventionReadSchema,
        schemaParsingInput: {
          ...pgResult.dto,
          ...agencyFields,
          ...assessmentFields,
        },
        logger,
      });
    });
  }

  public async getPaginatedConventionsForAgencyUser({
    filters = {},
    pagination,
    sort,
    agencyUserId,
  }: WithSort<GetPaginatedConventionsSortBy> & {
    agencyUserId: UserId;
    pagination: Required<PaginationQueryParams>;
    filters?: GetPaginatedConventionsFilters;
  }): Promise<DataWithPagination<ConventionReadDto>> {
    const {
      search,
      statuses,
      agencyIds,
      agencyDepartmentCodes,
      dateStart,
      dateEnd,
      dateSubmission,
      assessmentCompletionStatus,
      ...rest
    } = filters;

    rest satisfies Record<string, never>;

    const data = await pipeWithValue(
      createConventionQueryBuilderForAgencyUser({
        transaction: this.transaction,
        agencyUserId,
      }),
      filterSearch(search?.trim()),
      filterDate("date_start", dateStart),
      filterDate("date_end", dateEnd),
      filterDate("date_submission", dateSubmission),
      filterInList("status", statuses),
      filterInList("agency_id", agencyIds),
      filterByAgencyDepartmentCodes(agencyDepartmentCodes),
      filterAssessmentCompletionStatus(assessmentCompletionStatus),
      sortConventions(sort),
      applyPagination(pagination),
    ).execute();

    const totalRecords = data.at(0)?.total_count ?? 0;

    if (data.length === 0) {
      return {
        data: [],
        pagination: calculatePaginationResult({
          ...pagination,
          totalRecords,
        }),
      };
    }

    const agencyIdsInResult = data.map(({ dto }) => dto.agencyId);
    const uniqAgencyIds = [...new Set(agencyIdsInResult)];

    const agencyFieldsByAgencyIds = await getConventionAgencyFieldsForAgencies(
      this.transaction,
      uniqAgencyIds,
    );

    const assessmentPromises = data.map(async ({ dto }) => {
      const assessment = await getAssessmentFieldsByConventionId(
        this.transaction,
        dto.id,
      );
      return { conventionId: dto.id, assessment };
    });

    const assessmentResults = await Promise.all(assessmentPromises);
    const assessmentByConventionId = assessmentResults.reduce(
      (acc, { conventionId, assessment }) => {
        acc[conventionId] = assessment;
        return acc;
      },
      {} as Record<string, ConventionAssessmentFields>,
    );

    const conventionsReadDto = data.map(({ dto }) => {
      const agencyFields = agencyFieldsByAgencyIds[dto.agencyId];
      if (!agencyFields)
        throw errors.agency.notFound({ agencyId: dto.agencyId });

      const assessmentFields = assessmentByConventionId[dto.id];

      return validateAndParseZodSchema({
        schemaName: "conventionReadSchema",
        inputSchema: conventionReadSchema,
        schemaParsingInput: {
          ...dto,
          ...agencyFields,
          ...assessmentFields,
        },
        logger,
      });
    });

    return {
      data: conventionsReadDto,
      pagination: calculatePaginationResult({ ...pagination, totalRecords }),
    };
  }
}

const applyPagination =
  (pagination: Required<PaginationQueryParams>) =>
  (
    builder: PaginatedConventionQueryBuilder,
  ): PaginatedConventionQueryBuilder => {
    const { page, perPage } = pagination;
    const offset = (page - 1) * perPage;
    return builder.limit(perPage).offset(offset);
  };

const sortConventions =
  (sort?: WithSort<GetPaginatedConventionsSortBy>["sort"]) =>
  (
    builder: PaginatedConventionQueryBuilder,
  ): PaginatedConventionQueryBuilder => {
    const sortByKey: Record<
      GetPaginatedConventionsSortBy,
      keyof Database["conventions"]
    > = {
      dateSubmission: "date_submission",
      dateStart: "date_start",
      dateValidation: "date_validation",
      dateEnd: "date_end",
    };

    if (!sort || !sort.by) return builder.orderBy(sortByKey.dateStart, "desc");

    return builder.orderBy(sortByKey[sort.by], sort.direction ?? "desc");
  };

const filterByAgencyDepartmentCodes =
  (agencyDepartmentCodes: NotEmptyArray<string> | undefined) =>
  (
    builder: PaginatedConventionQueryBuilder,
  ): PaginatedConventionQueryBuilder => {
    if (!agencyDepartmentCodes) return builder;
    return builder.where(
      "agencies.department_code",
      "in",
      agencyDepartmentCodes,
    );
  };

const filterAssessmentCompletionStatus =
  (assessmentCompletionStatus: AssessmentCompletionStatusFilter | undefined) =>
  (
    builder: PaginatedConventionQueryBuilder,
  ): PaginatedConventionQueryBuilder => {
    if (!assessmentCompletionStatus) {
      return builder;
    }

    if (assessmentCompletionStatus === "completed") {
      return builder
        .where("conventions.status", "=", "ACCEPTED_BY_VALIDATOR")
        .where((eb) =>
          eb.exists(
            eb
              .selectFrom("immersion_assessments")
              .select("convention_id")
              .where("convention_id", "=", eb.ref("conventions.id")),
          ),
        );
    }

    if (assessmentCompletionStatus === "to-be-completed") {
      return builder
        .where("conventions.status", "=", "ACCEPTED_BY_VALIDATOR")
        .where((eb) =>
          eb.not(
            eb.exists(
              eb
                .selectFrom("immersion_assessments")
                .select("convention_id")
                .where("convention_id", "=", eb.ref("conventions.id")),
            ),
          ),
        );
    }
    assessmentCompletionStatus satisfies never;

    return builder;
  };

const filterDate =
  (
    fieldName: keyof Database["conventions"],
    dateFilter: DateFilter | undefined,
  ) =>
  (
    builder: PaginatedConventionQueryBuilder,
  ): PaginatedConventionQueryBuilder => {
    if (!dateFilter) return builder;
    if (dateFilter.from && dateFilter.to)
      return builder
        .where(fieldName, ">=", dateFilter.from)
        .where(fieldName, "<=", dateFilter.to);

    if (dateFilter.from) return builder.where(fieldName, ">=", dateFilter.from);
    if (dateFilter.to) return builder.where(fieldName, "<=", dateFilter.to);
    return builder;
  };

const filterInList =
  <T extends string>(
    fieldName: keyof Database["conventions"],
    list: T[] | undefined,
  ) =>
  (
    builder: PaginatedConventionQueryBuilder,
  ): PaginatedConventionQueryBuilder => {
    if (!list) return builder;
    return builder.where(`conventions.${fieldName}`, "in", list);
  };

const filterSearch =
  (search: string | undefined) =>
  (
    builder: PaginatedConventionQueryBuilder,
  ): PaginatedConventionQueryBuilder => {
    if (!search) return builder;
    const pattern = `%${search.toLowerCase()}%`;

    return builder.where((eb) =>
      eb.or([
        // Search in convention ID (cast UUID to text for pattern matching)
        sql<any>`CAST(${eb.ref("conventions.id")} AS text) LIKE ${pattern}`,
        // Search in beneficiary names
        sql<any>`${eb.ref("b.first_name")} ILIKE ${pattern}`,
        sql<any>`${eb.ref("b.last_name")} ILIKE ${pattern}`,
        // Search in establishment business name
        sql<any>`${eb.ref("business_name")} ILIKE ${pattern}`,
        // Search in establishment SIRET
        sql<any>`${eb.ref("conventions.siret")} LIKE ${pattern}`,
        // Search in actor emails
        sql<any>`${eb.ref("b.email")} LIKE ${pattern}`,
        sql<any>`${eb.ref("er.email")} LIKE ${pattern}`,
        sql<any>`${eb.ref("et.email")} LIKE ${pattern}`,
        sql<any>`br.email IS NOT NULL AND br.email LIKE ${pattern}`,
        sql<any>`bce.email IS NOT NULL AND bce.email LIKE ${pattern}`,
        // Search agency referent names
        sql<any>`${eb.ref("agency_referent_first_name")} ILIKE ${pattern}`,
        sql<any>`${eb.ref("agency_referent_last_name")} ILIKE ${pattern}`,
      ]),
    );
  };

const addFiltersToBuilder =
  ({
    ids,
    startDateGreater,
    startDateLessOrEqual,
    withStatuses,
    dateSubmissionEqual,
    dateSubmissionSince,
    withSirets,
    endDate,
    updateDate,
  }: GetConventionsFilters) =>
  (builder: ConventionQueryBuilder) =>
    pipeWithValue(
      builder,
      (b) => (ids && ids.length > 0 ? b.where("conventions.id", "in", ids) : b),
      (b) =>
        withStatuses && withStatuses.length > 0
          ? b.where("conventions.status", "in", withStatuses)
          : b,
      (b) =>
        startDateLessOrEqual
          ? b.where("conventions.date_start", "<=", startDateLessOrEqual)
          : b,
      (b) =>
        startDateGreater
          ? b.where("conventions.date_start", ">", startDateGreater)
          : b,
      (b) =>
        dateSubmissionEqual
          ? b.where("conventions.date_submission", "=", dateSubmissionEqual)
          : b,
      (b) =>
        dateSubmissionSince
          ? b.where("conventions.date_submission", ">=", dateSubmissionSince)
          : b,
      (b) =>
        withSirets && withSirets.length > 0
          ? b.where("conventions.siret", "=", sql<SiretDto>`ANY(${withSirets})`)
          : b,
      (b) =>
        endDate?.from ? b.where("conventions.date_end", ">=", endDate.from) : b,
      (b) =>
        endDate?.to ? b.where("conventions.date_end", "<=", endDate.to) : b,
      (b) =>
        updateDate?.from
          ? b.where("conventions.updated_at", ">=", updateDate.from)
          : b,
      (b) =>
        updateDate?.to
          ? b.where("conventions.updated_at", "<=", updateDate.to)
          : b,
    );

export const validateConventionResults = (
  pgResults: { dto: unknown }[],
): ConventionDto[] =>
  pgResults.map((pgResult) =>
    validateAndParseZodSchema({
      schemaName: "conventionSchema",
      inputSchema: conventionSchema,
      schemaParsingInput: pgResult.dto,
      id:
        pgResult.dto && typeof pgResult.dto === "object" && "id" in pgResult.dto
          ? (pgResult.dto.id as string)
          : undefined,
      logger,
    }),
  );
