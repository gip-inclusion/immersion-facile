import { sql } from "kysely";
import { map, partition, toPairs } from "ramda";
import {
  type AbsoluteUrl,
  type AddressDto,
  type AgencyDto,
  type AgencyId,
  type AgencyKind,
  type AgencyRole,
  type AgencyStatus,
  type AgencyUsersRights,
  type AgencyWithUsersRights,
  activeAgencyStatuses,
  ConflictError,
  type DepartmentCode,
  errors,
  isTruthy,
  isWithAgencyRole,
  type OmitFromExistingKeys,
  pipeWithValue,
  type SiretDto,
  type UserId,
  type WithUserFilters,
} from "shared";
import {
  cast,
  jsonBuildObject,
  jsonStripNulls,
  type KyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../utils/logger";
import type {
  AgencyRepository,
  AgencyRightOfUser,
  GetAgenciesFilters,
  PartialAgencyWithUsersRights,
} from "../ports/AgencyRepository";

const logger = createLogger(__filename);

const MAX_AGENCIES_RETURNED = 1500;

export class PgAgencyRepository implements AgencyRepository {
  constructor(private transaction: KyselyDb) {}

  public async insert(agency: AgencyWithUsersRights): Promise<void> {
    await this.insertAgency(agency);
    await this.#saveAgencyRights(agency.id, agency.usersRights);
  }

  private insertAgency(agency: AgencyWithUsersRights) {
    return this.transaction
      .insertInto("agencies")
      .values(({ fn }) => ({
        id: agency.id,
        name: agency.name,
        status: agency.status,
        kind: agency.kind,
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
        phone_number: agency.phoneNumber,
      }))
      .execute()
      .catch((error) => {
        // Detect attempts to re-insert an existing key (error code 23505: unique_violation)
        // See https://www.postgresql.org/docs/10/errcodes-appendix.html
        if (error.code === "23505") {
          logger.error({ error });
          throw errors.agency.alreadyExist(agency.id);
        }
        throw error;
      });
  }

  public async update(agency: PartialAgencyWithUsersRights): Promise<void> {
    await this.transaction
      .updateTable("agencies")
      .set(({ fn }) => ({
        name: agency.name,
        status: agency.status,
        kind: agency.kind,
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
        phone_number: agency.phoneNumber,
      }))
      .where("id", "=", agency.id)
      .execute();

    if (agency.usersRights)
      await this.#saveAgencyRights(agency.id, agency.usersRights);
  }

  public async getById(
    id: AgencyId,
  ): Promise<AgencyWithUsersRights | undefined> {
    const result = await this.#getAgencyWithJsonBuiltQueryBuilder()
      .where("agencies.id", "=", id)
      .executeTakeFirst();

    return this.#pgAgencyToAgencyWithRights(result?.agency);
  }

  public async getBySafirAndActiveStatus(
    safirCode: string,
  ): Promise<AgencyWithUsersRights | undefined> {
    const results = await this.#getAgencyWithJsonBuiltQueryBuilder()
      .where("agencies.code_safir", "=", safirCode)
      .where("agencies.status", "in", activeAgencyStatuses)
      .execute();

    //TODO: On ne fait pas de unique sur le code safir en base
    if (results.length > 1)
      throw new ConflictError(
        safirConflictErrorMessage(
          safirCode,
          results.map(({ agency }) => agency),
        ),
      );

    const result = results.at(0);
    return result && this.#pgAgencyToAgencyWithRights(result.agency);
  }

  public async getByIds(ids: AgencyId[]): Promise<AgencyWithUsersRights[]> {
    if (ids.length === 0) return [];
    const results = await this.#getAgencyWithJsonBuiltQueryBuilder()
      .where("agencies.id", "in", ids)
      .orderBy("agencies.updated_at", "desc")
      .execute();

    const [presentAgencyIds, missingAgencyIds] = partition(
      (id) => results.some((result) => result.agency.id === id),
      ids,
    );

    if (missingAgencyIds.length)
      throw errors.agencies.notFound({ missingAgencyIds, presentAgencyIds });

    return results
      .map(({ agency }) => this.#pgAgencyToAgencyWithRights(agency))
      .filter(isTruthy);
  }

  public async getAgencies({
    filters = {},
    limit,
  }: {
    filters?: GetAgenciesFilters;
    limit?: number;
  }): Promise<AgencyWithUsersRights[]> {
    const {
      departmentCode,
      kinds,
      doesNotReferToOtherAgency,
      nameIncludes,
      position,
      sirets,
      status,
    } = filters;

    const results = await pipeWithValue(
      this.#getAgencyWithJsonBuiltQueryBuilder(),
      (b) =>
        departmentCode
          ? b.where(
              "agencies.covered_departments",
              "@>",
              `["${departmentCode}"]`,
            )
          : b,
      (b) =>
        nameIncludes
          ? b.where("agencies.name", "ilike", `%${nameIncludes}%`)
          : b,
      (b) => (kinds ? b.where("agencies.kind", "in", kinds) : b),
      (b) => (status ? b.where("agencies.status", "in", status) : b),
      (b) =>
        doesNotReferToOtherAgency
          ? b.where("agencies.refers_to_agency_id", "is", null)
          : b,
      (b) =>
        sirets && sirets.length > 0
          ? b.where("agencies.agency_siret", "in", sirets)
          : b,
      (b) =>
        position
          ? b.where(
              ({ fn }) =>
                fn("ST_Distance", [
                  fn("ST_GeographyFromText", [
                    sql`${`POINT(${position.position.lon} ${position.position.lat})`}`,
                  ]),
                  "agencies.position",
                ]),
              "<=",
              position.distance_km * 1000,
            )
          : b,
      (b) =>
        b.limit(
          Math.min(limit ?? MAX_AGENCIES_RETURNED, MAX_AGENCIES_RETURNED),
        ),
    )
      .orderBy("agencies.id asc")
      .execute();

    return results
      .map(({ agency }) => this.#pgAgencyToAgencyWithRights(agency))
      .filter(isTruthy);
  }

  public async getAgenciesRelatedToAgency(
    id: AgencyId,
  ): Promise<AgencyWithUsersRights[]> {
    const results = await this.#getAgencyWithJsonBuiltQueryBuilder()
      .where("agencies.refers_to_agency_id", "=", id)
      .orderBy("agencies.updated_at", "desc")
      .execute()
      .then(map((row) => row.agency));

    return results
      .map((result) => this.#pgAgencyToAgencyWithRights(result))
      .filter(isTruthy);
  }

  public async getImmersionFacileAgencyId(): Promise<AgencyId | undefined> {
    return this.transaction
      .selectFrom("agencies")
      .select("id")
      .where("kind", "=", "immersion-facile")
      .executeTakeFirst()
      .then((row) => row?.id);
  }

  public async getUserIdWithAgencyRightsByFilters(
    filters: WithUserFilters,
  ): Promise<UserId[]> {
    const results = await pipeWithValue(
      this.transaction.selectFrom("users__agencies").select("user_id"),
      (b) =>
        !isWithAgencyRole(filters)
          ? b.where("agency_id", "=", filters.agencyId)
          : b.where("roles", "@>", `["${filters.agencyRole}"]`),
    )
      .orderBy("user_id asc")
      .execute();
    return results.map((result) => result.user_id);
  }

  public async getAgenciesRightsByUserId(
    id: UserId,
  ): Promise<AgencyRightOfUser[]> {
    const results = await this.transaction
      .selectFrom("users__agencies")
      .select(({ ref }) => [
        jsonBuildObject({
          isNotifiedByEmail: ref("is_notified_by_email"),
          roles: ref("roles").$castTo<AgencyRole[]>(),
          agencyId: ref("agency_id"),
        }).as("rights"),
      ])
      .where("user_id", "=", id)
      .orderBy("agency_id asc")
      .execute();

    return results.map(({ rights }) => ({
      agencyId: rights.agencyId,
      roles: rights.roles,
      isNotifiedByEmail: rights.isNotifiedByEmail,
    }));
  }

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
      .where("status", "in", [...activeAgencyStatuses, "needsReview"])
      .where("street_number_and_address", "=", address.streetNumberAndAddress)
      .where("city", "=", address.city)
      .where("id", "!=", idToIgnore)
      .execute();

    return alreadyExistingAgencies.length > 0;
  }

  #getAgencyWithJsonBuiltQueryBuilder() {
    return this.transaction
      .selectFrom("agencies")
      .leftJoin(
        "agencies as refered_agencies",
        "agencies.refers_to_agency_id",
        "refered_agencies.id",
      )
      .leftJoin("users__agencies", "agencies.id", "users__agencies.agency_id")
      .select(({ ref, fn }) => [
        jsonBuildObject({
          id: cast<AgencyId>(ref("agencies.id")),
          name: ref("agencies.name"),
          status: cast<AgencyStatus>(ref("agencies.status")),
          kind: cast<AgencyKind>(ref("agencies.kind")),
          logoUrl: sql<AbsoluteUrl>`${ref("agencies.logo_url")}`,
          position: jsonBuildObject({
            lat: sql<number>`(ST_AsGeoJSON(${ref(
              "agencies.position",
            )})::json->'coordinates'->>1)::numeric`,
            lon: sql<number>`(ST_AsGeoJSON(${ref(
              "agencies.position",
            )})::json->'coordinates'->>0)::numeric`,
          }),
          address: jsonBuildObject({
            streetNumberAndAddress: ref("agencies.street_number_and_address"),
            postcode: ref("agencies.post_code"),
            city: ref("agencies.city"),
            departmentCode: ref("agencies.department_code"),
          }),
          coveredDepartments: cast<DepartmentCode[]>(
            ref("agencies.covered_departments"),
          ),
          agencySiret: ref("agencies.agency_siret"),
          codeSafir: ref("agencies.code_safir"),
          signature: ref("agencies.email_signature"),
          refersToAgencyId: cast<AgencyId>(ref("agencies.refers_to_agency_id")),
          refersToAgencyName: ref("refered_agencies.name"),
          rejectionJustification: ref("agencies.rejection_justification"),
          acquisitionCampaign: ref("agencies.acquisition_campaign"),
          acquisitionKeyword: ref("agencies.acquisition_keyword"),
          phoneNumber: ref("agencies.phone_number"),
          usersRights: fn.coalesce(
            fn
              .jsonAgg(
                jsonStripNulls(
                  jsonBuildObject({
                    userId: ref("users__agencies.user_id"),
                    roles: ref("users__agencies.roles"),
                    isNotifiedByEmail: ref(
                      "users__agencies.is_notified_by_email",
                    ),
                  }),
                ),
              )
              .filterWhere("users__agencies.user_id", "is not", null)
              .$castTo<
                {
                  userId: string;
                  roles: AgencyRole[];
                  isNotifiedByEmail: boolean;
                }[]
              >(),
            sql`'[]'`,
          ),
        }).as("agency"),
      ])
      .groupBy(["agencies.id", "refered_agencies.id"]);
  }

  #pgAgencyToAgencyWithRights(
    result:
      | (OmitFromExistingKeys<
          AgencyDto,
          | "counsellorEmails"
          | "validatorEmails"
          | "acquisitionCampaign"
          | "acquisitionKeyword"
        > & {
          acquisitionCampaign: string | null;
          acquisitionKeyword: string | null;
          usersRights: {
            userId: string;
            roles: AgencyRole[];
            isNotifiedByEmail: boolean;
          }[];
        })
      | undefined,
  ): AgencyWithUsersRights | undefined {
    if (!result) return;
    const { acquisitionCampaign, acquisitionKeyword, usersRights, ...rest } =
      result;

    return {
      ...rest,
      ...(acquisitionCampaign ? { acquisitionCampaign } : {}),
      ...(acquisitionKeyword ? { acquisitionKeyword } : {}),
      usersRights: usersRights.reduce<AgencyUsersRights>(
        (acc, { isNotifiedByEmail, roles, userId }) => ({
          ...acc,
          [userId]: { isNotifiedByEmail, roles },
        }),
        {},
      ),
    } satisfies AgencyWithUsersRights;
  }

  async #saveAgencyRights(
    agencyId: AgencyId,
    agencyUserRights: AgencyUsersRights,
  ): Promise<void> {
    await this.transaction
      .deleteFrom("users__agencies")
      .where("users__agencies.agency_id", "=", agencyId)
      .execute();

    const newRights = toPairs(agencyUserRights)
      .map(([userId, userRights]) =>
        userRights
          ? {
              agency_id: agencyId,
              user_id: userId,
              is_notified_by_email: userRights.isNotifiedByEmail,
              roles: JSON.stringify(userRights.roles),
            }
          : undefined,
      )
      .filter(isTruthy);

    if (!newRights.length) throw errors.agency.noUsers(agencyId);

    await this.transaction
      .insertInto("users__agencies")
      .values(newRights)
      .execute();
  }

  async getExistingActiveSirets(sirets: SiretDto[]): Promise<SiretDto[]> {
    const results = await this.transaction
      .selectFrom("agencies")
      .select("agency_siret")
      .where("agency_siret", "in", sirets)
      .where("status", "in", activeAgencyStatuses)
      .execute();

    return results.map(({ agency_siret }) => agency_siret);
  }
}

export const safirConflictErrorMessage = (
  safirCode: string,
  agencies: Pick<AgencyDto, "id">[],
): any =>
  `Multiple agencies were found with safir code "${safirCode}": ${agencies
    .map(({ id }) => id)
    .sort()
    .join(",")}`;
