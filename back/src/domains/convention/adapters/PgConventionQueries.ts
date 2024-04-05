import { addDays, subDays, subHours } from "date-fns";
import { sql } from "kysely";
import { andThen } from "ramda";
import {
  ConventionId,
  ConventionReadDto,
  ConventionScope,
  ConventionStatus,
  FindSimilarConventionsParams,
  SiretDto,
  conventionReadSchema,
  pipeWithValue,
  validatedConventionStatuses,
} from "shared";
import { validateAndParseZodSchema } from "../../../config/helpers/httpErrors";
import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../utils/logger";
import { AssessmentEmailDomainTopic } from "../../core/events/events";
import {
  ConventionQueries,
  GetConventionsByFiltersQueries,
} from "../ports/ConventionQueries";
import {
  createConventionReadQueryBuilder,
  getReadConventionById,
  makeGetLastConventionWithSiretInList,
} from "./pgConventionSql";

const logger = createLogger(__filename);

export class PgConventionQueries implements ConventionQueries {
  constructor(private transaction: KyselyDb) {}

  public async getLatestConventionBySirets(
    sirets: [SiretDto, ...SiretDto[]],
  ): Promise<ConventionReadDto[]> {
    return pipeWithValue(
      createConventionReadQueryBuilder(this.transaction),
      makeGetLastConventionWithSiretInList(sirets),
      (builder) => builder.execute(),
      andThen((results) => results.filter((result) => result.rn === "1")),
      andThen(validateConventionReadResults),
    );
  }

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

    //prettier-ignore
    const pgResults = await createConventionReadQueryBuilder(this.transaction)
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

    return pgResults.map(
      (pgResult) => conventionReadSchema.parse(pgResult.dto).id,
    );
  }

  public async getAllConventionsForThoseEndingThatDidntGoThrough(
    dateEnd: Date,
    sendingTopic: AssessmentEmailDomainTopic,
  ): Promise<ConventionReadDto[]> {
    // prettier-ignore
    const pgResults = await createConventionReadQueryBuilder(this.transaction)
      .where("conventions.date_end", ">=", subHours(dateEnd, 24))
      .where("conventions.date_end", "<", dateEnd)
      .where("conventions.status", "in", validatedConventionStatuses)
      .where(
        "conventions.id",
        "not in",
        sql`(
          SELECT (payload ->> 'id')::uuid
          FROM outbox
          WHERE topic = ${sendingTopic}
        )`,
      )
      .orderBy("conventions.date_start", "desc")
      .execute();

    return pgResults.map((pgResult) =>
      conventionReadSchema.parse(pgResult.dto),
    );
  }

  public async getConventionById(
    id: ConventionId,
  ): Promise<ConventionReadDto | undefined> {
    return getReadConventionById(this.transaction, id);
  }

  public async getConventionsByFilters(
    filters: GetConventionsByFiltersQueries,
  ): Promise<ConventionReadDto[]> {
    return pipeWithValue(
      createConventionReadQueryBuilder(this.transaction),
      addFiltersToBuilder(filters),
      (builder) => builder.orderBy("conventions.date_start", "desc").execute(),
      andThen(validateConventionReadResults),
    );
  }

  public async getConventionsByScope(params: {
    scope: ConventionScope;
    limit: number;
    filters: GetConventionsByFiltersQueries;
  }): Promise<ConventionReadDto[]> {
    if (
      (params.scope.agencyIds && params.scope.agencyIds.length === 0) ||
      (params.scope.agencyKinds && params.scope.agencyKinds.length === 0)
    )
      return [];

    return pipeWithValue(
      createConventionReadQueryBuilder(this.transaction),
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
      andThen(validateConventionReadResults),
    );
  }
}

type ConventionReadQueryBuilder = ReturnType<
  typeof createConventionReadQueryBuilder
>;

const addFiltersToBuilder =
  ({
    startDateGreater,
    startDateLessOrEqual,
    withStatuses,
    dateSubmissionEqual,
    dateSubmissionSince,
    withSirets,
  }: GetConventionsByFiltersQueries) =>
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
        ? b.where("conventions.siret", "in", withSirets)
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

export const validateConventionReadResults = (
  pgResults: { dto: unknown }[],
): ConventionReadDto[] =>
  pgResults.map((pgResult) =>
    validateAndParseZodSchema(conventionReadSchema, pgResult.dto, logger),
  );

type AddToBuilder = (
  b: ConventionReadQueryBuilder,
) => ConventionReadQueryBuilder;
