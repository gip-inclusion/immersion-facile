import { format } from "date-fns";
import { PoolClient } from "pg";
import { ImmersionApplicationEntity } from "../../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../../../domain/immersionApplication/ports/ImmersionApplicationRepository";
import { ImmersionApplicationId } from "../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { optional } from "./pgUtils";

const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

export class PgImmersionApplicationRepository
  implements ImmersionApplicationRepository
{
  constructor(private client: PoolClient) {}

  public async getLatestUpdated(): Promise<ImmersionApplicationEntity[]> {
    const pgResult = await this.client.query(
      `SELECT *, vad.*
       FROM immersion_applications 
       LEFT JOIN view_appellations_dto AS vad 
         ON vad.appellation_code = immersion_applications.immersion_appellation
       ORDER BY immersion_applications.updated_at DESC
       LIMIT 10`,
    );
    return pgResult.rows.map((pgImmersionApplication) =>
      this.pgToEntity(pgImmersionApplication),
    );
  }

  public async getById(
    applicationId: ImmersionApplicationId,
  ): Promise<ImmersionApplicationEntity | undefined> {
    const pgResult = await this.client.query(
      `SELECT *, vad.*
       FROM immersion_applications
       LEFT JOIN view_appellations_dto AS vad 
       ON vad.appellation_code = immersion_applications.immersion_appellation
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
    const { id, status, email, firstName, lastName, phone, emergencyContact, emergencyContactPhone, agencyId, dateSubmission, dateStart, dateEnd, siret, businessName, mentor, mentorPhone, mentorEmail, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation, immersionActivities, immersionSkills, beneficiaryAccepted, enterpriseAccepted, postalCode, workConditions, peExternalId } =
      immersionApplicationEntity.toDto();

    const query = `INSERT INTO immersion_applications(
        id, status, email, first_name, last_name, phone, emergency_contact, emergency_contact_phone, agency_id, date_submission, date_start, date_end, siret, business_name, mentor, mentor_phone, mentor_email, schedule, individual_protection,
        sanitary_prevention, sanitary_prevention_description, immersion_address, immersion_objective, immersion_appellation, immersion_activities, immersion_skills, beneficiary_accepted, enterprise_accepted, postal_code, work_conditions, pe_external_id
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)`;

    // prettier-ignore
    await this.client.query(query, [id, status, email, firstName, lastName, phone, emergencyContact, emergencyContactPhone, agencyId, dateSubmission, dateStart, dateEnd, siret, businessName, mentor, mentorPhone, mentorEmail, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation.appellationCode, immersionActivities, immersionSkills, beneficiaryAccepted, enterpriseAccepted, postalCode, workConditions, peExternalId]);
    return immersionApplicationEntity.id;
  }

  public async updateImmersionApplication(
    immersionApplicationEntity: ImmersionApplicationEntity,
  ): Promise<ImmersionApplicationId | undefined> {
    // prettier-ignore
    const { id, status, email, firstName, lastName, phone, emergencyContact, emergencyContactPhone, agencyId, dateSubmission, dateStart, dateEnd, siret, businessName, mentor, mentorPhone, mentorEmail, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation, immersionActivities, immersionSkills, beneficiaryAccepted, enterpriseAccepted, workConditions, peExternalId } =
      immersionApplicationEntity.toDto();

    const query = `UPDATE immersion_applications
      SET status=$2,  email=$3,  first_name=$4,  last_name=$5,  phone=$6,  emergency_contact=$7, emergency_contact_phone=$8, 
      agency_id=$9, date_submission=$10, date_start=$11, date_end=$12, siret=$13,
        business_name=$14, mentor=$15, mentor_phone=$16, mentor_email=$17, schedule=$18, individual_protection=$19, sanitary_prevention=$20, sanitary_prevention_description=$21, immersion_address=$22,
        immersion_objective=$23, immersion_appellation=$24, immersion_activities=$25, immersion_skills=$26, beneficiary_accepted=$27, enterprise_accepted=$28, work_conditions=$29, pe_external_id=$30, 
        updated_at=now()
      WHERE id=$1`;

    // prettier-ignore
    await this.client.query(query, [id, status, email, firstName, lastName, phone, emergencyContact, emergencyContactPhone, agencyId, dateSubmission, dateStart, dateEnd, siret, businessName, mentor, mentorPhone, mentorEmail, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation.appellationCode, immersionActivities, immersionSkills, beneficiaryAccepted, enterpriseAccepted, workConditions, peExternalId]);
    return immersionApplicationEntity.id;
  }

  pgToEntity(params: Record<any, any>): ImmersionApplicationEntity {
    return ImmersionApplicationEntity.create({
      id: params.id,
      status: params.status,
      email: params.email,
      firstName: params.first_name,
      lastName: params.last_name,
      phone: optional(params.phone),
      postalCode: optional(params.postal_code),
      emergencyContact: optional(params.emergency_contact),
      emergencyContactPhone: optional(params.emergency_contact_phone),
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
      immersionAppellation: {
        romeCode: params.rome_code,
        romeLabel: params.rome_label,
        appellationCode: params.appellation_code.toString(),
        appellationLabel: params.appellation_label,
      },
      immersionActivities: params.immersion_activities,
      immersionSkills: optional(params.immersion_skills),
      beneficiaryAccepted: params.beneficiary_accepted,
      enterpriseAccepted: params.enterprise_accepted,
      peExternalId: optional(params.pe_external_id),
    });
  }
}
