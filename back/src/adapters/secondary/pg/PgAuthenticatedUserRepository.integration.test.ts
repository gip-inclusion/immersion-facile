import { Pool, PoolClient } from "pg";
import { expectToEqual } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { AuthenticatedUser } from "../../../domain/generic/OAuth/entities/AuthenticatedUser";
import { PgAuthenticatedUserRepository } from "./PgAuthenticatedUserRepository";

describe("PgAuthenticatedUserRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgAuthenticatedUserRepository: PgAuthenticatedUserRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    pgAuthenticatedUserRepository = new PgAuthenticatedUserRepository(client);
    await client.query("DELETE FROM authenticated_users");
  });
  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("returns undefined if no authenticated user are found", async () => {
    const response = await pgAuthenticatedUserRepository.findByEmail(
      "joe@mail.com",
    );
    expect(response).toBeUndefined();
  });
  it("saves an authenticated user, than finds it from id, than updates it", async () => {
    const email = "joe@mail.com";
    const user: AuthenticatedUser = {
      email,
      lastName: "Doe",
      firstName: "John",
      id: "11111111-1111-1111-1111-111111111111",
    };

    await pgAuthenticatedUserRepository.save(user);

    const fetchedUser = await pgAuthenticatedUserRepository.findByEmail(email);
    expectToEqual(fetchedUser, user);

    const updatedUser: AuthenticatedUser = {
      id: "11111111-1111-1111-1111-111111111111",
      email,
      lastName: "Dodo",
      firstName: "Johnny",
    };
    await pgAuthenticatedUserRepository.save(updatedUser);
    const fetchedUpdatedUser = await pgAuthenticatedUserRepository.findByEmail(
      email,
    );
    expectToEqual(fetchedUpdatedUser, updatedUser);
  });
});
