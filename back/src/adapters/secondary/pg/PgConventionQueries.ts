import { PoolClient } from "pg";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { ConventionQueries } from "../../../domain/convention/ports/ConventionQueries";
import { ConventionRawBeforeExportVO } from "../../../domain/convention/valueObjects/ConventionRawBeforeExportVO";
import { ImmersionAssessmentEmailParams } from "../../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { pgConventionRowToDto } from "./PgConventionRepository";
import { optional } from "./pgUtils";
import format from "pg-format";
import { validatedConventionStatuses } from "shared/src/convention/convention.dto";

export class PgConventionQueries implements ConventionQueries {
  constructor(private client: PoolClient) {}
  public async getAllConventionsForExport(): Promise<
    ConventionRawBeforeExportVO[]
  > {
    const pgResult = await this.client.query(`
      SELECT *, immersion_applications.status as immersion_applications_status, agencies.status as agency_status
      FROM immersion_applications
      LEFT JOIN agencies ON agencies.id = immersion_applications.agency_id
      LEFT JOIN public_appellations_data AS pad ON pad.ogr_appellation = immersion_applications.immersion_appellation
      `);
    return pgResult.rows.map(
      (row) =>
        new ConventionRawBeforeExportVO({
          agencyName: row.name,
          status: row.immersion_applications_status,
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
        }),
    );
  }

  public async getLatestUpdated(): Promise<ConventionDto[]> {
    const pgResult = await this.client.query(
      `SELECT *, vad.*
       FROM immersion_applications 
       LEFT JOIN view_appellations_dto AS vad 
         ON vad.appellation_code = immersion_applications.immersion_appellation
       ORDER BY immersion_applications.updated_at DESC
       LIMIT 10`,
    );

    return pgResult.rows.map(pgConventionRowToDto);
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
       FROM immersion_applications 
       WHERE date_end::date = $1
       AND status IN (%1$L)
       AND id NOT IN (SELECT (payload ->> 'id')::uuid FROM outbox where topic = 'EmailWithLinkToCreateAssessmentSent' )`,
        validatedConventionStatuses,
      ),
      [dateEnd],
    );
    return pgResult.rows.map((row) => row.params);
  }
}
