import { Pool, PoolClient } from "pg";
import { AuthenticatedUser, expectToEqual } from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import { OngoingOAuth } from "../entities/OngoingOAuth";
import { PgAuthenticatedUserRepository } from "./PgAuthenticatedUserRepository";
import { PgOngoingOAuthRepository } from "./PgOngoingOAuthRepository";

describe("PgOngoingOAuthRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgOngoingOAuthRepository: PgOngoingOAuthRepository;
  let pgAuthenticatedUserRepository: PgAuthenticatedUserRepository;
  let transaction: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    transaction = makeKyselyDb(pool);
    pgOngoingOAuthRepository = new PgOngoingOAuthRepository(transaction);
    pgAuthenticatedUserRepository = new PgAuthenticatedUserRepository(
      transaction,
    );
    await client.query("DELETE FROM ongoing_oauths");
    await client.query("DELETE FROM authenticated_users");
  });

  afterAll(async () => {
    client.release();
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
    const authenticatedUser: AuthenticatedUser = {
      id: "22222222-2222-2222-2222-222222222222",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@mail.com",
      externalId: "john-external-id",
    };
    await pgAuthenticatedUserRepository.save(authenticatedUser);
    await pgOngoingOAuthRepository.save(ongoingOAuth);

    const fetched = await pgOngoingOAuthRepository.findByState(state, provider);
    expectToEqual(fetched, ongoingOAuth);

    const response = await client.query("SELECT * FROM ongoing_oauths");
    expect(response.rows).toHaveLength(1);

    await pgAuthenticatedUserRepository.save(authenticatedUser);
    const updatedOngoingOAuth: OngoingOAuth = {
      ...ongoingOAuth,
      userId: authenticatedUser.id,
      externalId: authenticatedUser.externalId,
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
