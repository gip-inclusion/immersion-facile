import { addDays, subDays } from "date-fns";
import { sql } from "kysely";
import { andThen } from "ramda";
import {
  type ConventionDto,
  type ConventionId,
  type ConventionReadDto,
  type ConventionScope,
  type ConventionStatus,
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
  type Sort,
  type UserId,
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
      .select("conventions.siret")
      .select("conventions.date_validation")
      .select("conventions.date_end")
      .select("er.email as establishment_representative_email")
      .select("er.first_name as establishment_representative_firstname")
      .select("er.last_name as establishment_representative_lastname")
      .select("conventions.establishment_number_employees")
      .where("conventions.siret", "=", siret)
      .where("conventions.status", "=", "ACCEPTED_BY_VALIDATOR")
      .orderBy("conventions.date_validation", "asc")
      .execute();

    return result.map((row) => ({
      siret: row.siret,
      dateValidation: row.date_validation?.toISOString() || undefined,
      dateEnd: row.date_end.toISOString(),
      establishmentRepresentative: {
        email: row.establishment_representative_email,
        firstName: row.establishment_representative_firstname,
        lastName: row.establishment_representative_lastname,
      },
      establishmentNumberEmployeesRange:
        row.establishment_number_employees || undefined,
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

    return conventions.map((pgResult) => {
      const agencyFields = agencyFieldsByAgencyIds[pgResult.dto.agencyId];
      if (!agencyFields)
        throw errors.agency.notFound({ agencyId: pgResult.dto.agencyId });

      return validateAndParseZodSchema({
        schemaName: "conventionReadSchema",
        inputSchema: conventionReadSchema,
        schemaParsingInput: {
          ...pgResult.dto,
          ...agencyFields,
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
  }: {
    agencyUserId: UserId;
    pagination: Required<PaginationQueryParams>;
    filters?: GetPaginatedConventionsFilters;
    sort: Sort<GetPaginatedConventionsSortBy>;
  }): Promise<DataWithPagination<ConventionDto>> {
    const {
      actorEmailContains,
      beneficiaryNameContains,
      establishmentNameContains,
      statuses,
      agencyIds,
      agencyDepartmentCodes,
      dateStart,
      dateEnd,
      dateSubmission,
      ...rest
    } = filters;

    rest satisfies Record<string, never>;

    const data = await pipeWithValue(
      createConventionQueryBuilderForAgencyUser({
        transaction: this.transaction,
        agencyUserId,
      }),
      filterEmail(actorEmailContains?.trim()),
      filterByBeneficiaryName(beneficiaryNameContains?.trim()),
      filterEstablishmentName(establishmentNameContains?.trim()),
      filterDate("date_start", dateStart),
      filterDate("date_end", dateEnd),
      filterDate("date_submission", dateSubmission),
      filterInList("status", statuses),
      filterInList("agency_id", agencyIds),
      filterByAgencyDepartmentCodes(agencyDepartmentCodes),
      sortConventions(sort),
      applyPagination(pagination),
    ).execute();

    const totalRecords = data.at(0)?.total_count ?? 0;

    return {
      data: data.map(({ dto }) => dto),
      pagination: {
        currentPage: pagination.page,
        totalPages: Math.ceil(totalRecords / pagination.perPage),
        numberPerPage: pagination.perPage,
        totalRecords,
      },
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
  (sort?: Sort<GetPaginatedConventionsSortBy>) =>
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

const filterEmail =
  (emailContains: string | undefined) =>
  (
    builder: PaginatedConventionQueryBuilder,
  ): PaginatedConventionQueryBuilder => {
    if (!emailContains) return builder;
    const pattern = `%${emailContains}%`;

    return builder.where((eb) => {
      return eb.or([
        sql<any>`${eb.ref("b.email")} ILIKE ${pattern}`,
        sql<any>`${eb.ref("er.email")} ILIKE ${pattern}`,
        sql<any>`${eb.ref("et.email")} ILIKE ${pattern}`,
        sql<any>`br.email IS NOT NULL AND br.email ILIKE ${pattern}`,
        sql<any>`bce.email IS NOT NULL AND bce.email ILIKE ${pattern}`,
      ]);
    });
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

const filterEstablishmentName =
  (establishmentNameContains: string | undefined) =>
  (
    builder: PaginatedConventionQueryBuilder,
  ): PaginatedConventionQueryBuilder => {
    if (!establishmentNameContains) return builder;
    return builder.where(
      "business_name",
      "ilike",
      `%${establishmentNameContains}%`,
    );
  };

const filterByBeneficiaryName =
  (beneficiaryNameContains: string | undefined) =>
  (
    builder: PaginatedConventionQueryBuilder,
  ): PaginatedConventionQueryBuilder => {
    if (!beneficiaryNameContains) return builder;
    const nameWords = beneficiaryNameContains.split(" ");

    return builder.where((eb) =>
      eb.or(
        nameWords.flatMap((nameWord) => {
          const pattern = `%${nameWord}%`;
          return [
            sql<any>`${eb.ref("b.first_name")} ILIKE ${pattern}`,
            sql<any>`${eb.ref("b.last_name")} ILIKE ${pattern}`,
          ];
        }),
      ),
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
