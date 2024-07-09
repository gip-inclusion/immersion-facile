import { sql } from "kysely";
import { map } from "ramda";
import {
  AbsoluteUrl,
  AddressDto,
  AgencyDto,
  AgencyId,
  AgencyKind,
  AgencyRole,
  AgencyStatus,
  DepartmentCode,
  Email,
  GeoPositionDto,
  GetAgenciesFilter,
  PartialAgencyDto,
  agencySchema,
  errorMessages,
  pipeWithValue,
} from "shared";
import { z } from "zod";
import {
  ConflictError,
  NotFoundError,
  validateAndParseZodSchema,
} from "../../../config/helpers/httpErrors";
import {
  KyselyDb,
  cast,
  jsonBuildObject,
} from "../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../utils/logger";
import {
  AgencyWithoutEmails,
  addEmailsToAgency,
  getUsersWithAgencyRole,
  usersAgenciesRolesIncludeCounsellor,
  usersAgenciesRolesIncludeValidator,
} from "../../core/authentication/inclusion-connect/adapters/agencyUsers.helpers";
import { AgencyRepository } from "../ports/AgencyRepository";

const logger = createLogger(__filename);

const MAX_AGENCIES_RETURNED = 200;

export class PgAgencyRepository implements AgencyRepository {
  constructor(private transaction: KyselyDb) {}

  public async alreadyHasActiveAgencyWithSameAddressAndKind({
    idToIgnore,
    kind,
    address,
  }: {
    idToIgnore: AgencyId;
    kind: AgencyKind;
    address: AddressDto;
  }) {
    const alreadyExistingAgencies = await this.transaction
      .selectFrom("agencies")
      .selectAll()
      .where("kind", "=", kind)
      .where("status", "!=", "rejected")
      .where("street_number_and_address", "=", address.streetNumberAndAddress)
      .where("city", "=", address.city)
      .where("id", "!=", idToIgnore)
      .execute();

    return alreadyExistingAgencies.length > 0;
  }

  public async getAgencies({
    filters = {},
    limit,
  }: {
    filters?: GetAgenciesFilter;
    limit?: number;
  }): Promise<AgencyDto[]> {
    const { departmentCode, kind, nameIncludes, position, siret, status } =
      filters;
    const results = await pipeWithValue(
      this.transaction
        .selectFrom("agencies")
        .selectAll()
        .select((eb) => eb.fn("ST_AsGeoJSON", ["position"]).as("position")),
      (b) =>
        departmentCode
          ? b.where("covered_departments", "@>", `["${departmentCode}"]`)
          : b,
      (b) => (nameIncludes ? b.where("name", "ilike", `%${nameIncludes}%`) : b),
      (b) => {
        if (kind === "immersionPeOnly")
          return b.where("kind", "=", "pole-emploi");
        if (kind === "immersionWithoutPe")
          return b
            .where("kind", "!=", "pole-emploi")
            .where("kind", "!=", "cci");
        if (kind === "miniStageOnly") return b.where("kind", "=", "cci");
        if (kind === "miniStageExcluded") return b.where("kind", "!=", "cci");
        if (kind === "withoutRefersToAgency")
          return b.where("refers_to_agency_id", "is", null);
        return b;
      },
      (b) => (status ? b.where("status", "in", status) : b),
      (b) => (siret ? b.where("agency_siret", "=", siret) : b),
      (b) =>
        b.limit(
          Math.min(limit ?? MAX_AGENCIES_RETURNED, MAX_AGENCIES_RETURNED),
        ),
      (b) =>
        position
          ? b
              .select(({ fn }) =>
                fn("ST_Distance", [
                  fn("ST_GeographyFromText", [
                    sql`${`POINT(${position.position.lon} ${position.position.lat})`}`,
                  ]),
                  "position",
                ]).as("distance-km"),
              )
              .where(
                ({ fn }) =>
                  fn("ST_Distance", [
                    fn("ST_GeographyFromText", [
                      sql`${`POINT(${position.position.lon} ${position.position.lat})`}`,
                    ]),
                    "position",
                  ]),
                "<=",
                position.distance_km * 1000,
              )
              .orderBy(["distance-km", "agencies.position"])
          : b,
    ).execute();

    const agenciesWithoutEmails: AgencyWithoutEmails[] = results.map(
      (result) => ({
        coveredDepartments: result.covered_departments as DepartmentCode[],
        address: {
          city: result.city,
          departmentCode: result.department_code,
          postcode: result.post_code,
          streetNumberAndAddress: result.street_number_and_address,
        },
        agencySiret: result.agency_siret,
        codeSafir: result.code_safir,
        id: result.id,
        kind: result.kind as AgencyKind,
        logoUrl: result.questionnaire_url
          ? (result.logo_url as AbsoluteUrl)
          : null,
        name: result.name,
        position: parseGeoJson(result.position),
        questionnaireUrl: result.questionnaire_url
          ? (result.questionnaire_url as AbsoluteUrl)
          : null,
        signature: result.email_signature,
        status: result.status as AgencyStatus,
        rejectionJustification: result.rejection_justification,
        refersToAgencyId: result.refers_to_agency_id,
      }),
    );

    const agencies = await this.#addEmailsToAgencies(agenciesWithoutEmails);

    return validateAndParseZodSchema(z.array(agencySchema), agencies, logger);
  }

