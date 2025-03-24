import type { SelectQueryBuilder } from "kysely";
import { sql } from "kysely";
import {
  type AgencyId,
  type AgencyKind,
  type AgencyRole,
  type AppellationCode,
  type AppellationLabel,
  type Beneficiary,
  type ConventionAgencyFields,
  type ConventionDto,
  type ConventionId,
  type ConventionReadDto,
  type DateString,
  type Email,
  type OmitFromExistingKeys,
  type RomeCode,
  type RomeLabel,
  type ScheduleDto,
  type SiretDto,
  type UserId,
  conventionReadSchema,
  pipeWithValue,
} from "shared";
import {
  type KyselyDb,
  cast,
  jsonBuildObject,
  jsonStripNulls,
} from "../../../config/pg/kysely/kyselyUtils";
import type { Database } from "../../../config/pg/kysely/model/database";
import { createLogger } from "../../../utils/logger";
import { parseZodSchemaAndLogErrorOnParsingFailure } from "../../../utils/schema.utils";

// Common type for the query builder with proper return type
type ConventionQueryBuilderDb = Database & {
  b: Database["actors"];
  er: Database["actors"];
  et: Database["actors"];
  br: Database["actors"] | null;
  bce: Database["actors"] | null;
  p: Database["partners_pe_connect"] | null;
  vad: Database["view_appellations_dto"] | null;
};

type ConventionQueryBuilder = SelectQueryBuilder<
  ConventionQueryBuilderDb,
  keyof ConventionQueryBuilderDb,
  { dto: ConventionDto }
>;

// Function to create the common selection part with proper return type
const createConventionSelection = <
  QB extends SelectQueryBuilder<any, any, any>,
>(
  builder: QB,
): ConventionQueryBuilder => {
  return builder.select(({ ref, ...eb }) =>
    jsonStripNulls(
      jsonBuildObject({
        id: ref("conventions.id"),
        status: ref("conventions.status"),
        dateValidation: sql<DateString>`date_to_iso(conventions.date_validation)`,
        dateApproval: sql<DateString>`date_to_iso(conventions.date_approval)`,
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
            address: eb
              .case()
              .when(sql`b.extra_fields ->> 'address'`, "is not", null)
              .then(
                jsonBuildObject({
                  city: sql`b.extra_fields -> 'address' ->> 'city'`,
                  departmentCode: sql`b.extra_fields -> 'address' ->> 'departmentCode'`,
                  postcode: sql`b.extra_fields -> 'address' ->> 'postcode'`,
                  streetNumberAndAddress: sql`b.extra_fields -> 'address' ->> 'streetNumberAndAddress'`,
                }),
              )
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
          }).$castTo<Beneficiary<"immersion">>(),
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
                job: sql`bce.extra_fields ->> 'job'`.$castTo<string>(),
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
        individualProtection: ref("conventions.individual_protection"),
        individualProtectionDescription: ref(
          "conventions.individual_protection_description",
        ),
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
        establishmentNumberEmployeesRange: ref(
          "conventions.establishment_number_employees",
        ),
        establishmentTutor: jsonBuildObject({
          role: sql<"establishment-tutor">`'establishment-tutor'`,
          firstName: ref("et.first_name"),
          lastName: ref("et.last_name"),
          email: cast<Email>(ref("et.email")),
          phone: cast<string>(ref("et.phone")),
          job: sql`et.extra_fields ->> 'job'`.$castTo<string>(),
        }),
        validators: ref("conventions.validators"),
        renewed: eb
          .case()
          .when("renewed_from", "is not", null)
          .then(
            jsonStripNulls(
              jsonBuildObject({
                from: ref("renewed_from").$castTo<string>(),
                justification: ref("renewed_justification").$castTo<string>(),
              }),
            ),
          )
          .else(null)
          .end(),
      }),
    ).as("dto"),
  );
};

// Function to create the common joins for both query builders
const createCommonJoins = <QB extends SelectQueryBuilder<Database, any, any>>(
  builder: QB,
): QB => {
  return builder
    .innerJoin("actors as b", "b.id", "conventions.beneficiary_id")
    .innerJoin(
      "actors as er",
      "er.id",
      "conventions.establishment_representative_id",
    )
    .innerJoin("actors as et", "et.id", "conventions.establishment_tutor_id")
    .leftJoin(
      "actors as br",
      "br.id",
      "conventions.beneficiary_representative_id",
    )
    .leftJoin(
      "actors as bce",
      "bce.id",
      "conventions.beneficiary_current_employer_id",
    )
    .leftJoin("partners_pe_connect as p", "p.convention_id", "conventions.id")
    .leftJoin(
      "view_appellations_dto as vad",
      "vad.appellation_code",
      "conventions.immersion_appellation",
    )
    .leftJoin("agencies", "agencies.id", "conventions.agency_id") as QB;
};

export const createConventionQueryBuilder = (
  transaction: KyselyDb,
): ConventionQueryBuilder => {
  // biome-ignore format: reads better without formatting
  const builder = transaction
    .selectFrom("conventions");

  const builderWithJoins = createCommonJoins(builder);
  return createConventionSelection(builderWithJoins);
};

export const createConventionQueryBuilderForAgencyUser = ({
  transaction,
  agencyUserId,
}: {
  transaction: KyselyDb;
  agencyUserId: UserId;
}): ConventionQueryBuilder => {
  // biome-ignore format: reads better without formatting
  const builder = transaction
    .selectFrom("users__agencies")
    .innerJoin("conventions", "users__agencies.agency_id", "conventions.agency_id")
    .where("users__agencies.user_id", "=", agencyUserId);

  const builderWithJoins = createCommonJoins(builder);
  return createConventionSelection(builderWithJoins);
};

