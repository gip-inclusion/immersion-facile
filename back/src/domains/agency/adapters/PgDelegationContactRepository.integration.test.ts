import { Pool } from "pg";
import { expectToEqual } from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { PgDelegationContactRepository } from "./PgDelegationContactRepository";

describe("PgDelegationContact", () => {
  let pool: Pool;
  let delegationContactRepository: PgDelegationContactRepository;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.deleteFrom("delegation_contacts").execute();

    delegationContactRepository = new PgDelegationContactRepository(db);
  });

  it("gets the email of a delegation", async () => {
    const province = "Auvergne-Rhône-Alpes";
    const email = "this-delegation@email.fr";
    await db
      .insertInto("delegation_contacts")
      .values({ province, email })
      .execute();
    await db
      .insertInto("delegation_contacts")
      .values({
        province: "Bourgogne-Franche-Comté",
        email: "another-email@email.com",
      })
      .execute();

    const result =
      await delegationContactRepository.getEmailByProvince(province);

    expectToEqual(result, email);
  });
});