  public async getAgenciesRelatedToAgency(id: AgencyId): Promise<AgencyDto[]> {
    const agenciesWithoutEmails =
      await this.#getAgencyWithJsonBuiltQueryBuilder()
        .where("a.refers_to_agency_id", "=", id)
        .orderBy("a.updated_at", "desc")
        .execute()
        .then(map((row) => row.agency));

    return this.#addEmailsToAgencies(agenciesWithoutEmails);
  }

  public async getById(id: AgencyId): Promise<AgencyDto | undefined> {
    const agencyWithoutEmails = await this.#getAgencyWithJsonBuiltQueryBuilder()
      .where("a.id", "=", id)
      .executeTakeFirst()
      .then((row) => row?.agency);

    if (!agencyWithoutEmails) return;

    return this.#addEmailsToAgency(agencyWithoutEmails);
  }

  public async getByIds(ids: AgencyId[]): Promise<AgencyDto[]> {
    if (ids.length === 0) return [];
    const agenciesWithoutEmails =
      await this.#getAgencyWithJsonBuiltQueryBuilder()
        .where("a.id", "in", ids)
        .orderBy("a.updated_at", "desc")
        .execute()
        .then(map((row) => row.agency));
    const missingIds = ids.filter(
      (id) => !agenciesWithoutEmails.some((agency) => agency.id === id),
    );

    if (missingIds.length)
      throw new NotFoundError(
        errorMessages.agencies.notFound({ agencyIds: missingIds }),
      );

    return this.#addEmailsToAgencies(agenciesWithoutEmails);
  }

  public async getBySafir(safirCode: string): Promise<AgencyDto | undefined> {
    const agenciesWithoutEmails =
      await this.#getAgencyWithJsonBuiltQueryBuilder()
        .where("a.code_safir", "=", safirCode)
        .execute()
        .then(map((row) => row.agency));

    if (!agenciesWithoutEmails.length) return;

    if (agenciesWithoutEmails.length > 1)
      throw new ConflictError(
        safirConflictErrorMessage(safirCode, agenciesWithoutEmails),
      );

    return this.#addEmailsToAgency(agenciesWithoutEmails[0]);
  }

  public async getImmersionFacileAgencyId(): Promise<AgencyId | undefined> {
    return this.transaction
      .selectFrom("agencies")
      .select("id")
      .where("kind", "=", "immersion-facile")
      .executeTakeFirst()
      .then((row) => row?.id);
  }