export const getConventionAgencyFieldsForAgencies = async (
  transaction: KyselyDb,
  agencyIds: AgencyId[],
): Promise<Record<AgencyId, ConventionAgencyFields>> => {
  const withAgencyFields: {
    agencyFields: OmitFromExistingKeys<
      ConventionAgencyFields,
      "agencyCounsellorEmails" | "agencyValidatorEmails"
    > & { agencyId: AgencyId };
  }[] = await transaction
    .selectFrom("agencies")
    .leftJoin(
      "agencies as referred_agencies",
      "agencies.refers_to_agency_id",
      "referred_agencies.id",
    )
    .select(({ ref, ...eb }) =>
      jsonStripNulls(
        jsonBuildObject({
          agencyId: ref("agencies.id"),
          agencyName: ref("agencies.name"),
          agencyKind: ref("agencies.kind").$castTo<AgencyKind>(),
          agencyDepartment: ref("agencies.department_code"),
          agencySiret: ref("agencies.agency_siret"),
          agencyRefersTo: eb
            .case()
            .when("agencies.refers_to_agency_id", "is not", null)
            .then(
              jsonBuildObject({
                id: ref("agencies.refers_to_agency_id").$castTo<AgencyId>(),
                name: ref("referred_agencies.name").$castTo<string>(),
                kind: ref("referred_agencies.kind").$castTo<AgencyKind>(),
              }),
            )
            .else(null)
            .end(),
        }),
      ).as("agencyFields"),
    )
    .where("agencies.id", "in", agencyIds)
    .execute();

  const usersWithAgencyRole = await getUsersWithAgencyRole(transaction, {
    agencyIds,
    isNotifiedByEmail: true,
  });

  return withAgencyFields.reduce(
    (acc, { agencyFields }) => {
      const completeAgencyFields: ConventionAgencyFields = {
        ...agencyFields,
        agencyCounsellorEmails: getEmailsFromUsersWithAgencyRoles(
          usersWithAgencyRole,
          { agencyIdToMatch: agencyFields.agencyId, roleToMatch: "counsellor" },
        ),
        agencyValidatorEmails: getEmailsFromUsersWithAgencyRoles(
          usersWithAgencyRole,
          { agencyIdToMatch: agencyFields.agencyId, roleToMatch: "validator" },
        ),
      };

      return {
        ...acc,
        [agencyFields.agencyId]: completeAgencyFields,
      };
    },
    {} as Record<AgencyId, ConventionAgencyFields>,
  );
};

export const getReadConventionById = async (
  transaction: KyselyDb,
  conventionId: ConventionId,
): Promise<ConventionReadDto | undefined> => {
  const pgConvention = await createConventionQueryBuilder(transaction)
    .where("conventions.id", "=", conventionId)
    .executeTakeFirst();

  if (!pgConvention) return;

  const agencyFieldsByAgencyIds = await getConventionAgencyFieldsForAgencies(
    transaction,
    [pgConvention.dto.agencyId],
  );

  return parseZodSchemaAndLogErrorOnParsingFailure(
    conventionReadSchema,
    {
      ...pgConvention.dto,
      ...agencyFieldsByAgencyIds[pgConvention.dto.agencyId],
    },
    createLogger(__filename),
  );
};

export const makeGetLastConventionWithSiretInList =
  (sirets: [SiretDto, ...SiretDto[]]) =>
  (builder: Awaited<ReturnType<typeof createConventionQueryBuilder>>) =>
    builder
      .select(
        sql<string>`row_number() OVER (PARTITION BY conventions.siret ORDER BY conventions.date_validation DESC)`.as(
          "rn",
        ),
      )
      .where("conventions.status", "=", "ACCEPTED_BY_VALIDATOR")
      .where("conventions.siret", "in", sirets);

type UserWithAgencyRole = {
  userId: UserId;
  email: Email;
  agencyId: AgencyId;
  roles: AgencyRole[];
  isNotifiedByEmail: boolean;
};

const getUsersWithAgencyRole = async (
  transaction: KyselyDb,
  {
    agencyIds,
    isNotifiedByEmail,
  }: {
    agencyIds: AgencyId[];
    isNotifiedByEmail?: boolean;
  },
): Promise<UserWithAgencyRole[]> => {
  if (agencyIds.length === 0) return [];

  return pipeWithValue(
    transaction
      .selectFrom("users__agencies")
      .innerJoin("users", "users.id", "users__agencies.user_id")
      .where("agency_id", "in", agencyIds)
      .orderBy("users.email")
      .select([
        "users.id as userId",
        "users.email",
        sql<AgencyRole[]>`users__agencies.roles`.as("roles"),
        "users__agencies.agency_id as agencyId",
        "users__agencies.is_notified_by_email as isNotifiedByEmail",
      ]),
    (builder) => {
      if (isNotifiedByEmail !== undefined)
        return builder.where("is_notified_by_email", "=", isNotifiedByEmail);
      return builder;
    },
    (builder) => builder.execute(),
  );
};

type AgencyMatchingCriteria = {
  agencyIdToMatch: AgencyId;
  roleToMatch: AgencyRole;
};

const getEmailsFromUsersWithAgencyRoles = (
  usersWithAgencyRole: UserWithAgencyRole[],
  { agencyIdToMatch, roleToMatch }: AgencyMatchingCriteria,
) => {
  return usersWithAgencyRole
    .filter(
      (user) =>
        user.agencyId === agencyIdToMatch && user.roles.includes(roleToMatch),
    )
    .map((user) => user.email);
};
