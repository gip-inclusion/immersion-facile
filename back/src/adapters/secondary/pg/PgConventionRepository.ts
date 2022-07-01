import { format } from "date-fns";
import { PoolClient } from "pg";
import {
  ConventionDto,
  ConventionDtoWithoutExternalId,
  ConventionExternalId,
  ConventionId,
} from "shared/src/convention/convention.dto";
import { ConventionRepository } from "../../../domain/convention/ports/ConventionRepository";
import { optional } from "./pgUtils";

const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

export class PgConventionRepository implements ConventionRepository {
  constructor(private client: PoolClient) {}

  public async getById(
    conventionId: ConventionId,
  ): Promise<ConventionDto | undefined> {
    const pgResult = await this.client.query(
      `SELECT conventions.*, vad.*, cei.external_id, partners.user_pe_external_id
       FROM conventions
       LEFT JOIN view_appellations_dto AS vad 
        ON vad.appellation_code = conventions.immersion_appellation
       LEFT JOIN convention_external_ids AS cei
        ON cei.convention_id = conventions.id
       LEFT JOIN partners_pe_connect AS partners
        ON partners.convention_id = id
       WHERE id = $1 `,
      [conventionId],
    );

    const pgConvention = pgResult.rows[0];
    if (!pgConvention) return;

    return pgConventionRowToDto(pgConvention);
  }

  public async save(
    convention: ConventionDtoWithoutExternalId,
  ): Promise<ConventionExternalId> {
    // prettier-ignore
    const { id, status, email, firstName, lastName, phone, emergencyContact, emergencyContactPhone, agencyId, dateSubmission, dateStart, dateEnd, dateValidation, siret, businessName, mentor, mentorPhone, mentorEmail, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation, immersionActivities, immersionSkills, beneficiaryAccepted, enterpriseAccepted, postalCode, workConditions } =
      convention

    const query_insert_application = `INSERT INTO conventions(
        id, status, email, first_name, last_name, phone, emergency_contact, emergency_contact_phone, agency_id, date_submission, date_start, date_end, date_validation, siret, business_name, mentor, mentor_phone, mentor_email, schedule, individual_protection,
        sanitary_prevention, sanitary_prevention_description, immersion_address, immersion_objective, immersion_appellation, immersion_activities, immersion_skills, beneficiary_accepted, enterprise_accepted, postal_code, work_conditions
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)`;

    // prettier-ignore
    await this.client.query(query_insert_application, [id, status, email, firstName, lastName, phone, emergencyContact, emergencyContactPhone, agencyId, dateSubmission, dateStart, dateEnd, dateValidation, siret, businessName, mentor, mentorPhone, mentorEmail, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation.appellationCode, immersionActivities, immersionSkills, beneficiaryAccepted, enterpriseAccepted, postalCode, workConditions]);

    const query_insert_external_id = `INSERT INTO convention_external_ids(convention_id) VALUES($1) RETURNING external_id;`;
    const convention_external_id = await this.client.query(
      query_insert_external_id,
      [id],
    );

    return convention_external_id.rows[0]?.external_id?.toString();
  }

  public async update(
    convention: ConventionDto,
  ): Promise<ConventionId | undefined> {
    // prettier-ignore
    const { id, status, email, firstName, lastName, phone, emergencyContact, emergencyContactPhone, agencyId, dateSubmission, dateStart, dateEnd, dateValidation, siret, businessName, mentor, mentorPhone, mentorEmail, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation, immersionActivities, immersionSkills, beneficiaryAccepted, enterpriseAccepted, workConditions } =
      convention

    const query = `UPDATE conventions
      SET status=$2,  email=$3,  first_name=$4,  last_name=$5,  phone=$6,  emergency_contact=$7, emergency_contact_phone=$8, 
      agency_id=$9, date_submission=$10, date_start=$11, date_end=$12, date_validation=$13, siret=$14,
        business_name=$15, mentor=$16, mentor_phone=$17, mentor_email=$18, schedule=$19, individual_protection=$20, sanitary_prevention=$21, sanitary_prevention_description=$22, immersion_address=$23,
        immersion_objective=$24, immersion_appellation=$25, immersion_activities=$26, immersion_skills=$27, beneficiary_accepted=$28, enterprise_accepted=$29, work_conditions=$30, 
        updated_at=now()
      WHERE id=$1`;

    // prettier-ignore
    await this.client.query(query, [id, status, email, firstName, lastName, phone, emergencyContact, emergencyContactPhone, agencyId, dateSubmission, dateStart, dateEnd, dateValidation, siret, businessName, mentor, mentorPhone, mentorEmail, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation.appellationCode, immersionActivities, immersionSkills, beneficiaryAccepted, enterpriseAccepted, workConditions]);
    return convention.id;
  }
}

export const pgConventionRowToDto = (
  params: Record<any, any>,
): ConventionDto => ({
  id: params.id,
  externalId: params.external_id?.toString(),
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
  dateValidation: params.date_validation
    ? toDateString(params.date_validation)
    : undefined,
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
  ...(params.user_pe_external_id && {
    federatedIdentity: `peConnect:${params.user_pe_external_id}`,
  }),
});
