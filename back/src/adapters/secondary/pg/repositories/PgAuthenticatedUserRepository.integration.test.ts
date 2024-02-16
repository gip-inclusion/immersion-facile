import { Pool, PoolClient } from "pg";
import { AuthenticatedUser, expectToEqual } from "shared";
import { makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
import { PgAuthenticatedUserRepository } from "./PgAuthenticatedUserRepository";

describe("PgAuthenticatedUserRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgAuthenticatedUserRepository: PgAuthenticatedUserRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    pgAuthenticatedUserRepository = new PgAuthenticatedUserRepository(
      makeKyselyDb(pool),
    );
    await client.query("DELETE FROM ongoing_oauths");
    await client.query("DELETE FROM authenticated_users");
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("returns undefined if no authenticated user are found", async () => {
    const response =
      await pgAuthenticatedUserRepository.findByEmail("joe@mail.com");
    expect(response).toBeUndefined();
  });

  it("saves an authenticated user, than finds it from external_id, then updates it", async () => {
    const email = "joe@mail.com";
    const user: AuthenticatedUser = {
      email,
      lastName: "Doe",
      firstName: "John",
      id: "11111111-1111-1111-1111-111111111111",
      externalId: 'my-external-id',
    };

    await pgAuthenticatedUserRepository.save(user);

    const fetchedUser = await pgAuthenticatedUserRepository.findByEmail(email);
    expectToEqual(fetchedUser, user);

    const updatedUser: AuthenticatedUser = {
      id: "11111111-1111-1111-1111-111111111111",
      email,
      lastName: "Dodo",
      firstName: "Johnny",
      externalId: 'my-external-id',
    };
    await pgAuthenticatedUserRepository.save(updatedUser);
    const fetchedUpdatedUser =
      await pgAuthenticatedUserRepository.findByEmail(email);
    expectToEqual(fetchedUpdatedUser, updatedUser);
  });

  describe("findByExternalId", () => {
    it("returns an authenticated_user", async () => {
      const user: AuthenticatedUser = {
        email: "joe@mail.com",
        lastName: "Doe",
        firstName: "John",
        id: "11111111-1111-1111-1111-111111111111",
        externalId: 'my-external-id',
      };

      await pgAuthenticatedUserRepository.save(user);

      const response =
        await pgAuthenticatedUserRepository.findByExternalId(user.externalId);

      expectToEqual(response, user);
    });

    it("returns undefined when authenticated_user not found", async () => {
      const response =
        await pgAuthenticatedUserRepository.findByExternalId("an-external-id");

      expect(response).toBeUndefined();
    });
  })
});
