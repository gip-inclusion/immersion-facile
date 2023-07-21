import { CompiledQuery, Kysely } from "kysely";
import {
  Beneficiary,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionDtoWithoutExternalId,
  ConventionExternalId,
  ConventionId,
  EstablishmentRepresentative,
  EstablishmentTutor,
  InternshipKind,
  isBeneficiaryStudent,
  isEstablishmentTutorIsEstablishmentRepresentative,
} from "shared";
import { ConventionRepository } from "../../../domain/convention/ports/ConventionRepository";
import { ConflictError } from "../../primary/helpers/httpErrors";
import { ImmersionDatabase } from "./sql/database";
import { getReadConventionById } from "./pgConventionSql";

export const beneficiaryCurrentEmployerIdColumnName =
  "beneficiary_current_employer_id";

const beneficiaryRepresentativeIdColumnName = "beneficiary_representative_id";

export class PgConventionRepository implements ConventionRepository {
  constructor(private transaction: Kysely<ImmersionDatabase>) {}

  public async getById(
    conventionId: ConventionId,
  ): Promise<ConventionDto | undefined> {
    const readDto = await getReadConventionById(this.transaction, conventionId);
    if (!readDto) return;
    const { agencyName, agencyDepartment, ...dto } = readDto;
    return dto;
  }

  private async insertConvention({
    convention,
    beneficiaryId,
    establishmentRepresentativeId,
    establishmentTutorId,
    beneficiaryRepresentativeId,
    beneficiaryCurrentEmployerId,
  }: {
    convention: ConventionDtoWithoutExternalId;
    beneficiaryId: number;
    establishmentRepresentativeId: number;
    establishmentTutorId: number;
    beneficiaryRepresentativeId: number | undefined;
    beneficiaryCurrentEmployerId: number | undefined;
  }) {
    const query = `INSERT INTO conventions(
          id, status, agency_id, date_submission, date_start, date_end, date_validation, siret, business_name, schedule, individual_protection,
          sanitary_prevention, sanitary_prevention_description, immersion_address, immersion_objective, immersion_appellation, immersion_activities, immersion_skills, work_conditions, internship_kind, business_advantages,
          beneficiary_id, establishment_tutor_id, establishment_representative_id, beneficiary_representative_id, ${beneficiaryCurrentEmployerIdColumnName}, status_justification
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)`;

    // prettier-ignore
    const {id,status,agencyId,dateSubmission,dateStart,dateEnd,dateValidation,siret,businessName,schedule,individualProtection,sanitaryPrevention,sanitaryPreventionDescription,immersionAddress, immersionObjective,immersionAppellation, immersionActivities, immersionSkills, workConditions, internshipKind,businessAdvantages,statusJustification} = convention
    // prettier-ignore
    const values = [
      id, status, agencyId, dateSubmission, dateStart, dateEnd, dateValidation, siret, businessName, schedule, individualProtection,
      sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective, immersionAppellation.appellationCode, immersionActivities, immersionSkills, workConditions, internshipKind, businessAdvantages,
      beneficiaryId, establishmentTutorId, establishmentRepresentativeId, beneficiaryRepresentativeId, beneficiaryCurrentEmployerId, statusJustification,
    ];

    await this.transaction.executeQuery(CompiledQuery.raw(query, values));
  }

  private async insertConventionForExternalId(conventionId: ConventionId) {
    const query = `
      INSERT INTO convention_external_ids(convention_id) 
      VALUES($1) 
      RETURNING external_id;
    `;
    const values = [conventionId];

    const queryResult = await this.transaction.executeQuery<any>(
      CompiledQuery.raw(query, values),
    );

    return queryResult.rows[0]?.external_id?.toString();
  }

  public async save(
    convention: ConventionDtoWithoutExternalId,
  ): Promise<ConventionExternalId> {
    const alreadyExistingConvention = await this.getById(convention.id);
    if (alreadyExistingConvention)
      throw new ConflictError(
        `Convention with id ${convention.id} already exists`,
      );

    const {
      signatories: {
        beneficiary,
        beneficiaryRepresentative,
        establishmentRepresentative,
        beneficiaryCurrentEmployer,
      },
      id: conventionId,
      establishmentTutor,
    } = convention;

    // Insert signatories and remember their id
    const beneficiaryId = await this.#insertBeneficiary(beneficiary);
    const establishmentTutorId = await this.#insertEstablishmentTutor(
      establishmentTutor,
    );

