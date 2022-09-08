import { PoolClient } from "pg";
import {
  ConventionDto,
  ConventionDtoWithoutExternalId,
  ConventionExternalId,
  ConventionId,
} from "shared/src/convention/convention.dto";
import { ConventionRepository } from "../../../domain/convention/ports/ConventionRepository";
import {
  notifyAndThrowErrorDiscord,
  notifyDiscord,
} from "../../../utils/notifyDiscord";
import { getReadConventionById } from "./pgConventionSql";

export class PgConventionRepository implements ConventionRepository {
  constructor(private client: PoolClient) {}

  public async getById(
    conventionId: ConventionId,
  ): Promise<ConventionDto | undefined> {
    const readDto = await getReadConventionById(this.client, conventionId);
    if (!readDto) return;
    const { agencyName, ...dto } = readDto;
    return dto;
  }

  public async save(
    convention: ConventionDtoWithoutExternalId,
  ): Promise<ConventionExternalId> {
    // prettier-ignore
    const { signatories: { beneficiary, mentor }, id, status, agencyId, dateSubmission, dateStart, dateEnd, dateValidation, siret, businessName, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation, immersionActivities, immersionSkills, postalCode, workConditions, internshipKind } =
      convention

    try {
      const query_insert_convention = `INSERT INTO conventions(
          id, status, agency_id, date_submission, date_start, date_end, date_validation, siret, business_name, schedule, individual_protection,
          sanitary_prevention, sanitary_prevention_description, immersion_address, immersion_objective, immersion_appellation, immersion_activities, immersion_skills, postal_code, work_conditions, internship_kind
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`;

      // prettier-ignore
      await this.client.query(query_insert_convention, [id, status, agencyId, dateSubmission, dateStart, dateEnd, dateValidation, siret, businessName, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation.appellationCode, immersionActivities, immersionSkills, postalCode, workConditions, internshipKind]);

      const query_insert_beneficiary = `INSERT into signatories(
        convention_id, role, first_name, last_name, email, phone, signed_at, extra_fields)
        VALUES($1, 'beneficiary', $2, $3, $4, $5, $6, JSON_BUILD_OBJECT('emergencyContact', $7::text, 'emergencyContactPhone', $8::text))
      `;
      // prettier-ignore
      await this.client.query(query_insert_beneficiary, [id, beneficiary.firstName, beneficiary.lastName, beneficiary.email, beneficiary.phone, beneficiary.signedAt, beneficiary.emergencyContact, beneficiary.emergencyContactPhone]);

      const query_insert_mentor = `INSERT into signatories(
        convention_id, role, first_name, last_name, email, phone, signed_at, extra_fields)
        VALUES($1, 'establishment', $2, $3, $4, $5, $6, JSON_BUILD_OBJECT('job', $7::text))
      `;
      // prettier-ignore
      await this.client.query(query_insert_mentor, [id, mentor.firstName, mentor.lastName, mentor.email, mentor.phone, mentor.signedAt, mentor.job]);
    } catch (error: any) {
      notifyDiscord(
        `Erreur lors de la sauvegarde de la convention  suivante : ${JSON.stringify(
          convention,
        )}`,
      );
      notifyAndThrowErrorDiscord(error);
    }
    try {
      const query_insert_external_id = `INSERT INTO convention_external_ids(convention_id) VALUES($1) RETURNING external_id;`;
      const convention_external_id = await this.client.query(
        query_insert_external_id,
        [id],
      );
      return convention_external_id.rows[0]?.external_id?.toString();
    } catch (error: any) {
      notifyDiscord(
        `Erreur lors de la sauvegarde de l'id externe de la convention suivante : ${JSON.stringify(
          convention,
        )}`,
      );
      notifyAndThrowErrorDiscord(error);
      return "";
    }
  }

  public async update(
    convention: ConventionDto,
  ): Promise<ConventionId | undefined> {
    // prettier-ignore
    const { signatories: { beneficiary, mentor }, id, status, agencyId, dateSubmission, dateStart, dateEnd, dateValidation, siret, businessName, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation, immersionActivities, immersionSkills, workConditions } =
      convention

    const updateConventionQuery = `  
      UPDATE conventions
        SET status=$2,  
            agency_id=$3, 
            date_submission=$4, date_start=$5, date_end=$6, date_validation=$7, 
            siret=$8,
            business_name=$9, 
            schedule=$10, individual_protection=$11, sanitary_prevention=$12, sanitary_prevention_description=$13, immersion_address=$14,
            immersion_objective=$15, immersion_appellation=$16, immersion_activities=$17, immersion_skills=$18, work_conditions=$19, 
            updated_at=now()
      WHERE id=$1`;
    // prettier-ignore
    await this.client.query(updateConventionQuery, [id, status, agencyId, dateSubmission, dateStart, dateEnd, dateValidation, siret, businessName, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation.appellationCode, immersionActivities, immersionSkills, workConditions]);

    const updateBeneficiaryQuery = `  
    UPDATE signatories
      SET first_name=$2,  last_name=$3, email=$4, phone=$5, signed_at=$6,
          extra_fields=JSON_STRIP_NULLS(JSON_BUILD_OBJECT('emergencyContact', $7::text,'emergencyContactPhone', $8::text))
    WHERE convention_id=$1 AND role = 'beneficiary'`;
    // prettier-ignore
    await this.client.query(updateBeneficiaryQuery, [id, beneficiary.firstName, beneficiary.lastName, beneficiary.email, beneficiary.phone, beneficiary.signedAt,  beneficiary.emergencyContact, beneficiary.emergencyContactPhone]);

    const updateMentorQuery = `  
    UPDATE signatories
      SET first_name=$2,  last_name=$3, email=$4, phone=$5, signed_at=$6,
          extra_fields=JSON_STRIP_NULLS(JSON_BUILD_OBJECT('job', $7::text))
    WHERE convention_id=$1 AND role = 'establishment'`;
    // prettier-ignore
    await this.client.query(updateMentorQuery, [id, mentor.firstName, mentor.lastName, mentor.email, mentor.phone, mentor.signedAt, mentor.job]);

    return convention.id;
  }
}
