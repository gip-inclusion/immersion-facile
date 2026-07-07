import type { Pool } from "pg";
import { expectToEqual } from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../../config/pg/pgPool";
import { expectedAllNafSections } from "./expectedAllNafSections";
import { PgNafRepository } from "./PgNafRepository";

describe("Pg implementation of NafRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let nafRepository: PgNafRepository;

  beforeAll(async () => {
    pool = makeTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    nafRepository = new PgNafRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("PG implementation of method getAllNafSuggestions", () => {
    it("Returns all NAF sections", async () => {
      expectToEqual(
        await nafRepository.getAllNafSuggestions(),
        expectedAllNafSections,
      );
    });
  });
});
