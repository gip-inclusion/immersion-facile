import { PoolClient, QueryResult } from "pg";
import {
  Beneficiary,
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionDtoWithoutExternalId,
  ConventionExternalId,
  ConventionId,
  EstablishmentRepresentative,
  EstablishmentTutor,
  isEstablishmentTutorIsEstablishmentRepresentative,
} from "shared";
import { ConventionRepository } from "../../../domain/convention/ports/ConventionRepository";
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
    const { signatories: { beneficiary, beneficiaryRepresentative, establishmentRepresentative }, id: conventionId, status, agencyId, dateSubmission, dateStart, dateEnd, dateValidation, siret, businessName, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation, immersionActivities, immersionSkills, postalCode, workConditions, internshipKind,establishmentTutor } =
        convention

    // Insert signatories and remember their id
    const beneficiaryId = await this.insertBeneficiary(beneficiary);
    const establishmentTutorId = await this.insertEstablishmentTutor(
      establishmentTutor,
    );

    const establishmentRepresentativeId =
      isEstablishmentTutorIsEstablishmentRepresentative(convention)
        ? establishmentTutorId
        : await this.insertEstablishmentRepresentative(
            establishmentRepresentative,
          );

    const beneficiaryRepresentativeId =
      beneficiaryRepresentative &&
      (await this.insertBeneficiaryRepresentative(beneficiaryRepresentative));

    const query_insert_convention = `INSERT INTO conventions(
          id, status, agency_id, date_submission, date_start, date_end, date_validation, siret, business_name, schedule, individual_protection,
          sanitary_prevention, sanitary_prevention_description, immersion_address, immersion_objective, immersion_appellation, immersion_activities, immersion_skills, postal_code, work_conditions, internship_kind,
          beneficiary_id, establishment_tutor_id, establishment_representative_id, beneficiary_representative_id
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`;

    // prettier-ignore
    await this.client.query(query_insert_convention, [conventionId, status, agencyId, dateSubmission, dateStart, dateEnd, dateValidation, siret, businessName, schedule, individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation.appellationCode, immersionActivities, immersionSkills, postalCode, workConditions, internshipKind,
                                                      beneficiaryId, establishmentTutorId, establishmentRepresentativeId, beneficiaryRepresentativeId
    ]);

    const query_insert_external_id = `INSERT INTO convention_external_ids(convention_id) VALUES($1) RETURNING external_id;`;
    const convention_external_id = await this.client.query(
      query_insert_external_id,
      [conventionId],
    );
    return convention_external_id.rows[0]?.external_id?.toString();
  }

  public async update(
    convention: ConventionDto,
  ): Promise<ConventionId | undefined> {
    // prettier-ignore
    const { signatories: { beneficiary, beneficiaryRepresentative }, id, establishmentTutor } =
      convention

    const establishment_tutor_id = await this.updateEstablishmentTutor(
      id,
      establishmentTutor,
    );

    await this.updateBeneficiary(id, beneficiary);

    await this.updateConvention({
      convention,
      establishment_tutor_id,
      establishment_representative_id:
        await this.getEstablishmentRepresentativeId({
          convention,
          establishment_tutor_id,
        }),
    });

    if (beneficiaryRepresentative)
      await this.updateBeneficiaryRepresentative(id, beneficiaryRepresentative);
    return convention.id;
  }

  private async getEstablishmentRepresentativeId({
    convention,
    establishment_tutor_id,
  }: {
    convention: ConventionDto;
    establishment_tutor_id: number;
  }) {
    const {
      id,
      signatories: { establishmentRepresentative },
      establishmentTutor,
    } = convention;

    if (
      // Tutor and establishment representative are same person (but may have different IDs)
      isEstablishmentTutorIsEstablishmentRepresentative(convention)
    )
      return establishmentRepresentative.signedAt
        ? this.updateEstablishmentTutor(
            id,
            establishmentTutor,
            establishmentRepresentative.signedAt,
          )
        : establishment_tutor_id;

    if (await this.establishmentTutorAndRepresentativeHaveSameId(id)) {
      return this.insertEstablishmentRepresentative(
        establishmentRepresentative,
      );
    }

    return this.updateEstablishmentRepresentative(
      id,
      establishmentRepresentative,
    );
  }

  private async establishmentTutorAndRepresentativeHaveSameId(
    id: ConventionId,
  ): Promise<boolean> {
    const getConventionEstablishmentTutorAndRepresentativeQuery = `
    SELECT establishment_tutor_id,establishment_representative_id
    FROM conventions
    WHERE id=$1`;
    const queryReturn = await this.client.query<{
      establishment_tutor_id: number;
      establishment_representative_id: number;
    }>(getConventionEstablishmentTutorAndRepresentativeQuery, [id]);
    const result = queryReturn.rows.at(0);
    if (result)
      return (
        result.establishment_tutor_id === result.establishment_representative_id
      );
    throw new Error(`No convention with id '${id}'.`);
  }

  private async updateConvention({
    convention,
    establishment_tutor_id,
    establishment_representative_id,
  }: {
    convention: ConventionDto;
    establishment_tutor_id: number;
    establishment_representative_id: number;
  }) {
    const updateConventionQuery = `  
      UPDATE conventions
        SET status=$2,  
            agency_id=$3, 
            date_submission=$4, date_start=$5, date_end=$6, date_validation=$7, 
            siret=$8,
            business_name=$9, 
            schedule=$10, individual_protection=$11, sanitary_prevention=$12, sanitary_prevention_description=$13, immersion_address=$14,
            immersion_objective=$15, immersion_appellation=$16, immersion_activities=$17, immersion_skills=$18, work_conditions=$19, 
            updated_at=now(),
            establishment_tutor_id=$20, establishment_representative_id=$21
      WHERE id=$1`;
    // prettier-ignore
    await this.client.query(updateConventionQuery, [ convention.id, convention.status, convention.agencyId, convention.dateSubmission, convention.dateStart, convention.dateEnd, convention.dateValidation, convention.siret, convention.businessName, convention.schedule, convention.individualProtection, convention.sanitaryPrevention, convention.sanitaryPreventionDescription, convention.immersionAddress, convention.immersionObjective, convention.immersionAppellation.appellationCode, convention.immersionActivities, convention.immersionSkills, convention.workConditions, establishment_tutor_id,establishment_representative_id ]);
  }

  private async updateBeneficiaryRepresentative(
    id: ConventionId,
    beneficiaryRepresentative: BeneficiaryRepresentative,
  ) {
    const updateBeneficiaryRepresentativeQuery = `  
        UPDATE actors
          SET first_name=$2,  last_name=$3, email=$4, phone=$5, signed_at=$6
        FROM conventions 
        WHERE conventions.id=$1 AND actors.id = conventions.beneficiary_representative_id`;
    // prettier-ignore
    await this.client.query(updateBeneficiaryRepresentativeQuery, [ id, beneficiaryRepresentative.firstName, beneficiaryRepresentative.lastName, beneficiaryRepresentative.email, beneficiaryRepresentative.phone, beneficiaryRepresentative.signedAt, ]);
  }

  private async updateEstablishmentRepresentative(
    id: ConventionId,
    establishmentRepresentative: EstablishmentRepresentative,
  ): Promise<number> {
    const updateEstablishmentRepresentativeQuery = `  
      UPDATE actors
        SET first_name=$2, last_name=$3, email=$4, phone=$5, signed_at=$6
        FROM conventions 
        WHERE conventions.id=$1 AND actors.id = conventions.establishment_representative_id
        RETURNING actors.id
    `;
    // prettier-ignore
    const updateReturn = await this.client.query<{ id: number }>( updateEstablishmentRepresentativeQuery, [ id, establishmentRepresentative.firstName, establishmentRepresentative.lastName, establishmentRepresentative.email, establishmentRepresentative.phone, establishmentRepresentative.signedAt, ]);
    const result = updateReturn.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(updateReturn));
  }

  private async updateEstablishmentTutor(
    id: ConventionId,
    establishmentTutor: EstablishmentTutor,
    signedAt?: string,
  ): Promise<number> {
    const updateEstablishmentTutorQuery = `  
      UPDATE actors
        SET first_name=$2,  last_name=$3, email=$4, phone=$5, signed_at=$7,
          extra_fields=JSON_STRIP_NULLS(JSON_BUILD_OBJECT('job', $6::text))
        FROM conventions 
        WHERE conventions.id=$1 AND actors.id = conventions.establishment_tutor_id
        RETURNING actors.id
    `;
    // prettier-ignore
    const updateReturn = await this.client.query<{ id: number }>( updateEstablishmentTutorQuery,[ id, establishmentTutor.firstName, establishmentTutor.lastName, establishmentTutor.email, establishmentTutor.phone, establishmentTutor.job, signedAt]);
    const result = updateReturn.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(updateReturn));
  }

  private async updateBeneficiary(id: ConventionId, beneficiary: Beneficiary) {
    const updateBeneficiaryQuery = `  
    UPDATE actors
      SET first_name=$2,  last_name=$3, email=$4, phone=$5, signed_at=$6,
          extra_fields=JSON_STRIP_NULLS(JSON_BUILD_OBJECT('emergencyContact', $7::text,'emergencyContactPhone', $8::text))
      FROM conventions 
      WHERE conventions.id=$1 AND actors.id = conventions.beneficiary_id`;
    // prettier-ignore
    await this.client.query(updateBeneficiaryQuery, [ id, beneficiary.firstName, beneficiary.lastName, beneficiary.email, beneficiary.phone, beneficiary.signedAt, beneficiary.emergencyContact, beneficiary.emergencyContactPhone ]);
  }

  private async insertBeneficiary(beneficiary: Beneficiary): Promise<number> {
    const query_insert_beneficiary = `
        INSERT into actors(first_name, last_name, email, phone, signed_at, extra_fields)
        VALUES($1, $2, $3, $4, $5, JSON_BUILD_OBJECT('emergencyContact', $6::text, 'emergencyContactPhone', $7::text))
        RETURNING id;
      `;
    // prettier-ignore
    const insertReturn = await this.client.query<{id:number}>(query_insert_beneficiary, [ beneficiary.firstName, beneficiary.lastName, beneficiary.email, beneficiary.phone, beneficiary.signedAt, beneficiary.emergencyContact, beneficiary.emergencyContactPhone ]);
    const result = insertReturn.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(insertReturn));
  }

  private async insertEstablishmentTutor(
    establishmentTutor: EstablishmentTutor,
  ): Promise<number> {
    const query_insert_establishment_tutor = `
        INSERT into actors (first_name, last_name, email, phone, extra_fields)
        VALUES($1, $2, $3, $4, JSON_BUILD_OBJECT('job', $5::text))
        RETURNING id;
      `;
    // prettier-ignore
    const insertReturn = await this.client.query<{ id: number }>(query_insert_establishment_tutor,[ establishmentTutor.firstName, establishmentTutor.lastName, establishmentTutor.email, establishmentTutor.phone, establishmentTutor.job, ]);
    const result = insertReturn.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(insertReturn));
  }

  private async insertEstablishmentRepresentative(
    establishmentRepresentative: EstablishmentRepresentative,
  ): Promise<number> {
    const query_insert_establishment_representative = `
        INSERT into actors (first_name, last_name, email, phone, signed_at)
        VALUES($1, $2, $3, $4, $5)
        RETURNING id;
      `;
    // prettier-ignore
    const insertReturn = await this.client.query<{ id: number }>(query_insert_establishment_representative,[ establishmentRepresentative.firstName, establishmentRepresentative.lastName, establishmentRepresentative.email, establishmentRepresentative.phone, establishmentRepresentative.signedAt, ]);
    const result = insertReturn.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(insertReturn));
  }

  private async insertBeneficiaryRepresentative(
    beneficiaryRepresentative: BeneficiaryRepresentative,
  ): Promise<number> {
    const query_insert_beneficiary_representative = `
        INSERT into actors (first_name, last_name, email, phone, signed_at)
        VALUES($1, $2, $3, $4, $5)
        RETURNING id;
      `;
    // prettier-ignore
    const insertReturn = await this.client.query<{ id: number }>( query_insert_beneficiary_representative, [ beneficiaryRepresentative.firstName, beneficiaryRepresentative.lastName, beneficiaryRepresentative.email, beneficiaryRepresentative.phone, beneficiaryRepresentative.signedAt, ]);
    const result = insertReturn.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(insertReturn));
  }
}
const missingReturningRowError = (updateReturn: QueryResult<any>): string =>
  `Missing rows on update return: ${JSON.stringify(updateReturn.rows)}`;