  public async insert(agency: AgencyDto): Promise<AgencyId | undefined> {
    try {
      await this.transaction
        .insertInto("agencies")
        .values(({ fn }) => ({
          id: agency.id,
          name: agency.name,
          status: agency.status,
          kind: agency.kind,
          questionnaire_url: agency.questionnaireUrl,
          email_signature: agency.signature,
          logo_url: agency.logoUrl,
          position: fn("ST_MakePoint", [
            sql`${agency.position.lon}, ${agency.position.lat}`,
          ]),
          agency_siret: agency.agencySiret,
          code_safir: agency.codeSafir,
          street_number_and_address: agency.address.streetNumberAndAddress,
          post_code: agency.address.postcode,
          city: agency.address.city,
          department_code: agency.address.departmentCode,
          covered_departments: JSON.stringify(agency.coveredDepartments),
          refers_to_agency_id: agency.refersToAgencyId,
          acquisition_campaign: agency.acquisitionCampaign,
          acquisition_keyword: agency.acquisitionKeyword,
        }))
        .execute();

      await Promise.all(
        agency.validatorEmails.map(async (email) =>
          this.#addUserAndAgencyRights(
            email,
            agency.id,
            agency.counsellorEmails.includes(email)
              ? ["counsellor", "validator"]
              : ["validator"],
          ),
        ),
      );

      await Promise.all(
        agency.counsellorEmails.map(async (email) =>
          this.#addUserAndAgencyRights(email, agency.id, ["counsellor"]),
        ),
      );
    } catch (error: any) {
      // Detect attempts to re-insert an existing key (error code 23505: unique_violation)
      // See https://www.postgresql.org/docs/10/errcodes-appendix.html
      if (error.code === "23505") {
        logger.error({ error });
        return undefined;
      }
      throw error;
    }

