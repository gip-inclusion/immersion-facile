import { AgencyGroup, CodeSafir, DepartmentCode } from "shared";
import { AgencyGroupRepository } from "../../../../domains/convention/ports/AgencyGroupRepository";
import { KyselyDb, cast, jsonBuildObject } from "../kysely/kyselyUtils";

export class PgAgencyGroupRepository implements AgencyGroupRepository {
  #transaction: KyselyDb;

  constructor(transaction: KyselyDb) {
    this.#transaction = transaction;
  }

  async getByCodeSafir(codeSafir: CodeSafir): Promise<AgencyGroup | undefined> {
    const result = await this.#transaction
      .selectFrom("agency_groups as ag")
      .select((qb) =>
        jsonBuildObject({
          id: qb.ref("ag.id"),
          siret: qb.ref("ag.siret"),
          codeSafir: qb.ref("ag.code_safir"),
          name: qb.ref("ag.name"),
          email: qb.ref("ag.email"),
          kind: qb.ref("ag.kind"),
          scope: qb.ref("ag.scope"),
          departments: cast<DepartmentCode[]>(qb.ref("ag.departments")),
          ccEmails: cast<string[] | null>(qb.ref("ag.cc_emails")),
        }).as("agencyGroup"),
      )
      .where("ag.code_safir", "=", codeSafir)
      .executeTakeFirst();

    const agencyGroupWithId = result?.agencyGroup;
    if (!agencyGroupWithId) return;

    const { id: agencyGroupId, ...agencyGroup } = agencyGroupWithId;

    const agencyIds = await this.#transaction
      .selectFrom("agency_groups__agencies as aga")
      .select("aga.agency_id")
      .where("aga.agency_group_id", "=", agencyGroupId)
      .execute();

    return {
      ...agencyGroup,
      agencyIds: agencyIds.map((id) => id.agency_id),
    };
  }
}
