import { sql } from "kysely";
import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";

export const updateAllEstablishmentScoresQuery = async (
  db: KyselyDb,
): Promise<void> => {
  const minimumScore = 10;
  const conventionCountCoefficient = 20;

  await db
    .with("convention_counts", (qb) =>
      qb
        .selectFrom("conventions")
        .where("date_submission", ">=", sql<Date>`NOW() - INTERVAL '1 year'`)
        .where("status", "=", "ACCEPTED_BY_VALIDATOR")
        .groupBy("siret")
        .select([
          "siret",
          ({ fn }) => fn.count("siret").as("convention_count"),
        ]),
    )
    .with("discussion_counts", (qb) =>
      qb
        .selectFrom("discussions as d")
        .innerJoin("exchanges", "d.id", "exchanges.discussion_id")
        .where("d.created_at", ">=", sql<Date>`NOW() - INTERVAL '1 year'`)
        .select([
          "siret",
          sql`COUNT
              (DISTINCT d.id)`.as("total_discussions"),
          sql`COUNT
          (DISTINCT CASE WHEN exchanges.sender = 'establishment'::exchange_role THEN d.id END)`.as(
            "answered_discussions",
          ),
        ])
        .groupBy("siret"),
    )
    .updateTable("establishments as e")
    .set({
      score: sql`ROUND
      (
          (${minimumScore} + COALESCE ((SELECT convention_count * ${conventionCountCoefficient} FROM convention_counts WHERE siret = e.siret), 0)) * (COALESCE ((
              SELECT
              CASE
              WHEN total_discussions > 0
              THEN (answered_discussions::float / total_discussions)
              ELSE 1
              END
              FROM discussion_counts
              WHERE siret = e.siret
              ), 1)))`,
    })
    .execute();
};

export const deactivateUnresponsiveEstablishmentsQuery = (db: KyselyDb) =>
  db
    .with("establishment_discussions", (qb) =>
      qb
        .selectFrom("discussions as d")
        .innerJoin("exchanges as e", "d.id", "e.discussion_id")
        .select([
          "d.siret",
          sql<number>`COUNT
              (DISTINCT d.id)`.as("total_discussions"),
          sql<number>`COUNT
          (DISTINCT CASE WHEN e.sender = 'establishment'::exchange_role THEN d.id END)`.as(
            "answered_discussions",
          ),
        ])
        .where("d.created_at", ">=", sql<Date>`NOW() - INTERVAL '5 months'`)
        .groupBy("d.siret"),
    )
    .with("recent_conventions", (qb) =>
      qb
        .selectFrom("conventions as c")
        .select("c.siret")
        .where("c.status", "=", "ACCEPTED_BY_VALIDATOR")
        .where("c.date_start", ">=", sql<Date>`NOW() - INTERVAL '5 months'`)
        .groupBy("c.siret"),
    )
    .updateTable("establishments as e")
    .set({
      max_contacts_per_month: 0,
      status: "DEACTIVATED_FOR_LACK_OF_RESPONSES",
      status_updated_at: sql`NOW()`,
    })
    .where((eb) =>
      eb.exists(
        eb
          .selectFrom("establishment_discussions as ed")
          .whereRef("ed.siret", "=", "e.siret")
          .where("ed.total_discussions", ">=", 50)
          .where("ed.answered_discussions", "=", 0),
      ),
    )
    .where((eb) =>
      eb.not(
        eb.exists(
          eb
            .selectFrom("recent_conventions as rc")
            .whereRef("rc.siret", "=", "e.siret"),
        ),
      ),
    )
    .returningAll()
    .execute();
