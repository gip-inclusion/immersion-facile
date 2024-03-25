import { Pool } from "pg";
import { User, expectToEqual } from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import { OngoingOAuth } from "../entities/OngoingOAuth";
import { PgOngoingOAuthRepository } from "./PgOngoingOAuthRepository";
import { PgUserRepository } from "./PgUserRepository";

describe("PgOngoingOAuthRepository", () => {
  let pool: Pool;
  let pgOngoingOAuthRepository: PgOngoingOAuthRepository;
  let pgUserRepository: PgUserRepository;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    pgOngoingOAuthRepository = new PgOngoingOAuthRepository(db);
    pgUserRepository = new PgUserRepository(db);
    await db.deleteFrom("users_ongoing_oauths").execute();
    await db.deleteFrom("users").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("saves an ongoing OAuth, then gets it from its states, then updates it", async () => {
    const state = "11111111-1111-1111-1111-111111111111";
    const provider = "inclusionConnect";
    const ongoingOAuth: OngoingOAuth = {
      state,
      nonce: "123",
      provider,
    };
    const user: User = {
      id: "22222222-2222-2222-2222-222222222222",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@mail.com",
      externalId: "john-external-id",
    };
    await pgUserRepository.save(user);
    await pgOngoingOAuthRepository.save(ongoingOAuth);

    const fetched = await pgOngoingOAuthRepository.findByState(state, provider);
    expectToEqual(fetched, ongoingOAuth);

    const results = await db
      .selectFrom("users_ongoing_oauths")
      .selectAll()
      .execute();
    expect(results).toHaveLength(1);

    await pgUserRepository.save(user);
    const updatedOngoingOAuth: OngoingOAuth = {
      ...ongoingOAuth,
      userId: user.id,
      externalId: user.externalId,
      accessToken: "some-token",
    };
    await pgOngoingOAuthRepository.save(updatedOngoingOAuth);
    const fetchedUpdated = await pgOngoingOAuthRepository.findByState(
      state,
      provider,
    );
    expectToEqual(fetchedUpdated, updatedOngoingOAuth);
  });
});
