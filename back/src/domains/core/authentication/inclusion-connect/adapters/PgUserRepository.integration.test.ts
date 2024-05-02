import { Pool } from "pg";
import { User, expectToEqual } from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import { PgUserRepository } from "./PgUserRepository";

describe("PgAuthenticatedUserRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgUserRepository: PgUserRepository;

  beforeEach(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    pgUserRepository = new PgUserRepository(db);

    await db.deleteFrom("users_ongoing_oauths").execute();
    await db.deleteFrom("users").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("saves an authenticated user, than finds it from external_id, then updates it", async () => {
    const userExternalId = "my-external-id";
    const userId = "11111111-1111-1111-1111-111111111111";
    const createdAt = new Date().toISOString();
    const user: User = {
      email: "joe@mail.com",
      lastName: "Doe",
      firstName: "John",
      id: userId,
      externalId: userExternalId,
      createdAt,
    };

    await pgUserRepository.save(user);

    const fetchedUser = await pgUserRepository.findByExternalId(userExternalId);
    expectToEqual(fetchedUser, user);

    const updatedUser: User = {
      id: userId,
      email: "updated-mail@mail.com",
      lastName: "Dodo",
      firstName: "Johnny",
      externalId: userExternalId,
      createdAt,
    };
    await pgUserRepository.save(updatedUser);
    const fetchedUpdatedUser =
      await pgUserRepository.findByExternalId(userExternalId);
    expectToEqual(fetchedUpdatedUser, updatedUser);
  });

  describe("findByExternalId", () => {
    it("returns an authenticated_user", async () => {
      const user: User = {
        email: "joe@mail.com",
        lastName: "Doe",
        firstName: "John",
        id: "11111111-1111-1111-1111-111111111111",
        externalId: "my-external-id",
        createdAt: new Date().toISOString(),
      };
      await pgUserRepository.save(user);

      const response = await pgUserRepository.findByExternalId(
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        user.externalId!,
      );

      expectToEqual(response, user);
    });

    it("returns undefined when authenticated_user not found", async () => {
      const response =
        await pgUserRepository.findByExternalId("an-external-id");

      expect(response).toBeUndefined();
    });
  });
});
