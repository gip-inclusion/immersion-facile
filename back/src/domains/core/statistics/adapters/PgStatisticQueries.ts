import { sql } from "kysely";
import { DataWithPagination, PaginationQueryParams, errors } from "shared";
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
    const builder = this.#transaction
      .selectFrom("conventions as c")
      .fullJoin("establishments as e", "c.siret", "e.siret");

    const { totalRecords } = (await builder
      .groupBy((qb) => qb.fn.coalesce("c.siret", "e.siret"))
      .select([
        sql<number>`CAST
        (count(coalesce (c.siret, e.siret)) over () AS INTEGER)`.as(
          "totalRecords",
        ),
      ])
      .limit(1)
      .executeTakeFirst()) ?? { totalRecords: 0 };

    const totalPages = Math.ceil(Math.max(totalRecords, 1) / perPage);

    if (page > totalPages) {
      throw errors.establishment.badPagination({ page, totalPages, perPage });
    }

    const establishmentStats = await builder
      .groupBy(["c.siret", "c.business_name", "e.siret"])
      .orderBy("siret")
      .select((qb) => [
        qb.fn.coalesce("c.siret", "e.siret").$castTo<string>().as("siret"),
        qb.fn
          .coalesce("e.name", "c.business_name")
          .$castTo<string>()
          .as("name"),
        sql<number>`CAST
            (count(c.siret) AS INTEGER)`.as("numberOfConventions"),
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
        totalRecords,
        totalPages,
        numberPerPage: perPage,
        currentPage: page,
      },
    };
  }
}
