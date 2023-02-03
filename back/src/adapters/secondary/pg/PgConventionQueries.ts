import { PoolClient } from "pg";
import format from "pg-format";
import {
  ConventionId,
  ConventionReadDto,
  conventionReadSchema,
  ListConventionsRequestDto,
  validatedConventionStatuses,
} from "shared";
import { ConventionQueries } from "../../../domain/convention/ports/ConventionQueries";
import {
  getReadConventionById,
  selectAllConventionDtosById,
} from "./pgConventionSql";

export class PgConventionQueries implements ConventionQueries {
  constructor(private client: PoolClient) {}

  public async getLatestConventions({
    status,
    agencyId,
  }: ListConventionsRequestDto): Promise<ConventionReadDto[]> {
    const filtersSQL = [
      status && format("conventions.status = %1$L", status),
      agencyId && format("conventions.agency_id::text = %1$L", agencyId),
    ].filter((clause) => !!clause);

    const whereClause =
      filtersSQL.length > 0 ? `WHERE ${filtersSQL.join(" AND ")}` : "";
    const orderByClause = "ORDER BY date_validation DESC";
    const limit = 10;
    return this.getConventionsWhere(whereClause, orderByClause, limit);
  }

  public async getConventionById(
    id: ConventionId,
  ): Promise<ConventionReadDto | undefined> {
    return getReadConventionById(this.client, id);
  }

  public async getAllConventionsForThoseEndingThatDidntReceivedAssessmentLink(
    dateEnd: Date,
  ): Promise<ConventionReadDto[]> {
    const filtersSQL = [
      format("conventions.date_end::date = %1$L", dateEnd),
      format("conventions.status IN (%1$L)", validatedConventionStatuses),
      format(
        "conventions.id NOT IN (SELECT (payload ->> 'id')::uuid FROM outbox where topic = 'EmailWithLinkToCreateAssessmentSent' )",
      ),
    ];
    return this.getConventionsWhere(`WHERE ${filtersSQL.join(" AND ")}`);
  }

  private async getConventionsWhere(
    whereClause: string,
    orderByCause?: string,
    limit?: number,
  ): Promise<ConventionReadDto[]> {
    const query = `
    ${selectAllConventionDtosById}
    ${whereClause}
    ${orderByCause ?? ""}
    ${limit ? "LIMIT " + limit : ""}`;
    const pgResult = await this.client.query<{ dto: unknown }>(query);
    return pgResult.rows.map((row) => conventionReadSchema.parse(row.dto));
  }
}
