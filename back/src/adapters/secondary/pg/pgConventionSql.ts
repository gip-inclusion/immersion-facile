import { PoolClient } from "pg";
import {
  ConventionId,
  ConventionReadDto,
} from "shared/src/convention/convention.dto";

export const selectAllConventionDtosById = `
WITH 
  beneficiaries as (SELECT * from signatories where role = 'beneficiary'),
  mentors as (SELECT * from signatories where role = 'establishment'),
  formated_signatories AS (
    SELECT 
    b.convention_id,
    JSON_BUILD_OBJECT(
    'beneficiary' , 
      JSON_BUILD_OBJECT(
          'role', 'beneficiary',
          'firstName', b.first_name,
          'lastName', b.last_name,
          'email', b.email,
          'phone', b.phone,
          'signedAt', date_to_iso(b.signed_at),
          'emergencyContact', b.extra_fields ->> 'emergencyContact',
          'emergencyContactPhone', b.extra_fields ->> 'emergencyContactPhone',
          'federatedIdentity', CASE WHEN  (p.user_pe_external_id IS NOT NULL) THEN CONCAT('peConnect:', p.user_pe_external_id) ELSE NULL END 
          ),
    'mentor' , 
      JSON_BUILD_OBJECT(
        'role', 'establishment',
        'firstName', m.first_name,
        'lastName', m.last_name,
        'email', m.email,
        'phone', m.phone,
        'signedAt', date_to_iso(m.signed_at),
        'job', m.extra_fields ->> 'job'
      ) 
    ) AS signatories
    FROM beneficiaries AS b
    LEFT JOIN mentors as m ON b.convention_id = m.convention_id
    LEFT JOIN partners_pe_connect AS p ON p.convention_id = b.convention_id)

SELECT 
  conventions.id, 
  JSON_STRIP_NULLS(
    JSON_BUILD_OBJECT(
      'id', conventions.id,
      'externalId', external_id::text, 
      'status', conventions.status,
      'dateValidation', date_to_iso(date_validation),
      'dateSubmission', date_to_iso(date_submission),
      'dateStart',  date_to_iso(date_start),
      'dateEnd', date_to_iso(date_end),
      'signatories', signatories,
      'siret', siret, 
      'schedule', schedule,
      'businessName', business_name, 
      'workConditions', work_conditions, 
      'postalCode', postal_code, 
      'agencyId', agency_id, 
      'agencyName', agencies.name,
      'individualProtection', individual_protection,
      'sanitaryPrevention', sanitary_prevention,
      'sanitaryPreventionDescription', sanitary_prevention_description,
      'immersionAddress', immersion_address,
      'immersionObjective', immersion_objective,
      'immersionAppellation', JSON_BUILD_OBJECT(
        'appellationCode', vad.appellation_code::text, 
        'appellationLabel', vad.appellation_label, 
        'romeCode', vad.rome_code,  
        'romeLabel', vad.rome_label
      ),
      'immersionActivities', immersion_activities,
      'immersionSkills', immersion_skills,
      'internshipKind', internship_kind
)) AS dto

FROM 
conventions LEFT JOIN formated_signatories ON formated_signatories.convention_id = conventions.id
LEFT JOIN view_appellations_dto AS vad ON vad.appellation_code = conventions.immersion_appellation
LEFT JOIN convention_external_ids AS cei ON cei.convention_id = conventions.id
LEFT JOIN agencies ON agencies.id = conventions.agency_id
`;

export const getReadConventionById = async (
  client: PoolClient,
  conventionId: ConventionId,
): Promise<ConventionReadDto | undefined> => {
  const pgResult = await client.query(
    `WITH convention_dtos AS (${selectAllConventionDtosById})
     SELECT * FROM convention_dtos WHERE id = $1`,
    [conventionId],
  );

  const pgConvention = pgResult.rows[0];
  if (pgConvention) return pgConvention.dto;
};
