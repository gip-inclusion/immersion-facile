import { PoolClient } from "pg";
import format from "pg-format";
import {
  ConventionId,
  ConventionReadDto,
  ListConventionsRequestDto,
  validatedConventionStatuses,
} from "shared";
import { ConventionQueries } from "../../../domain/convention/ports/ConventionQueries";
import { ImmersionAssessmentEmailParams } from "../../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
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

  public async getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink(
    dateEnd: Date,
  ): Promise<ImmersionAssessmentEmailParams[]> {
    const pgResult = await this.client.query(
      format(
        `
        WITH beneficiaries AS (SELECT conventions.id as convention_id, actors.* from actors LEFT JOIN conventions ON actors.id = beneficiary_id),
             mentors AS (SELECT conventions.id as convention_id, actors.* from actors LEFT JOIN conventions ON actors.id = mentor_id)
        SELECT JSON_BUILD_OBJECT(
              'immersionId', conventions.id, 
              'beneficiaryFirstName', beneficiaries.first_name, 
              'beneficiaryLastName', beneficiaries.last_name,
              'mentorName', CONCAT(mentors.first_name, ' ', mentors.last_name), 
              'mentorEmail', mentors.email) AS params
       FROM conventions 
       LEFT JOIN beneficiaries ON beneficiaries.convention_id = conventions.id
       LEFT JOIN mentors ON mentors.convention_id = conventions.id
       WHERE date_end::date = $1
       AND status IN (%1$L)
       AND conventions.id NOT IN (SELECT (payload ->> 'id')::uuid FROM outbox where topic = 'EmailWithLinkToCreateAssessmentSent' )`,
        validatedConventionStatuses,
      ),
      [dateEnd],
    );
    return pgResult.rows.map((row) => row.params);
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
    const pgResult = await this.client.query(query);
    return pgResult.rows.map((row) => row.dto);
  }
}
