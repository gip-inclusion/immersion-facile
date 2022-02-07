import { format } from "date-fns";
import { PoolClient } from "pg";
import { ImmersionApplicationEntity } from "../../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../../../domain/immersionApplication/ports/ImmersionApplicationRepository";
import { ImmersionApplicationId } from "../../../shared/ImmersionApplicationDto";
import { optional } from "./pgUtils";

const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

export class PgImmersionApplicationRepository
  implements ImmersionApplicationRepository
{
  constructor(private client: PoolClient) {}

  public async getAll(): Promise<ImmersionApplicationEntity[]> {
    const pgResult = await this.client.query(
      "SELECT * FROM immersion_applications",
    );
    return pgResult.rows.map((pgImmersionApplication) =>
      this.pgToEntity(pgImmersionApplication),
    );
  }

  public async getById(
    applicationId: ImmersionApplicationId,
  ): Promise<ImmersionApplicationEntity | undefined> {
    const pgResult = await this.client.query(
      `SELECT * FROM immersion_applications
      WHERE id = $1 `,
      [applicationId],
    );

    const pgImmersionApplication = pgResult.rows[0];
    if (!pgImmersionApplication) return;

    return this.pgToEntity(pgImmersionApplication);
  }

  public async save(
    immersionApplicationEntity: ImmersionApplicationEntity,
  ): Promise<ImmersionApplicationId | undefined> {
    // prettier-ignore
    const { id, status, email, firstName, lastName, phone, agencyId, dateSubmission, dateStart, dateEnd, siret, businessName, mentor, mentorPhone, mentorEmail, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionProfession, immersionActivities, immersionSkills, beneficiaryAccepted, enterpriseAccepted, postalCode, workConditions } =
      immersionApplicationEntity.toDto();

    const query = `INSERT INTO immersion_applications(
        id, status, email, first_name, last_name, phone, agency_id, date_submission, date_start, date_end, siret, business_name, mentor, mentor_phone, mentor_email, schedule, individual_protection,
        sanitary_prevention, sanitary_prevention_description, immersion_address, immersion_objective, immersion_profession, immersion_activities, immersion_skills, beneficiary_accepted, enterprise_accepted, postal_code, work_conditions
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)`;

    // prettier-ignore
    await this.client.query(query, [id, status, email, firstName, lastName, phone, agencyId, dateSubmission, dateStart, dateEnd, siret, businessName, mentor, mentorPhone, mentorEmail, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionProfession, immersionActivities, immersionSkills, beneficiaryAccepted, enterpriseAccepted, postalCode, workConditions]);
    return immersionApplicationEntity.id;
  }

  public async updateImmersionApplication(
    immersionApplicationEntity: ImmersionApplicationEntity,
  ): Promise<ImmersionApplicationId | undefined> {
    // prettier-ignore
    const { id, status, email, firstName, lastName, phone, agencyId, dateSubmission, dateStart, dateEnd, siret, businessName, mentor, mentorPhone, mentorEmail, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionProfession, immersionActivities, immersionSkills, beneficiaryAccepted, enterpriseAccepted, workConditions } =
      immersionApplicationEntity.toDto();

    const query = `UPDATE immersion_applications
      SET status=$2,  email=$3,  first_name=$4,  last_name=$5,  phone=$6,  agency_id=$7, date_submission=$8, date_start=$9, date_end=$10, siret=$11,
        business_name=$12, mentor=$13, mentor_phone=$14, mentor_email=$15, schedule=$16, individual_protection=$17, sanitary_prevention=$18, sanitary_prevention_description=$19, immersion_address=$20,
        immersion_objective=$21, immersion_profession=$22, immersion_activities=$23, immersion_skills=$24, beneficiary_accepted=$25, enterprise_accepted=$26,  work_conditions=$27
      WHERE id=$1`;

    // prettier-ignore
    await this.client.query(query, [id, status, email, firstName, lastName, phone, agencyId, dateSubmission, dateStart, dateEnd, siret, businessName, mentor, mentorPhone, mentorEmail, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionProfession, immersionActivities, immersionSkills, beneficiaryAccepted, enterpriseAccepted, workConditions]);
    return immersionApplicationEntity.id;
  }

  pgToEntity(params: Record<any, any>): ImmersionApplicationEntity {
    return ImmersionApplicationEntity.create({
      id: params.id,
      source: "GENERIC",
      status: params.status,
      email: params.email,
      firstName: params.first_name,
      lastName: params.last_name,
      phone: optional(params.phone),
      postalCode: optional(params.postal_code),
      agencyId: params.agency_id,
      dateSubmission: toDateString(params.date_submission),
      dateStart: toDateString(params.date_start),
      dateEnd: toDateString(params.date_end),
      siret: params.siret,
      businessName: params.business_name,
      mentor: params.mentor,
      mentorPhone: params.mentor_phone,
      mentorEmail: params.mentor_email,
      schedule: params.schedule,
      workConditions: optional(params.work_conditions),
      individualProtection: params.individual_protection,
      sanitaryPrevention: params.sanitary_prevention,
      // prettier-ignore
      sanitaryPreventionDescription: optional(params.sanitary_prevention_description),
      immersionAddress: optional(params.immersion_address),
      immersionObjective: params.immersion_objective,
      immersionProfession: params.immersion_profession,
      immersionActivities: params.immersion_activities,
      immersionSkills: optional(params.immersion_skills),
      beneficiaryAccepted: params.beneficiary_accepted,
      enterpriseAccepted: params.enterprise_accepted,
    });
  }
}
