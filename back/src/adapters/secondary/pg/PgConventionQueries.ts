import { PoolClient } from "pg";
import format from "pg-format";
import {
  ConventionId,
  ConventionReadDto,
  conventionReadSchema,
  Flavor,
  ListConventionsRequestDto,
  validatedConventionStatuses,
} from "shared";
import {
  ConventionQueries,
  GetConventionByFiltersQueries,
} from "../../../domain/convention/ports/ConventionQueries";
import {
  getReadConventionById,
  selectAllConventionDtosById,
} from "./pgConventionSql";

type WhereClause = Flavor<string, "WhereClause">;

type GetConventionsRequestProperties = {
  whereClauses?: WhereClause[];
  orderByClause?: string;
  limit?: number;
};

export class PgConventionQueries implements ConventionQueries {
  constructor(private client: PoolClient) {}

  getConventionsByFilters({
    startDateGreater,
    startDateLessOrEqual,
    withStatuses,
  }: GetConventionByFiltersQueries): Promise<ConventionReadDto[]> {
    return this.getConventionsWhere({
      whereClauses: [
        withStatuses &&
          withStatuses.length > 0 &&
          format("conventions.status IN (%1$L)", withStatuses),
        startDateLessOrEqual &&
          format("conventions.date_start::date <= %1$L", startDateLessOrEqual),
        startDateGreater &&
          format("conventions.date_start::date > %1$L", startDateGreater),
      ].filter((clause): clause is WhereClause => !!clause),
    });
  }

  public async getLatestConventions({
    status,
    agencyId,
  }: ListConventionsRequestDto): Promise<ConventionReadDto[]> {
    return this.getConventionsWhere({
      whereClauses: [
        status && format("conventions.status = %1$L", status),
        agencyId && format("conventions.agency_id::text = %1$L", agencyId),
      ].filter((clause): clause is WhereClause => !!clause),
      orderByClause: "ORDER BY date_validation DESC",
      limit: 10,
    });
  }

  public async getConventionById(
    id: ConventionId,
  ): Promise<ConventionReadDto | undefined> {
    return getReadConventionById(this.client, id);
  }

  public async getAllConventionsForThoseEndingThatDidntReceivedAssessmentLink(
    dateEnd: Date,
  ): Promise<ConventionReadDto[]> {
    return this.getConventionsWhere({
      whereClauses: [
        this.whereConventionsDateEndMatch(dateEnd),
        this.whereConventionsAreValidated(),
        this.whereConventionsAssessmentEmailHasNotBeenAlreadySent(),
      ],
    });
  }

  private async getConventionsWhere({
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
      .filter((queryPart): queryPart is string => !!queryPart)
      .join("\n");

    const pgResult = await this.client.query<{ dto: unknown }>(query);
    return pgResult.rows.map((row) => conventionReadSchema.parse(row.dto));
  }

  private whereConventionsAssessmentEmailHasNotBeenAlreadySent(): WhereClause {
    return format(
      "conventions.id NOT IN (SELECT (payload ->> 'id')::uuid FROM outbox where topic = 'EmailWithLinkToCreateAssessmentSent' )",
    );
  }

  private whereConventionsAreValidated(): WhereClause {
    return format("conventions.status IN (%1$L)", validatedConventionStatuses);
  }

  private whereConventionsDateEndMatch(dateEnd: Date): WhereClause {
    return format("conventions.date_end::date = %1$L", dateEnd);
  }
}
