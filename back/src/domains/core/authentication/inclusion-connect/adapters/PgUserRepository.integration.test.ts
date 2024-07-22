import { Pool } from "pg";
import { User, expectToEqual } from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import { PgUserRepository } from "./PgUserRepository";

const userExternalId = "my-external-id";
const userId = "11111111-1111-1111-1111-111111111111";
const createdAt = new Date().toISOString();
const user: User = {
  email: "joe@mail.com",
  lastName: "Doe",
  firstName: "John",
  id: userId,
  externalId: userExternalId,
  createdAt: createdAt,
};

describe("PgAuthenticatedUserRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgUserRepository: PgUserRepository;

  beforeAll(() => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    pgUserRepository = new PgUserRepository(db);

    await db.deleteFrom("users_ongoing_oauths").execute();
    await db.deleteFrom("users").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("saves a user, than finds it from external_id, then updates it", async () => {
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

  describe("when user already exists but not inclusion connected", () => {
    it("adds the missing data to the entry", async () => {
      const userNotIcConnected: User = {
        ...user,
        firstName: "",
        lastName: "",
        externalId: null,
      };
      await pgUserRepository.save(userNotIcConnected);

      await pgUserRepository.save(user);
      const fetchedUpdatedUser = await pgUserRepository.findByEmail(user.email);
      expectToEqual(fetchedUpdatedUser, user);
    });
  });

  describe("findByExternalId", () => {
    it("returns an user", async () => {
      await pgUserRepository.save(user);
      const response = await pgUserRepository.findByExternalId(userExternalId);
      expectToEqual(response, user);
    });

    it("returns undefined when user not found", async () => {
      const response =
        await pgUserRepository.findByExternalId("an-external-id");
      expect(response).toBeUndefined();
    });
  });

  describe("findByEmail", () => {
    it("returns a user", async () => {
      await pgUserRepository.save(user);
      const response = await pgUserRepository.findByEmail(user.email);
      expectToEqual(response, user);
    });

    it("returns undefined when user not found", async () => {
      const response = await pgUserRepository.findByEmail("some@email.com");
      expect(response).toBeUndefined();
    });
  });
});
