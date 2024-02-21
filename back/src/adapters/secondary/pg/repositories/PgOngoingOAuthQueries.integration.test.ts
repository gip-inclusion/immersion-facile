import { Pool, PoolClient } from "pg";
import { AuthenticatedUser, expectToEqual } from "shared";
import { OngoingOAuth } from "../../../../domain/generic/OAuth/entities/OngoingOAuth";
import { KyselyDb, makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
import { PgAuthenticatedUserRepository } from "./PgAuthenticatedUserRepository";
import { PgOngoingOAuthQueries } from "./PgOngoingOAuthQueries";
import { PgOngoingOAuthRepository } from "./PgOngoingOAuthRepository";

describe("Pg implementation of PgOngoingOauthQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let transaction: KyselyDb;
  let ongoingOauthQueries: PgOngoingOAuthQueries;
  let ongoingOauthRepository: PgOngoingOAuthRepository;
  let authenticatedUserRepository: PgAuthenticatedUserRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM ongoing_oauths");
    await client.query("DELETE FROM users__agencies");
    await client.query("DELETE FROM authenticated_users");

    transaction = makeKyselyDb(pool);

    ongoingOauthRepository = new PgOngoingOAuthRepository(transaction);
    authenticatedUserRepository = new PgAuthenticatedUserRepository(
      transaction,
    );
    ongoingOauthQueries = new PgOngoingOAuthQueries(
      transaction,
      ongoingOauthRepository,
      authenticatedUserRepository,
    );
  });

  it("update ongoing_oauth and save a new authenticated_users", async () => {
    const ongoingOauth: OngoingOAuth = {
      nonce: "40400c99-9c0b-bbbb-bb6d-6bb9bd300404",
      state: "40400c99-9c0b-bbbb-bb6d-6bb9bd300400",
      provider: "inclusionConnect",
    };
    await ongoingOauthRepository.save(ongoingOauth);

    const authenticatedUser: AuthenticatedUser = {
      id: "40400c99-9c0b-bbbb-bb6d-6bb9bd300400",
      externalId: "my-external-id",
      email: "john@email.com",
      firstName: "john",
      lastName: "doe",
    };

    const updatedOngoingOauth: OngoingOAuth = {
      ...ongoingOauth,
      userId: authenticatedUser.id,
      externalId: "my-external-id",
      accessToken: "my-access-token",
    };

    await ongoingOauthQueries.save(updatedOngoingOauth, authenticatedUser);

    expectToEqual(
      await ongoingOauthRepository.findByState(
        ongoingOauth.state,
        ongoingOauth.provider,
      ),
      updatedOngoingOauth,
    );
  });
});
