import { Pool } from "pg";
import { expectObjectsToMatch } from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { ValidatedConventionNps } from "../entities/ValidatedConventionNps";
import { PgNpsRepository } from "./PgNpsRepository";

describe("PgNpsRepository", () => {
  let pool: Pool;
  let pgNpsRepository: PgNpsRepository;
  let db: KyselyDb;

  beforeAll(() => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await db.deleteFrom("nps").execute();
    pgNpsRepository = new PgNpsRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("saves an nps correctly", async () => {
    const nps: ValidatedConventionNps = {
      conventionId: "my convention id",
      comments: "I liked it",
      role: "beneficiary-representative",
      score: 9,
      wouldHaveDoneWithoutIF: false,
      rawResult: { whatever: "should work" },
      responseId: "my response id",
      respondentId: "my respondent id",
    };

    await pgNpsRepository.save(nps);

    const savedNps = await db.selectFrom("nps").selectAll().execute();
    expect(savedNps).toHaveLength(1);
    expectObjectsToMatch(savedNps[0], {
      score: nps.score,
      would_have_done_without_if: nps.wouldHaveDoneWithoutIF,
      comments: nps.comments,
      role: nps.role,
      convention_id: nps.conventionId,
      raw_result: nps.rawResult as any,
      respondent_id: nps.respondentId,
      response_id: nps.responseId,
    });
  });
});