    const establishmentRepresentativeId =
      isEstablishmentTutorIsEstablishmentRepresentative(convention)
        ? establishmentTutorId
        : await this.#insertEstablishmentRepresentative(
            establishmentRepresentative,
          );

    const beneficiaryRepresentativeId =
      beneficiaryRepresentative &&
      (await this.#insertBeneficiaryRepresentative(beneficiaryRepresentative));

    const beneficiaryCurrentEmployerId =
      beneficiaryCurrentEmployer &&
      (await this.#insertBeneficiaryCurrentEmployer(
        beneficiaryCurrentEmployer,
      ));

    //prettier-ignore
    await this.insertConvention({ convention, beneficiaryId, establishmentRepresentativeId, establishmentTutorId, beneficiaryRepresentativeId, beneficiaryCurrentEmployerId, });

    return this.insertConventionForExternalId(conventionId);
  }

  public async update(
    convention: ConventionDto,
  ): Promise<ConventionId | undefined> {
    // prettier-ignore
    const { signatories: { beneficiary, beneficiaryRepresentative, beneficiaryCurrentEmployer }, id, establishmentTutor } =
      convention

    const establishment_tutor_id = await this.#updateEstablishmentTutor(
      id,
      establishmentTutor,
    );

    const beneficiaryCurrentEmployerId =
      await this.#insertOrUpdateBeneficiaryCurrentEmployerIfExists(
        beneficiaryCurrentEmployer,
        id,
      );

    await this.#updateBeneficiary(id, beneficiary);

    const beneficiaryRepresentativeId =
      await this.#insertOrUpdateBeneficiaryRepresentativeIfExists(
        beneficiaryRepresentative,
        id,
      );

    await this.#updateConvention({
      convention,
      establishmentTutorId: establishment_tutor_id,
      establishmentRepresentativeId:
        await this.#getEstablishmentRepresentativeId({
          convention,
          establishment_tutor_id,
        }),
      beneficiaryCurrentEmployerId,
      beneficiaryRepresentativeId,
    });

    return convention.id;
  }

  async #establishmentTutorAndRepresentativeHaveSameId(
    id: ConventionId,
  ): Promise<boolean> {
    const query = `
        SELECT establishment_tutor_id,establishment_representative_id
        FROM conventions
        WHERE id=$1`;
    const values = [id];

    const queryResult = await this.transaction.executeQuery<{
      establishment_tutor_id: number;
      establishment_representative_id: number;
    }>(CompiledQuery.raw(query, values));

    const result = queryResult.rows.at(0);
    if (result)
      return (
        result.establishment_tutor_id === result.establishment_representative_id
      );
    throw new Error(`No convention with id '${id}'.`);
  }

  async #getBeneficiaryCurrentEmployerId(
    id: ConventionId,
  ): Promise<number | null> {
    const query = `
        SELECT ${beneficiaryCurrentEmployerIdColumnName}
        FROM conventions
        WHERE conventions.id=$1
    `;
    const values = [id];

    const queryResult = await this.transaction.executeQuery<{
      beneficiary_current_employer_id: number | null;
    }>(CompiledQuery.raw(query, values));

    const result = queryResult.rows.at(0);
    if (result) return result.beneficiary_current_employer_id;
    throw new Error(missingReturningRowError(queryResult.rows));
  }

  async #getBeneficiaryRepresentativeId(id: ConventionId) {
    const query = `
        SELECT ${beneficiaryRepresentativeIdColumnName}
        FROM conventions
        WHERE conventions.id=$1
    `;
    const value = [id];

    const queryResult = await this.transaction.executeQuery<{
      beneficiary_representative_id: number | null;
    }>(CompiledQuery.raw(query, value));

    const result = queryResult.rows.at(0);
    if (result) return result.beneficiary_representative_id;
    throw new Error(missingReturningRowError(queryResult.rows));
  }

  async #getEstablishmentRepresentativeId({
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
        ? this.#updateEstablishmentTutor(
            id,
            establishmentTutor,
            establishmentRepresentative.signedAt,
          )
        : establishment_tutor_id;

    if (await this.#establishmentTutorAndRepresentativeHaveSameId(id)) {
      return this.#insertEstablishmentRepresentative(
        establishmentRepresentative,
      );
    }

    return this.#updateEstablishmentRepresentative(
      id,
      establishmentRepresentative,
    );
  }

  async #insertBeneficiary(
    beneficiary: Beneficiary<InternshipKind>,
  ): Promise<number> {
    const query = `
        INSERT into actors(first_name, last_name, email, phone, signed_at, extra_fields)
        VALUES($1, $2, $3, $4, $5, JSON_STRIP_NULLS(JSON_BUILD_OBJECT('emergencyContact', $6::text, 'emergencyContactPhone', $7::text, 'birthdate', $8::text, 'emergencyContactEmail', $9::text, 'levelOfEducation', $10::text, 'financiaryHelp', $11::text, 'isRqth', $12::boolean)))
        RETURNING id;
      `;
    //prettier-ignore
    const { birthdate, email, firstName, lastName, phone, emergencyContact, emergencyContactEmail, emergencyContactPhone, financiaryHelp, isRqth, signedAt, } = beneficiary;
    //prettier-ignore
    const values = [ firstName, lastName, email, phone, signedAt, emergencyContact, emergencyContactPhone, birthdate, emergencyContactEmail, isBeneficiaryStudent(beneficiary) ? beneficiary.levelOfEducation : undefined, financiaryHelp, isRqth, ];

    const queryResult = await this.transaction.executeQuery<{ id: number }>(
      CompiledQuery.raw(query, values),
    );
    const result = queryResult.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(queryResult.rows));
  }

  async #insertBeneficiaryCurrentEmployer({
    businessAddress,
    businessName,
    businessSiret,
    email,
    firstName,
    job,
    lastName,
    phone,
    signedAt,
  }: BeneficiaryCurrentEmployer) {
    const query = `
        INSERT into actors (first_name, last_name, email, phone, signed_at, extra_fields)
        VALUES($1, $2, $3, $4, $5, JSON_STRIP_NULLS(JSON_BUILD_OBJECT('businessName', $6::text,'businessSiret', $7::text,'job', $8::text, 'businessAddress', $9::text)))
        RETURNING id;
      `;
    //prettier-ignore
    const values = [ firstName, lastName, email, phone, signedAt, businessName, businessSiret, job, businessAddress, ];
    const queryResult = await this.transaction.executeQuery<{ id: number }>(
      CompiledQuery.raw(query, values),
    );
    const result = queryResult.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(queryResult.rows));
  }

  async #insertBeneficiaryRepresentative({
    email,
    firstName,
    lastName,
    phone,
    signedAt,
  }: BeneficiaryRepresentative): Promise<number> {
    const query = `
      INSERT into actors (first_name, last_name, email, phone, signed_at)
      VALUES($1, $2, $3, $4, $5)
      RETURNING id;
    `;
    const values = [firstName, lastName, email, phone, signedAt];

    const queryResult = await this.transaction.executeQuery<{ id: number }>(
      CompiledQuery.raw(query, values),
    );
    const result = queryResult.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(queryResult.rows));
  }

  async #insertEstablishmentRepresentative({
    email,
    firstName,
    lastName,
    phone,
    signedAt,
  }: EstablishmentRepresentative): Promise<number> {
    const query = `
        INSERT into actors (first_name, last_name, email, phone, signed_at)
        VALUES($1, $2, $3, $4, $5)
        RETURNING id;
      `;
    const values = [firstName, lastName, email, phone, signedAt];

    const queryResult = await this.transaction.executeQuery<{ id: number }>(
      CompiledQuery.raw(query, values),
    );
    const result = queryResult.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(queryResult.rows));
  }

  async #insertEstablishmentTutor({
    email,
    firstName,
    job,
    lastName,
    phone,
  }: EstablishmentTutor): Promise<number> {
    const query = `
        INSERT into actors (first_name, last_name, email, phone, extra_fields)
        VALUES($1, $2, $3, $4, JSON_STRIP_NULLS(JSON_BUILD_OBJECT('job', $5::text)))
        RETURNING id;
      `;
    // prettier-ignore
    const values = [firstName, lastName, email, phone, job,];

    const queryResult = await this.transaction.executeQuery<{ id: number }>(
      CompiledQuery.raw(query, values),
    );
    const result = queryResult.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(queryResult.rows));
  }

  async #insertOrUpdateBeneficiaryCurrentEmployerIfExists(
    beneficiaryCurrentEmployer: BeneficiaryCurrentEmployer | undefined,
    conventionId: ConventionId,
  ): Promise<number | null> {
    if (!beneficiaryCurrentEmployer) return null;

    const beneficiaryCurrentEmployerIdInDb =
      await this.#getBeneficiaryCurrentEmployerId(conventionId);

    return beneficiaryCurrentEmployerIdInDb === null
      ? this.#insertBeneficiaryCurrentEmployer(beneficiaryCurrentEmployer)
      : this.#updateBeneficiaryCurrentEmployer(
          conventionId,
          beneficiaryCurrentEmployer,
        );
  }

  async #insertOrUpdateBeneficiaryRepresentativeIfExists(
    beneficiaryRepresentative: BeneficiaryRepresentative | undefined,
    conventionId: ConventionId,
  ): Promise<number | null> {
    if (!beneficiaryRepresentative) return null;

    const beneficiaryRepresentativeId =
      await this.#getBeneficiaryRepresentativeId(conventionId);

    return beneficiaryRepresentativeId === null
      ? this.#insertBeneficiaryRepresentative(beneficiaryRepresentative)
      : this.#updateBeneficiaryRepresentative(
          conventionId,
          beneficiaryRepresentative,
        );
  }

  async #updateBeneficiary(
    id: ConventionId,
    beneficiary: Beneficiary<InternshipKind>,
  ) {
    const levelOfEducation = isBeneficiaryStudent(beneficiary)
      ? beneficiary.levelOfEducation
      : undefined;

    const query = `
        UPDATE actors
        SET first_name=$2,  last_name=$3, email=$4, phone=$5, signed_at=$6,
            extra_fields=JSON_STRIP_NULLS(JSON_BUILD_OBJECT('emergencyContact', $7::text,'emergencyContactPhone', $8::text, 'birthdate', $9::text , 'emergencyContactEmail', $10::text,'levelOfEducation', $11::text,'financiaryHelp', $12::text, 'isRqth', $13::boolean))
            FROM conventions
        WHERE conventions.id=$1 AND actors.id = conventions.beneficiary_id
            RETURNING actors.id;`;
    // prettier-ignore
    const {birthdate,email,firstName,lastName,phone,emergencyContact,emergencyContactEmail,emergencyContactPhone,financiaryHelp,isRqth,signedAt} = beneficiary
    //prettier-ignore
    const values = [ id, firstName, lastName, email, phone, signedAt, emergencyContact, emergencyContactPhone, birthdate, emergencyContactEmail, levelOfEducation, financiaryHelp, isRqth, ];

    const queryResult = await this.transaction.executeQuery<{ id: number }>(
      CompiledQuery.raw(query, values),
    );
    const result = queryResult.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(queryResult.rows));
  }

  async #updateBeneficiaryCurrentEmployer(
    id: ConventionId,
    {
      businessAddress,
      businessName,
      businessSiret,
      email,
      firstName,
      job,
      lastName,
      phone,
      signedAt,
    }: BeneficiaryCurrentEmployer,
  ): Promise<number> {
    const query = `  
      UPDATE actors
        SET first_name=$2,  last_name=$3, email=$4, phone=$5, signed_at=$6, extra_fields=JSON_STRIP_NULLS(JSON_BUILD_OBJECT('businessName', $7::text,'businessSiret', $8::text,'job', $9::text, 'businessAddress', $10::text))
      FROM conventions 
      WHERE conventions.id=$1 AND actors.id = conventions.${beneficiaryCurrentEmployerIdColumnName}
      RETURNING actors.id
    `;
    //prettier-ignore
    const values = [ id, firstName, lastName, email, phone, signedAt, businessName, businessSiret, job, businessAddress, ];
    const queryResult = await this.transaction.executeQuery<{ id: number }>(
      CompiledQuery.raw(query, values),
    );
    const result = queryResult.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(queryResult.rows));
  }

  async #updateBeneficiaryRepresentative(
    id: ConventionId,
    { email, firstName, lastName, phone, signedAt }: BeneficiaryRepresentative,
  ) {
    const query = `  
        UPDATE actors
          SET first_name=$2,  last_name=$3, email=$4, phone=$5, signed_at=$6
        FROM conventions 
        WHERE conventions.id=$1 AND actors.id = conventions.beneficiary_representative_id
        RETURNING actors.id`;
    const value = [id, firstName, lastName, email, phone, signedAt];

    const queryResult = await this.transaction.executeQuery<{ id: number }>(
      CompiledQuery.raw(query, value),
    );
    const result = queryResult.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(queryResult.rows));
  }

  async #updateConvention({
    convention,
    establishmentTutorId,
    establishmentRepresentativeId,
    beneficiaryCurrentEmployerId,
    beneficiaryRepresentativeId,
  }: {
    convention: ConventionDto;
    establishmentTutorId: number;
    establishmentRepresentativeId: number;
    beneficiaryCurrentEmployerId: number | null;
    beneficiaryRepresentativeId: number | null;
  }) {
    const query = `  
      UPDATE conventions
        SET status=$2,  
            agency_id=$3, 
            date_submission=$4, date_start=$5, date_end=$6, date_validation=$7, 
            siret=$8,
            business_name=$9, 
            schedule=$10, individual_protection=$11, sanitary_prevention=$12, sanitary_prevention_description=$13, immersion_address=$14,
            immersion_objective=$15, immersion_appellation=$16, immersion_activities=$17, immersion_skills=$18, work_conditions=$19, status_justification=$25,
            updated_at=now(),
            establishment_tutor_id=$20, establishment_representative_id=$21, ${beneficiaryCurrentEmployerIdColumnName}=$22, ${beneficiaryRepresentativeIdColumnName}=$23, business_advantages=$24, validators=$26
      WHERE id=$1`;
    // prettier-ignore
    const {id,status,agencyId,dateSubmission, dateStart, dateEnd, dateValidation,siret, businessName, schedule,individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress,immersionActivities,immersionObjective,immersionAppellation,immersionSkills,workConditions,businessAdvantages,statusJustification, validators } = convention
    // prettier-ignore
    const values = [
      id, status, agencyId, dateSubmission, dateStart,
      dateEnd, dateValidation, siret, businessName, schedule,
      individualProtection, sanitaryPrevention, sanitaryPreventionDescription, immersionAddress, immersionObjective,
      immersionAppellation.appellationCode, immersionActivities, immersionSkills, workConditions, establishmentTutorId,
      establishmentRepresentativeId, beneficiaryCurrentEmployerId, beneficiaryRepresentativeId, businessAdvantages, statusJustification, validators,
    ];

    await this.transaction.executeQuery(CompiledQuery.raw(query, values));
  }

  async #updateEstablishmentRepresentative(
    id: ConventionId,
    {
      email,
      firstName,
      lastName,
      phone,
      signedAt,
    }: EstablishmentRepresentative,
  ): Promise<number> {
    const updateEstablishmentRepresentativeQuery = `  
      UPDATE actors
        SET first_name=$2, last_name=$3, email=$4, phone=$5, signed_at=$6
        FROM conventions 
        WHERE conventions.id=$1 AND actors.id = conventions.establishment_representative_id
        RETURNING actors.id
    `;
    const values = [id, firstName, lastName, email, phone, signedAt];

    const queryResult = await this.transaction.executeQuery<{ id: number }>(
      CompiledQuery.raw(updateEstablishmentRepresentativeQuery, values),
    );
    const result = queryResult.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(queryResult.rows));
  }

  async #updateEstablishmentTutor(
    id: ConventionId,
    { email, firstName, job, lastName, phone }: EstablishmentTutor,
    signedAt?: string,
  ): Promise<number> {
    const query = `  
      UPDATE actors
        SET first_name=$2,  last_name=$3, email=$4, phone=$5, signed_at=$7,
          extra_fields=JSON_STRIP_NULLS(JSON_BUILD_OBJECT('job', $6::text))
        FROM conventions 
        WHERE conventions.id=$1 AND actors.id = conventions.establishment_tutor_id
        RETURNING actors.id
    `;
    const values = [id, firstName, lastName, email, phone, job, signedAt];

    const queryResult = await this.transaction.executeQuery<{ id: number }>(
      CompiledQuery.raw(query, values),
    );
    const result = queryResult.rows.at(0);
    if (result) return result.id;
    throw new Error(missingReturningRowError(queryResult.rows));
  }
}
const missingReturningRowError = (updateReturnRows: any[]): string =>
  `Missing rows on update return: ${JSON.stringify(updateReturnRows)}`;
