import { Pool } from "pg";
import { AuthenticatedUser, expectToEqual } from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import { PgAuthenticatedUserRepository } from "./PgAuthenticatedUserRepository";

describe("PgAuthenticatedUserRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgAuthenticatedUserRepository: PgAuthenticatedUserRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    pgAuthenticatedUserRepository = new PgAuthenticatedUserRepository(db);

    await db.deleteFrom("users_ongoing_oauths").execute();
    await db.deleteFrom("users").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("saves an authenticated user, than finds it from external_id, then updates it", async () => {
    const authenticatedUserExternalId = "my-external-id";
    const user: AuthenticatedUser = {
      email: "joe@mail.com",
      lastName: "Doe",
      firstName: "John",
      id: "11111111-1111-1111-1111-111111111111",
      externalId: authenticatedUserExternalId,
    };

    await pgAuthenticatedUserRepository.save(user);

    const fetchedUser = await pgAuthenticatedUserRepository.findByExternalId(
      authenticatedUserExternalId,
    );
    expectToEqual(fetchedUser, user);

    const updatedUser: AuthenticatedUser = {
      id: "11111111-1111-1111-1111-111111111111",
      email: "updated-mail@mail.com",
      lastName: "Dodo",
      firstName: "Johnny",
      externalId: authenticatedUserExternalId,
    };
    await pgAuthenticatedUserRepository.save(updatedUser);
    const fetchedUpdatedUser =
      await pgAuthenticatedUserRepository.findByExternalId(
        authenticatedUserExternalId,
      );
    expectToEqual(fetchedUpdatedUser, updatedUser);
  });

  describe("findByExternalId", () => {
    it("returns an authenticated_user", async () => {
      const user: AuthenticatedUser = {
        email: "joe@mail.com",
        lastName: "Doe",
        firstName: "John",
        id: "11111111-1111-1111-1111-111111111111",
        externalId: "my-external-id",
      };

      await pgAuthenticatedUserRepository.save(user);

      const response = await pgAuthenticatedUserRepository.findByExternalId(
        user.externalId,
      );

      expectToEqual(response, user);
    });

    it("returns undefined when authenticated_user not found", async () => {
      const response =
        await pgAuthenticatedUserRepository.findByExternalId("an-external-id");

      expect(response).toBeUndefined();
    });
  });
});
