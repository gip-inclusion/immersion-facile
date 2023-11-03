import { addDays, subDays } from "date-fns";
import format from "pg-format";
import {
  ConventionId,
  ConventionReadDto,
  conventionReadSchema,
  ConventionScope,
  ConventionStatus,
  filterNotFalsy,
  FindSimilarConventionsParams,
  Flavor,
  ListConventionsRequestDto,
  validatedConventionStatuses,
} from "shared";
import {
  ConventionQueries,
  GetConventionsByFiltersQueries,
} from "../../../../domain/convention/ports/ConventionQueries";
import { executeKyselyRawSqlQuery, KyselyDb } from "../kysely/kyselyUtils";
import {
  getReadConventionById,
  selectAllConventionDtosById,
} from "./pgConventionSql";

type WhereClause = Flavor<string, "WhereClause">;

type GetConventionsRequestProperties = {
  whereClauses?: WhereClause[];
  orderByClause: string;
  limit?: number;
};

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

    const conventions = await this.#getConventionsWhere({
      whereClauses: [
        format("conventions.siret = %1$L", params.siret),
        format(
          "conventions.immersion_appellation = %1$L",
          params.codeAppellation,
        ),
        format(
          "(b.extra_fields ->> 'birthdate') = %1$L",
          params.beneficiaryBirthdate,
        ),
        format("b.last_name = %1$L", params.beneficiaryLastName),
        format(
          "conventions.date_start::date <= %1$L",
          addDays(dateStartToMatch, numberOfDaysTolerance),
        ),
        format(
          "conventions.date_start::date >= %1$L",
          subDays(dateStartToMatch, numberOfDaysTolerance),
        ),
        format("conventions.status not in (%L)", statusesToIgnore),
      ],
      orderByClause: "ORDER BY conventions.date_start DESC",
      limit: 20,
    });

    return conventions.map((c) => c.id);
  }

  public async getAllConventionsForThoseEndingThatDidntReceivedAssessmentLink(
    dateEnd: Date,
  ): Promise<ConventionReadDto[]> {
    return this.#getConventionsWhere({
      orderByClause: "ORDER BY conventions.date_start DESC",
      whereClauses: [
        this.#whereConventionsDateEndMatch(dateEnd),
        this.#whereConventionsAreValidated(),
        this.#whereConventionsAssessmentEmailHasNotBeenAlreadySent(),
      ],
    });
  }

  public async getConventionById(
    id: ConventionId,
  ): Promise<ConventionReadDto | undefined> {
    return getReadConventionById(this.transaction, id);
  }

  public getConventionsByFilters(
    filters: GetConventionsByFiltersQueries,
  ): Promise<ConventionReadDto[]> {
    return this.#getConventionsWhere({
      orderByClause: "ORDER BY conventions.date_start DESC",
      whereClauses:
        makeQueryWhereClauseFromFilters(filters).filter(filterNotFalsy),
    });
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

    return this.#getConventionsWhere({
      limit: params.limit,
      whereClauses: [
        ...makeQueryWhereClauseFromFilters(params.filters),
        params.scope.agencyKinds
          ? format("agencies.kind IN (%1$L)", params.scope.agencyKinds)
          : format("agencies.id IN (%1$L)", params.scope.agencyIds),
      ].filter(filterNotFalsy),
      orderByClause: "ORDER BY conventions.date_start DESC",
    });
  }

  public async getLatestConventions({
    status,
    agencyId,
  }: ListConventionsRequestDto): Promise<ConventionReadDto[]> {
    return this.#getConventionsWhere({
      whereClauses: [
        status && format("conventions.status = %1$L", status),
        agencyId && format("conventions.agency_id::text = %1$L", agencyId),
      ].filter(filterNotFalsy),
      orderByClause: "ORDER BY date_validation DESC",
      limit: 10,
    });
  }

  async #getConventionsWhere({
    whereClauses,
    orderByClause,
    limit,
  }: GetConventionsRequestProperties): Promise<ConventionReadDto[]> {
    const query = [
      selectAllConventionDtosById,
      whereClauses &&
        whereClauses.length > 0 &&
        `WHERE ${whereClauses.join(" AND ")}`,
      orderByClause,
      limit && `LIMIT ${limit}`,
    ]
      .filter(filterNotFalsy)
      .join("\n");

    const pgResult = await executeKyselyRawSqlQuery<{ dto: unknown }>(
      this.transaction,
      query,
    );
    return pgResult.rows.map((row) => conventionReadSchema.parse(row.dto));
  }

  #whereConventionsAreValidated(): WhereClause {
    return format("conventions.status IN (%1$L)", validatedConventionStatuses);
  }

  #whereConventionsAssessmentEmailHasNotBeenAlreadySent(): WhereClause {
    return format(
      "conventions.id NOT IN (SELECT (payload ->> 'id')::uuid FROM outbox where topic = 'EmailWithLinkToCreateAssessmentSent' )",
    );
  }

  #whereConventionsDateEndMatch(dateEnd: Date): WhereClause {
    return format("conventions.date_end::date = %1$L", dateEnd);
  }
}

const makeQueryWhereClauseFromFilters = ({
  startDateGreater,
  startDateLessOrEqual,
  withStatuses,
}: GetConventionsByFiltersQueries) => [
  withStatuses && withStatuses.length > 0
    ? format("conventions.status IN (%1$L)", withStatuses)
    : undefined,
  startDateLessOrEqual
    ? format("conventions.date_start::date <= %1$L", startDateLessOrEqual)
    : undefined,
  startDateGreater
    ? format("conventions.date_start::date > %1$L", startDateGreater)
    : undefined,
];
