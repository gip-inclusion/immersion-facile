import { SelectQueryBuilder } from "kysely";
import { AgencyGroup, CodeSafir, DepartmentCode } from "shared";
import { v4 as uuid } from "uuid";
import {
  KyselyDb,
  cast,
  jsonBuildObject,
} from "../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../utils/logger";
import { AgencyGroupRepository } from "../ports/AgencyGroupRepository";

const logger = createLogger(__filename);

export class PgAgencyGroupRepository implements AgencyGroupRepository {
  #transaction: KyselyDb;

  constructor(transaction: KyselyDb) {
    this.#transaction = transaction;
  }

  async getByCodeSafir(codeSafir: CodeSafir): Promise<AgencyGroup | undefined> {
    const result = await kyselyQueryDevOpsWrapper(
      this.#transaction
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
        .where("ag.code_safir", "=", codeSafir),
    )((builder) => builder.executeTakeFirst());

    const agencyGroupWithId = result?.agencyGroup;
    if (!agencyGroupWithId) return;

    const { id: agencyGroupId, ...agencyGroup } = agencyGroupWithId;

    const agencyIds = await kyselyQueryDevOpsWrapper(
      this.#transaction
        .selectFrom("agency_groups__agencies as aga")
        .select("aga.agency_id")
        .where("aga.agency_group_id", "=", agencyGroupId),
    )((builder) => builder.execute());

    return {
      ...agencyGroup,
      agencyIds: agencyIds.map((id) => id.agency_id),
    };
  }
}

const kyselyQueryDevOpsWrapper =
  <DB, T extends keyof DB, O>(queryBuilder: SelectQueryBuilder<DB, T, O>) =>
  <R>(
    executionCallback: (
      queryBuilder: SelectQueryBuilder<DB, T, O>,
    ) => Promise<R>,
  ) => {
    const queryId = uuid();
    logger.info(`Query ${queryId}`, "start");
    return executionCallback(queryBuilder)
      .then((result) => {
        logger.info(`Query ${queryId}`, "end");
        return result;
      })
      .catch((err) => {
        //Logger et/ou notify discord ???
        logger.error(`Query ${queryId}`, "end", {
          sql: queryBuilder.compile().sql,
          err,
        });
        throw err;
      });
  };
