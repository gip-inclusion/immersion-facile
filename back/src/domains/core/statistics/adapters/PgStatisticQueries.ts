import { DataWithPagination, PaginationQueryParams } from "shared";
import type { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { StatisticQueries } from "../ports/StatisticQueries";
import { EstablishmentStat } from "../use-cases/GetEstablishmentStats";

export class PgStatisticQueries implements StatisticQueries {
  #transaction: KyselyDb;
  constructor(transaction: KyselyDb) {
    this.#transaction = transaction;
  }

  public async getEstablishmentStats({
    page,
    perPage,
  }: Required<PaginationQueryParams>): Promise<
    DataWithPagination<EstablishmentStat>
  > {
    const { totalRecords } = (await this.#transaction
      .selectFrom("conventions")
      .groupBy("siret")
      .select(({ fn }) => fn.count<string>("siret").over().as("totalRecords"))
      .executeTakeFirst()) ?? { totalRecords: 0 };

    const establishmentStats = await this.#transaction
      .selectFrom("conventions as c")
      .leftJoin("establishments as e", "c.siret", "e.siret")
      .groupBy(["c.siret", "c.business_name", "e.siret"])
      .orderBy("siret")
      .select((qb) => [
        "c.siret as siret",
        "c.business_name as name",
        qb.fn.count<number>("c.siret").as("numberOfConventions"),
        qb
          .case()
          .when("e.siret", "is", null)
          .then(false)
          .else(true)
          .end()
          .as("isReferenced"),
      ])
      .limit(perPage)
      .offset((page - 1) * perPage)
      .execute();

    return {
      data: establishmentStats,
      pagination: {
        totalRecords: +totalRecords,
        totalPages: Math.ceil(Math.max(+totalRecords, 1) / perPage),
        numberPerPage: perPage,
        currentPage: page,
      },
    };
  }
}
