import { Pool, PoolClient } from "pg";

import { expectToEqual } from "shared";

import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { OngoingOAuth } from "../../../domain/generic/OAuth/entities/OngoingOAuth";

import { PgOngoingOAuthRepository } from "./PgOngoingOAuthRepository";

describe("PgOngoingOAuthRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgOngoingOAuthRepository: PgOngoingOAuthRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    pgOngoingOAuthRepository = new PgOngoingOAuthRepository(client);
    await client.query("DELETE FROM ongoing_oauths");
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

    const updatedOngoingOAuth: OngoingOAuth = {
      ...ongoingOAuth,
      userId: "22222222-2222-2222-2222-222222222222",
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
