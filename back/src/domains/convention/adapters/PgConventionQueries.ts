import { addDays, subDays } from "date-fns";
import { sql } from "kysely";
import { andThen } from "ramda";
import {
  type ConventionDto,
  type ConventionId,
  type ConventionReadDto,
  type ConventionScope,
  type ConventionStatus,
  type DateRange,
  type FindSimilarConventionsParams,
  type SiretDto,
  conventionReadSchema,
  conventionSchema,
  errors,
  pipeWithValue,
  validatedConventionStatuses,
} from "shared";
import { validateAndParseZodSchemaV2 } from "../../../config/helpers/validateAndParseZodSchema";
import type { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import type { Database } from "../../../config/pg/kysely/model/database";
import { createLogger } from "../../../utils/logger";
import type {
  AssessmentEmailKind,
  ConventionQueries,
  GetConventionsFilters,
  GetConventionsParams,
  GetConventionsSortBy,
} from "../ports/ConventionQueries";
import {
  createConventionQueryBuilder,
  getConventionAgencyFieldsForAgencies,
  getReadConventionById,
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

    const pgResults = await createConventionQueryBuilder(this.transaction)
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

  public async getAllConventionsForThoseEndingThatDidntGoThrough(
    finishingRange: DateRange,
    assessmentEmailKind: AssessmentEmailKind,
  ): Promise<ConventionDto[]> {
    const pgResults = await createConventionQueryBuilder(this.transaction)
      .where("conventions.status", "in", validatedConventionStatuses)
      .where(
        sql`conventions.date_end`,
        "<=",
        finishingRange.to.toISOString().split("T")[0],
      )
      .where(({ selectFrom, not, exists }) =>
        not(
          exists(
            selectFrom("notifications_email")
              .select("notifications_email.convention_id")
              .where("notifications_email.email_kind", "=", assessmentEmailKind)
              .where(
                sql`notifications_email.created_at`,
                ">=",
                subDays(finishingRange.from, 1).toISOString().split("T")[0],
              )
              .where(
                sql`notifications_email.created_at`,
                "<=",
                addDays(finishingRange.to, 2).toISOString().split("T")[0],
              )
              .whereRef(
                "conventions.id",
                "=",
                "notifications_email.convention_id",
              ),
          ),
        ),
      )
      .where((eb) =>
        eb.or([
          eb(
            sql`conventions.date_end`,
            ">=",
            finishingRange.from.toISOString().split("T")[0],
          ),
          eb.exists(
            eb
              .selectFrom("notifications_email")
              .select("notifications_email.convention_id")
              .where(
                "notifications_email.email_kind",
                "=",
                "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
              )
              .where(
                sql`notifications_email.created_at`,
                ">=",
                subDays(finishingRange.from, 1).toISOString().split("T")[0],
              )
              .where(
                sql`notifications_email.created_at`,
                "<=",
                addDays(finishingRange.to, 1).toISOString().split("T")[0],
              )
              .whereRef(
                "conventions.id",
                "=",
                "notifications_email.convention_id",
              ),
          ),
        ]),
      )
      .orderBy("conventions.date_start", "desc")
      .execute();

    return await pgResults.map((pgResult) =>
      conventionSchema.parse(pgResult.dto),
    );
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
      createConventionQueryBuilder(this.transaction),
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
      createConventionQueryBuilder(this.transaction),
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

      return validateAndParseZodSchemaV2(
        conventionReadSchema,
        {
          ...pgResult.dto,
          ...agencyFields,
        },
        logger,
      );
    });
  }
}

type ConventionReadQueryBuilder = ReturnType<
  typeof createConventionQueryBuilder
>;

const addFiltersToBuilder =
  ({
    startDateGreater,
    startDateLessOrEqual,
    withStatuses,
    dateSubmissionEqual,
    dateSubmissionSince,
    withSirets,
  }: GetConventionsFilters) =>
  (builder: ConventionReadQueryBuilder) => {
    const addWithStatusFilterIfNeeded: AddToBuilder = (b) =>
      withStatuses && withStatuses.length > 0
        ? b.where("conventions.status", "in", withStatuses)
        : b;

    const addStartDateLessOrEqualFilterIfNeeded: AddToBuilder = (b) =>
      startDateLessOrEqual
        ? b.where("conventions.date_start", "<=", startDateLessOrEqual)
        : b;

    const addStartDateGreaterFilterIfNeeded: AddToBuilder = (b) =>
      startDateGreater
        ? b.where("conventions.date_start", ">", startDateGreater)
        : b;

    const addDateSubmissionEqualIfNeeded: AddToBuilder = (b) =>
      dateSubmissionEqual
        ? b.where("conventions.date_submission", "=", dateSubmissionEqual)
        : b;

    const addDateSubmissionSinceIfNeeded: AddToBuilder = (b) =>
      dateSubmissionSince
        ? b.where("conventions.date_submission", ">=", dateSubmissionSince)
        : b;

    const addWithSiretsIfNeeded: AddToBuilder = (b) =>
      withSirets && withSirets.length > 0
        ? b.where("conventions.siret", "=", sql<SiretDto>`ANY(${withSirets})`)
        : b;

    return pipeWithValue(
      builder,
      addWithStatusFilterIfNeeded,
      addStartDateLessOrEqualFilterIfNeeded,
      addStartDateGreaterFilterIfNeeded,
      addDateSubmissionEqualIfNeeded,
      addDateSubmissionSinceIfNeeded,
      addWithSiretsIfNeeded,
    );
  };

export const validateConventionResults = (
  pgResults: { dto: unknown }[],
): ConventionDto[] =>
  pgResults.map((pgResult) =>
    validateAndParseZodSchemaV2(conventionSchema, pgResult.dto, logger),
  );

type AddToBuilder = (
  b: ConventionReadQueryBuilder,
) => ConventionReadQueryBuilder;
