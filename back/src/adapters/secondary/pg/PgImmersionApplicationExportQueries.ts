import { PoolClient } from "pg";
import { ImmersionApplicationExportQueries } from "../../../domain/immersionApplication/ports/ImmersionApplicationExportQueries";
import { ImmersionApplicationRawBeforeExportVO } from "../../../domain/immersionApplication/valueObjects/ImmersionApplicationRawBeforeExportVO";

export class PgImmersionApplicationExportQueries
  implements ImmersionApplicationExportQueries
{
  constructor(private client: PoolClient) {}
  public async getAllApplicationsForExport(): Promise<
    ImmersionApplicationRawBeforeExportVO[]
  > {
    const pgResult = await this.client.query(`
      SELECT *
      FROM immersion_applications
      LEFT JOIN agencies ON agencies.id = immersion_applications.agency_id
      `);
    return pgResult.rows.map(
      (row) =>
        new ImmersionApplicationRawBeforeExportVO({
          agencyName: row.name,
          status: row.status,
          postalCode: row.postal_code,
          email: row.email,
          phone: row.phone,
          firstName: row.first_name,
          lastName: row.last_name,
          dateSubmission: row.date_submission.toISOString(),
          dateStart: row.date_start.toISOString(),
          dateEnd: row.date_end.toISOString(),
          businessName: row.business_name,
          mentor: row.mentor,
          mentorPhone: row.mentor_phone,
          mentorEmail: row.mentor_email,
          immersionObjective: row.immersion_objective,
          immersionProfession: row.immersion_profession,
          beneficiaryAccepted: row.beneficiary_accepted,
          enterpriseAccepted: row.enterprise_accepted,
          schedule: row.schedule,
          siret: row.siret,
        }),
    );
  }
}
