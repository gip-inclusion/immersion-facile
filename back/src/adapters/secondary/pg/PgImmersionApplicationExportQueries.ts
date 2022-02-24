import { PoolClient } from "pg";
import { ImmersionApplicationExportQueries } from "../../../domain/immersionApplication/ports/ImmersionApplicationExportQueries";
import { ImmersionApplicationRawBeforeExportVO } from "../../../domain/immersionApplication/valueObjects/ImmersionApplicationRawBeforeExportVO";
import { format } from "date-fns";
import { optional } from "./pgUtils";

export class PgImmersionApplicationExportQueries
  implements ImmersionApplicationExportQueries
{
  constructor(private client: PoolClient) {}
  public async getAllApplicationsForExport(): Promise<
    ImmersionApplicationRawBeforeExportVO[]
  > {
    const pgResult = await this.client.query(`
      SELECT *, immersion_applications.status as immersion_applications_status, agencies.status as agency_status
      FROM immersion_applications
      LEFT JOIN agencies ON agencies.id = immersion_applications.agency_id
      `);
    return pgResult.rows.map(
      (row) =>
        new ImmersionApplicationRawBeforeExportVO({
          agencyName: row.name,
          status: row.immersion_applications_status,
          postalCode: row.postal_code,
          email: row.email,
          phone: row.phone,
          firstName: row.first_name,
          lastName: row.last_name,
          dateSubmission: format(row.date_submission, "dd/MM/yyyy"),
          dateStart: format(row.date_start, "dd/MM/yyyy"),
          dateEnd: format(row.date_end, "dd/MM/yyyy"),
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
          peExternalId: optional(row.pe_external_id),
          workConditions: optional(row.work_conditions),
        }),
    );
  }
}
