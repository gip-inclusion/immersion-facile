import { sql } from "kysely";
import {
  AppellationCode,
  AppellationLabel,
  ConventionId,
  ConventionReadDto,
  conventionReadSchema,
  DateString,
  Email,
  parseZodSchemaAndLogErrorOnParsingFailure,
  RomeCode,
  RomeLabel,
  ScheduleDto,
} from "shared";
import { createLogger } from "../../../../utils/logger";
import {
  cast,
  jsonBuildObject,
  jsonStripNulls,
  KyselyDb,
} from "../kysely/kyselyUtils";

export const createConventionReadQueryBuilder = (transaction: KyselyDb) => {
  // prettier-ignore
  const builder = transaction
    .selectFrom("conventions")
    .leftJoin("actors as b", "b.id", "conventions.beneficiary_id")
    .leftJoin("actors as br", "br.id", "conventions.beneficiary_representative_id")
    .leftJoin("actors as bce", "bce.id", "conventions.beneficiary_current_employer_id")
    .leftJoin("actors as er", "er.id", "conventions.establishment_representative_id")
    .leftJoin("actors as et", "et.id", "conventions.establishment_tutor_id")
    .leftJoin("partners_pe_connect as p", "p.convention_id", "conventions.id")
    .leftJoin("view_appellations_dto as vad", "vad.appellation_code", "conventions.immersion_appellation")
    .leftJoin("agencies", "agencies.id", "conventions.agency_id")
    .leftJoin("agencies as referring_agencies", "agencies.refers_to_agency_id", "referring_agencies.id")

  return builder.select(({ ref, ...eb }) =>
    jsonStripNulls(
      jsonBuildObject({
        id: ref("conventions.id"),
        status: ref("conventions.status"),
        dateValidation: sql<DateString>`date_to_iso(conventions.date_validation)`,
        reviewDate: sql<DateString>`date_to_iso(conventions.review_date)`,
        dateSubmission: sql<DateString>`date_to_iso(conventions.date_submission)`,
        dateStart: sql<DateString>`date_to_iso(conventions.date_start)`,
        dateEnd: sql<DateString>`date_to_iso(conventions.date_end)`,
        signatories: jsonBuildObject({
          beneficiary: jsonBuildObject({
            role: sql`'beneficiary'`,
            firstName: ref("b.first_name"),
            lastName: ref("b.last_name"),
            email: ref("b.email"),
            phone: ref("b.phone"),
            signedAt: sql`date_to_iso(b.signed_at)`,
            isRqth: eb
              .case()
              .when(sql`b.extra_fields ->> 'isRqth'`, "is not", null)
              .then(sql`(b.extra_fields ->> 'isRqth')::boolean`)
              .else(null)
              .end(),
            emergencyContact: sql`b.extra_fields ->> 'emergencyContact'`,
            emergencyContactPhone: sql`b.extra_fields ->> 'emergencyContactPhone'`,
            emergencyContactEmail: sql`b.extra_fields ->> 'emergencyContactEmail'`,
            federatedIdentity: eb
              .case()
              .when("p.user_pe_external_id", "is not", null)
              .then(
                jsonBuildObject({
                  provider: sql`'peConnect'`,
                  token: ref("p.user_pe_external_id"),
                  payload: eb
                    .case()
                    .when("p.email", "is not", null)
                    .then(
                      jsonBuildObject({
                        advisor: jsonBuildObject({
                          email: ref("p.email"),
                          firstName: ref("p.firstname"),
                          lastName: ref("p.lastname"),
                          type: ref("p.type"),
                        }),
                      }),
                    )
                    .else(null)
                    .end(),
                }),
              )
              .else(null)
              .end(),
            levelOfEducation: eb
              .case()
              .when(sql`b.extra_fields ->> 'levelOfEducation'`, "is not", null)
              .then(sql`b.extra_fields ->> 'levelOfEducation'`)
              .else(null)
              .end(),
            financiaryHelp: eb
              .case()
              .when(sql`b.extra_fields ->> 'financiaryHelp'`, "is not", null)
              .then(sql`b.extra_fields ->> 'financiaryHelp'`)
              .else(null)
              .end(),
            birthdate: eb
              .case()
              .when(sql`b.extra_fields ->> 'birthdate'`, "is not", null)
              .then(sql`b.extra_fields ->> 'birthdate'`)
              .else(sql`'1970-01-01T12:00:00.000Z'`)
              .end(),
            schoolName: eb
              .case()
              .when(sql`b.extra_fields ->> 'schoolName'`, "is not", null)
              .then(sql`b.extra_fields ->> 'schoolName'`)
              .else(null)
              .end(),
            schoolPostcode: eb
              .case()
              .when(sql`b.extra_fields ->> 'schoolPostcode'`, "is not", null)
              .then(sql`b.extra_fields ->> 'schoolPostcode'`)
              .else(null)
              .end(),
          }),
          beneficiaryCurrentEmployer: eb
            .case()
            .when("bce.id", "is", null)
            .then(null)
            .else(
              jsonBuildObject({
                role: sql`'beneficiary-current-employer'`,
                firstName: ref("bce.first_name"),
                lastName: ref("bce.last_name"),
                email: ref("bce.email"),
                phone: ref("bce.phone"),
                job: sql`bce.extra_fields ->> 'job'`,
                businessSiret: sql`bce.extra_fields ->> 'businessSiret'`,
                businessName: sql`bce.extra_fields ->> 'businessName'`,
                signedAt: sql`date_to_iso(bce.signed_at)`,
                businessAddress: sql`bce.extra_fields ->> 'businessAddress'`,
              }),
            )
            .end(),
          establishmentRepresentative: jsonBuildObject({
            role: sql`'establishment-representative'`,
            firstName: ref("er.first_name"),
            lastName: ref("er.last_name"),
            email: ref("er.email"),
            phone: ref("er.phone"),
            signedAt: sql`date_to_iso(er.signed_at)`,
          }),
          beneficiaryRepresentative: eb
            .case()
            .when("br.id", "is", null)
            .then(null)
            .else(
              jsonBuildObject({
                role: sql`'beneficiary-representative'`,
                firstName: ref("br.first_name"),
                lastName: ref("br.last_name"),
                email: ref("br.email"),
                phone: ref("br.phone"),
                signedAt: sql`date_to_iso(br.signed_at)`,
              }),
            )
            .end(),
        }),
        siret: ref("conventions.siret"),
        schedule: cast<ScheduleDto>(ref("conventions.schedule")),
        businessName: ref("conventions.business_name"),
        workConditions: ref("conventions.work_conditions"),
        agencyId: ref("conventions.agency_id"),
        agencyName: ref("agencies.name"),
        agencyKind: ref("agencies.kind"),
        agencyDepartment: ref("agencies.department_code"),
        agencySiret: ref("agencies.agency_siret"),
        agencyRefersTo: eb
          .case()
          .when("agencies.refers_to_agency_id", "is not", null)
          .then(
            jsonBuildObject({
              id: ref("agencies.refers_to_agency_id"),
              name: ref("referring_agencies.name"),
            }),
          )
          .else(null)
          .end(),
        individualProtection: ref("conventions.individual_protection"),
        sanitaryPrevention: ref("conventions.sanitary_prevention"),
        sanitaryPreventionDescription: ref(
          "conventions.sanitary_prevention_description",
        ),
        immersionAddress: ref("conventions.immersion_address"),
        immersionObjective: ref("conventions.immersion_objective"),
        immersionAppellation: jsonBuildObject({
          appellationCode: sql<AppellationCode>`vad.appellation_code::text`,
          appellationLabel: cast<AppellationLabel>(
            ref("vad.appellation_label"),
          ),
          romeCode: cast<RomeCode>(ref("vad.rome_code")),
          romeLabel: cast<RomeLabel>(ref("vad.rome_label")),
        }),
        immersionActivities: ref("conventions.immersion_activities"),
        immersionSkills: ref("conventions.immersion_skills"),
        internshipKind: ref("conventions.internship_kind"),
        businessAdvantages: ref("conventions.business_advantages"),
        statusJustification: ref("conventions.status_justification"),
        establishmentTutor: jsonBuildObject({
          role: sql<"establishment-tutor">`'establishment-tutor'`,
          firstName: ref("et.first_name"),
          lastName: ref("et.last_name"),
          email: cast<Email>(ref("et.email")),
          phone: cast<string>(ref("et.phone")),
          job: sql`et.extra_fields ->> 'job'`,
        }),
        validators: ref("conventions.validators"),
        renewed: eb
          .case()
          .when("renewed_from", "is not", null)
          .then(
            jsonBuildObject({
              from: ref("renewed_from"),
              justification: ref("renewed_justification"),
            }),
          )
          .else(null)
          .end(),
      }),
    ).as("dto"),
  );
};

export const getReadConventionById = async (
  transaction: KyselyDb,
  conventionId: ConventionId,
): Promise<ConventionReadDto | undefined> => {
  const pgConvention = await createConventionReadQueryBuilder(transaction)
    .where("conventions.id", "=", conventionId)
    .executeTakeFirst();
  return (
    pgConvention &&
    parseZodSchemaAndLogErrorOnParsingFailure(
      conventionReadSchema,
      pgConvention.dto,
      createLogger(__filename),
      {},
    )
  );
};
