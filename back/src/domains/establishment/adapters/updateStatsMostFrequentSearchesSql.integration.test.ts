import { format, subDays, subYears } from "date-fns";
import { sql } from "kysely";
import type { Pool } from "pg";
import { expectToEqual } from "shared";
import { v4 as uuidV4 } from "uuid";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../config/pg/pgPool";
import { updateStatsMostFrequentSearchesSql } from "./updateStatsMostFrequentSearchesSql";

describe("updateStatsMostFrequentSearchesSql", () => {
  let pool: Pool;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = makeTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await db.deleteFrom("stats__most_frequent_searches").execute();
    await db.deleteFrom("searches_made__appellation_code").execute();
    await db.deleteFrom("searches_made").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("populates stats table from searches_made when empty", async () => {
    const today = new Date();
    const searchId = uuidV4();
    await insertSearchesMade(db, [
      {
        id: searchId,
        updateDate: today,
        address: "Paris",
        departmentCode: "75",
        voluntaryToImmersion: true,
      },
    ]);
    await insertSearchesMadeAppellationCodes(db, [
      { searchMadeId: searchId, appellationCode: "12345" },
    ]);

    await updateStatsMostFrequentSearchesSql(db);

    const stats = await db
      .selectFrom("stats__most_frequent_searches")
      .selectAll()
      .execute();

    expectToEqual(stats.map(toStatsWithDateString), [
      {
        day: toDateString(today),
        appellation_code: "12345",
        address: "Paris",
        department_code: "75",
        count: 1,
      },
    ]);
  });

  it("aggregates multiple searches with same appellation/address/department", async () => {
    const today = new Date();
    const searchId1 = uuidV4();
    const searchId2 = uuidV4();
    await insertSearchesMade(db, [
      {
        id: searchId1,
        updateDate: today,
        address: "Paris",
        departmentCode: "75",
        voluntaryToImmersion: true,
      },
      {
        id: searchId2,
        updateDate: today,
        address: "Paris",
        departmentCode: "75",
        voluntaryToImmersion: true,
      },
    ]);
    await insertSearchesMadeAppellationCodes(db, [
      { searchMadeId: searchId1, appellationCode: "12345" },
      { searchMadeId: searchId2, appellationCode: "12345" },
    ]);

    await updateStatsMostFrequentSearchesSql(db);

    const stats = await db
      .selectFrom("stats__most_frequent_searches")
      .selectAll()
      .execute();

    expectToEqual(stats.map(toStatsWithDateString), [
      {
        day: toDateString(today),
        appellation_code: "12345",
        address: "Paris",
        department_code: "75",
        count: 2,
      },
    ]);
  });

  it("excludes searches with voluntaryToImmersion = false", async () => {
    const today = new Date();
    const searchId = uuidV4();
    await insertSearchesMade(db, [
      {
        id: searchId,
        updateDate: today,
        address: "Paris",
        departmentCode: "75",
        voluntaryToImmersion: false,
      },
    ]);
    await insertSearchesMadeAppellationCodes(db, [
      { searchMadeId: searchId, appellationCode: "12345" },
    ]);

    await updateStatsMostFrequentSearchesSql(db);

    const stats = await db
      .selectFrom("stats__most_frequent_searches")
      .selectAll()
      .execute();

    expectToEqual(stats, []);
  });

  it("deletes stats older than 1 year", async () => {
    const oldDate = subYears(new Date(), 2);
    await db
      .insertInto("stats__most_frequent_searches")
      .values({
        day: oldDate,
        appellation_code: "12345",
        address: "Old Paris",
        department_code: "75",
        count: 10,
      })
      .execute();

    await updateStatsMostFrequentSearchesSql(db);

    const stats = await db
      .selectFrom("stats__most_frequent_searches")
      .selectAll()
      .execute();

    expectToEqual(stats, []);
  });

  it("updates from last day with existing data", async () => {
    const yesterday = subDays(new Date(), 1);
    const today = new Date();

    await db
      .insertInto("stats__most_frequent_searches")
      .values({
        day: yesterday,
        appellation_code: "11111",
        address: "Lyon",
        department_code: "69",
        count: 5,
      })
      .execute();

    const searchIdToday = uuidV4();
    const searchIdYesterday = uuidV4();
    await insertSearchesMade(db, [
      {
        id: searchIdToday,
        updateDate: today,
        address: "Paris",
        departmentCode: "75",
        voluntaryToImmersion: true,
      },
      {
        id: searchIdYesterday,
        updateDate: yesterday,
        address: "Lyon",
        departmentCode: "69",
        voluntaryToImmersion: true,
      },
    ]);
    await insertSearchesMadeAppellationCodes(db, [
      { searchMadeId: searchIdToday, appellationCode: "12345" },
      { searchMadeId: searchIdYesterday, appellationCode: "11111" },
    ]);

    await updateStatsMostFrequentSearchesSql(db);

    const stats = await db
      .selectFrom("stats__most_frequent_searches")
      .selectAll()
      .orderBy("day", "asc")
      .execute();

    expectToEqual(stats.map(toStatsWithDateString), [
      {
        day: toDateString(yesterday),
        appellation_code: "11111",
        address: "Lyon",
        department_code: "69",
        count: 1,
      },
      {
        day: toDateString(today),
        appellation_code: "12345",
        address: "Paris",
        department_code: "75",
        count: 1,
      },
    ]);
  });

  it("keeps only top 1000 per day", async () => {
    const today = new Date();

    const searches = Array.from({ length: 1005 }, (_, i) => ({
      id: uuidV4(),
      updateDate: today,
      address: `Address-${i}`,
      departmentCode: "75",
      voluntaryToImmersion: true,
    }));

    await insertSearchesMade(db, searches);
    await insertSearchesMadeAppellationCodes(
      db,
      searches.map((s) => ({ searchMadeId: s.id, appellationCode: "12345" })),
    );

    await updateStatsMostFrequentSearchesSql(db);

    const stats = await db
      .selectFrom("stats__most_frequent_searches")
      .selectAll()
      .execute();

    expectToEqual(stats.length, 1000);
  });
});

const toDateString = (date: Date): string => format(date, "yyyy-MM-dd");

type StatsRow = {
  day: Date;
  appellation_code: string | null;
  address: string | null;
  department_code: string | null;
  count: number;
};

const toStatsWithDateString = (stats: StatsRow) => ({
  ...stats,
  day: toDateString(stats.day),
});

type SearchMadeParams = {
  id: string;
  updateDate: Date;
  address: string;
  departmentCode: string;
  voluntaryToImmersion: boolean;
};

const insertSearchesMade = async (db: KyselyDb, searches: SearchMadeParams[]) =>
  db
    .insertInto("searches_made")
    .values(
      searches.map((s) => ({
        id: s.id,
        update_date: sql`${s.updateDate.toISOString()}::timestamp`,
        address: s.address,
        department_code: s.departmentCode,
        voluntary_to_immersion: s.voluntaryToImmersion,
      })),
    )
    .execute();

const insertSearchesMadeAppellationCodes = async (
  db: KyselyDb,
  appellations: {
    searchMadeId: string;
    appellationCode: string;
  }[],
) =>
  db
    .insertInto("searches_made__appellation_code")
    .values(
      appellations.map((a) => ({
        search_made_id: a.searchMadeId,
        appellation_code: a.appellationCode,
      })),
    )
    .execute();
