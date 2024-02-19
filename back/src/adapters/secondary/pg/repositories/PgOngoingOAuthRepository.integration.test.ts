import { Pool, PoolClient } from "pg";
import { AuthenticatedUser, expectToEqual } from "shared";
import { OngoingOAuth } from "../../../../domain/generic/OAuth/entities/OngoingOAuth";
import { KyselyDb, makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
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

  it("saves an ongoing OAuth, than gets it from its states, than updates it", async () => {
    const state = "11111111-1111-1111-1111-111111111111";
    const provider = "inclusionConnect";
    const ongoingOAuth: OngoingOAuth = {
      state,
      nonce: "123",
      provider,
    };
    await pgOngoingOAuthRepository.save(ongoingOAuth);

    const fetched = await pgOngoingOAuthRepository.findByState(state, provider);
    expectToEqual(fetched, ongoingOAuth);

    const response = await client.query("SELECT * FROM ongoing_oauths");
    expect(response.rows).toHaveLength(1);

    const authenticatedUser: AuthenticatedUser = {
      id: "add5c20e-6dd2-45af-affe-927358005251",
      email: "john@mail.fr",
      firstName: "John",
      lastName: "Doe",
    };
    await pgAuthenticatedUserRepository.save(authenticatedUser);
    const updatedOngoingOAuth: OngoingOAuth = {
      ...ongoingOAuth,
      userId: authenticatedUser.id,
      externalId: "my-external-id",
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
