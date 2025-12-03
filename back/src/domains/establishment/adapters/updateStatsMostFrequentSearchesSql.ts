import { sql } from "kysely";
import type { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";

export const updateStatsMostFrequentSearchesSql = async (
  trx: KyselyDb,
): Promise<void> => {
  await trx
    .deleteFrom("stats__most_frequent_searches")
    .where("day", "<", sql<Date>`CURRENT_DATE - INTERVAL '1 year'`)
    .execute();

  const lastDayResult = await trx
    .selectFrom("stats__most_frequent_searches")
    .select(({ fn }) => fn.max("day").as("last_day"))
    .executeTakeFirst();

  const startDate =
    lastDayResult?.last_day ?? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  await trx
    .deleteFrom("stats__most_frequent_searches")
    .where("day", ">=", startDate)
    .execute();

  await trx
    .with("aggregated", (qb) =>
      qb
        .selectFrom("searches_made")
        .leftJoin(
          "searches_made__appellation_code as ap",
          "searches_made.id",
          "ap.search_made_id",
        )
        .select([
          sql<Date>`date(update_date)`.as("day"),
          "ap.appellation_code",
          "searches_made.address",
          "searches_made.department_code",
          ({ fn }) => fn.count("searches_made.id").as("count"),
        ])
        .where(
          sql<boolean>`update_date >= ${startDate.toISOString()}::timestamp`,
        )
        .where(sql<boolean>`date(update_date) <= CURRENT_DATE`)
        .where("voluntary_to_immersion", "!=", false)
        .groupBy([
          sql`date(update_date)`,
          "ap.appellation_code",
          "searches_made.address",
          "searches_made.department_code",
        ]),
    )
    .with("ranked", (qb) =>
      qb
        .selectFrom("aggregated")
        .select([
          "day",
          "appellation_code",
          "address",
          "department_code",
          "count",
          sql<number>`ROW_NUMBER() OVER (PARTITION BY day ORDER BY count DESC)`.as(
            "rn",
          ),
        ]),
    )
    .insertInto("stats__most_frequent_searches")
    .columns(["day", "appellation_code", "address", "department_code", "count"])
    .expression((eb) =>
      eb
        .selectFrom("ranked")
        .select([
          "day",
          "appellation_code",
          "address",
          "department_code",
          "count",
        ])
        .where("rn", "<=", 1000),
    )
    .execute();
};
