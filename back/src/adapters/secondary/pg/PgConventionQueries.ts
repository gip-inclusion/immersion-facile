import { PoolClient } from "pg";
import format from "pg-format";
import {
  ConventionId,
  ConventionReadDto,
  ListConventionsRequestDto,
  validatedConventionStatuses,
} from "shared/src/convention/convention.dto";
import { ConventionQueries } from "../../../domain/convention/ports/ConventionQueries";
import { ConventionRawBeforeExport } from "../../../domain/convention/useCases/ExportConventionsReport";
import { ImmersionAssessmentEmailParams } from "../../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { pgConventionRowToDto } from "./PgConventionRepository";
import { optional } from "./pgUtils";

export class PgConventionQueries implements ConventionQueries {
  constructor(private client: PoolClient) {}
  public async getAllConventionsForExport(): Promise<
    ConventionRawBeforeExport[]
  > {
    const pgResult = await this.client.query(`
      SELECT *, conventions.status as convention_status, agencies.status as agency_status, cei.external_id
      FROM conventions
      LEFT JOIN agencies ON agencies.id = conventions.agency_id
      LEFT JOIN public_appellations_data AS pad ON pad.ogr_appellation = conventions.immersion_appellation
      LEFT JOIN convention_external_ids AS cei ON cei.convention_id = conventions.id
      `);

    return pgResult.rows.map((row) => ({
      agencyName: row.name,
      status: row.convention_status,
      postalCode: row.postal_code,
      email: row.email,
      phone: row.phone,
      firstName: row.first_name,
      lastName: row.last_name,
      emergencyContact: row.emergency_contact,
      emergencyContactPhone: row.emergency_contact_phone,
      dateSubmission: new Date(row.date_submission).toISOString(),
      dateStart: new Date(row.date_start).toISOString(),
      dateEnd: new Date(row.date_end).toISOString(),
      dateValidation:
        row.validation_date ?? new Date(row.date_validation).toISOString(),
      businessName: row.business_name,
      mentor: row.mentor,
      mentorPhone: row.mentor_phone,
      mentorEmail: row.mentor_email,
      immersionObjective: row.immersion_objective,
      immersionProfession: row.libelle_appellation_court,
      beneficiaryAccepted: row.beneficiary_accepted,
      enterpriseAccepted: row.enterprise_accepted,
      schedule: row.schedule,
      siret: row.siret,
      workConditions: optional(row.work_conditions),
    }));
  }

  public async getLatestConventions({
    status,
    agencyId,
  }: ListConventionsRequestDto): Promise<ConventionReadDto[]> {
    const filtersSQL = [
      status && format("c.status = %1$L", status),
      agencyId && format("c.agency_id::text = %1$L", agencyId),
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
    return (
      await this.getConventionsWhere(format("WHERE c.id::text = %1$L", id))
    ).at(0);
  }

  public async getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink(
    dateEnd: Date,
  ): Promise<ImmersionAssessmentEmailParams[]> {
    const pgResult = await this.client.query(
      format(
        `SELECT JSON_BUILD_OBJECT(
              'immersionId', id, 
              'beneficiaryFirstName', first_name, 
              'beneficiaryLastName', last_name,
              'mentorName', mentor, 
              'mentorEmail', mentor_email) AS params
       FROM conventions 
       WHERE date_end::date = $1
       AND status IN (%1$L)
       AND id NOT IN (SELECT (payload ->> 'id')::uuid FROM outbox where topic = 'EmailWithLinkToCreateAssessmentSent' )`,
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
  ) {
    const query = `
    SELECT 
      c.*, vad.*, cei.external_id,
      agencies.name AS agency_name
      FROM conventions AS c 
      LEFT JOIN convention_external_ids AS cei ON cei.convention_id = c.id
      LEFT JOIN agencies ON agencies.id = c.agency_id
      LEFT JOIN view_appellations_dto AS vad ON vad.appellation_code = c.immersion_appellation
      LEFT JOIN partners_pe_connect AS partners ON partners.convention_id = c.id
    ${whereClause}
    ${orderByCause ?? ""}
    ${limit ? "LIMIT " + limit : ""}`;
    const pgResult = await this.client.query(query);
    return pgResult.rows.map((row) => ({
      ...pgConventionRowToDto(row),
      agencyName: row.agency_name,
    }));
  }
}