    return agency.id;
  }

  public async update(agency: PartialAgencyDto): Promise<void> {
    await this.transaction
      .updateTable("agencies")
      .set(({ fn }) => ({
        name: agency.name,
        status: agency.status,
        kind: agency.kind,
        questionnaire_url: agency.questionnaireUrl,
        email_signature: agency.signature,
        logo_url: agency.logoUrl,
        position: agency.position
          ? fn("ST_MakePoint", [
              sql`${agency.position.lon}, ${agency.position.lat}`,
            ])
          : undefined,
        agency_siret: agency.agencySiret,
        code_safir: agency.codeSafir,
        street_number_and_address: agency.address?.streetNumberAndAddress,
        post_code: agency.address?.postcode,
        city: agency.address?.city,
        department_code: agency.address?.departmentCode,
        covered_departments:
          agency.coveredDepartments &&
          JSON.stringify(agency.coveredDepartments),
        refers_to_agency_id: agency.refersToAgencyId,
        updated_at: sql`NOW()`,
        rejection_justification: agency.rejectionJustification,
      }))
      .where("id", "=", agency.id)
      .execute();

    if (agency.validatorEmails) {
      await this.transaction
        .deleteFrom("users__agencies")
        .where(usersAgenciesRolesIncludeValidator)
        .where("is_notified_by_email", "=", true)
        .where("agency_id", "=", agency.id)
        .execute();

      await Promise.all(
        agency.validatorEmails.map(async (email) =>
          this.#addUserAndAgencyRights(
            email,
            agency.id,
            agency.counsellorEmails?.includes(email)
              ? ["counsellor", "validator"]
              : ["validator"],
          ),
        ),
      );
    }

    if (agency.counsellorEmails) {
      await this.transaction
        .deleteFrom("users__agencies")
        .where(usersAgenciesRolesIncludeCounsellor)
        .where("is_notified_by_email", "=", true)
        .where("agency_id", "=", agency.id)
        .execute();

      await Promise.all(
        agency.counsellorEmails.map(async (email) =>
          this.#addUserAndAgencyRights(email, agency.id, ["counsellor"]),
        ),
      );
    }
  }

  async #addUserAndAgencyRights(
    email: Email,
    agencyId: AgencyId,
    roles: AgencyRole[],
  ) {
    const result = await this.transaction
      .insertInto("users")
      .values({
        id: sql`uuid_generate_v4()`,
        email,
        first_name: "",
        last_name: "",
        external_id: null,
      })
      .onConflict((oc) => oc.doNothing())
      .returning("id as userId")
      .executeTakeFirst();

    const userId = result
      ? result.userId
      : await this.transaction
          .selectFrom("users")
          .select("id")
          .where("email", "=", email)
          .executeTakeFirst()
          .then((row) => row?.id);

    if (!userId) throw new Error(`User with ${email} not created`);

    await this.transaction
      .insertInto("users__agencies")
      .values({
        user_id: userId,
        agency_id: agencyId,
        roles: JSON.stringify(roles),
        is_notified_by_email: true,
      })
      .onConflict((oc) =>
        oc
          .columns(["user_id", "agency_id"])
          .doUpdateSet({ is_notified_by_email: true }),
      )
      .execute();
  }

  async #addEmailsToAgency(
    agencyWithoutEmail: AgencyWithoutEmails,
  ): Promise<AgencyDto> {
    const userRows = await getUsersWithAgencyRole(this.transaction, {
      agencyIds: [agencyWithoutEmail.id],
      isNotifiedByEmail: true,
    });

    return addEmailsToAgency(userRows)(agencyWithoutEmail);
  }

  async #addEmailsToAgencies(
    agenciesWithoutEmails: AgencyWithoutEmails[],
  ): Promise<AgencyDto[]> {
    if (!agenciesWithoutEmails.length) return [];
    const userRows = await getUsersWithAgencyRole(this.transaction, {
      agencyIds: agenciesWithoutEmails.map(({ id }) => id),
      isNotifiedByEmail: true,
    });

    return agenciesWithoutEmails.map(addEmailsToAgency(userRows));
  }

  #getAgencyWithJsonBuiltQueryBuilder = () =>
    this.transaction.selectFrom("agencies as a").select(({ ref }) => [
      jsonBuildObject({
        id: cast<AgencyId>(ref("a.id")),
        name: ref("a.name"),
        status: cast<AgencyStatus>(ref("a.status")),
        kind: cast<AgencyKind>(ref("a.kind")),
        questionnaireUrl: sql<AbsoluteUrl>`${ref("a.questionnaire_url")}`,
        logoUrl: sql<AbsoluteUrl>`${ref("a.logo_url")}`,
        position: jsonBuildObject({
          lat: sql<number>`(ST_AsGeoJSON(${ref(
            "a.position",
          )})::json->'coordinates'->>1)::numeric`,
          lon: sql<number>`(ST_AsGeoJSON(${ref(
            "a.position",
          )})::json->'coordinates'->>0)::numeric`,
        }),
        address: jsonBuildObject({
          streetNumberAndAddress: ref("a.street_number_and_address"),
          postcode: ref("a.post_code"),
          city: ref("a.city"),
          departmentCode: ref("a.department_code"),
        }),
        coveredDepartments: cast<DepartmentCode[]>(
          ref("a.covered_departments"),
        ),
        agencySiret: ref("a.agency_siret"),
        codeSafir: ref("a.code_safir"),
        signature: ref("a.email_signature"),
        refersToAgencyId: cast<AgencyId>(ref("a.refers_to_agency_id")),
        rejectionJustification: ref("a.rejection_justification"),
      }).as("agency"),
    ]);
}

const parseGeoJson = (raw: string): GeoPositionDto => {
  const json = JSON.parse(raw);
  return {
    lat: json.coordinates[1],
    lon: json.coordinates[0],
  };
};
export const safirConflictErrorMessage = (
  safirCode: string,
  agencies: Pick<AgencyDto, "id">[],
): any =>
  `Multiple agencies were found with safir code "${safirCode}": ${agencies
    .map(({ id }) => id)
    .sort()
    .join(",")}`;
