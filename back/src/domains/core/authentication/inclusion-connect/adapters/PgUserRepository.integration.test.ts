import { Pool } from "pg";
import {
  OAuthGatewayProvider,
  User,
  UserId,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  oAuthGatewayProviders,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import { PgUserRepository } from "./PgUserRepository";

describe("PgAuthenticatedUserRepository", () => {
  const userExternalId = "my-external-id";
  const createdAt = new Date().toISOString();
  const user: User = {
    email: "joe@mail.com",
    lastName: "Doe",
    firstName: "John",
    id: "11111111-1111-1111-1111-111111111111",
    externalId: userExternalId,
    createdAt: createdAt,
  };

  const user1: User = {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@mail.com",
    externalId: "john-external-id",
    createdAt: new Date().toISOString(),
  };

  const user2: User = {
    id: "44444444-4444-4444-4444-444444444444",
    firstName: "Jane",
    lastName: "Da",
    email: "jane.da@mail.com",
    externalId: "jane-external-id",
    createdAt: new Date().toISOString(),
  };

  let pool: Pool;
  let db: KyselyDb;
  let userRepository: PgUserRepository;

  beforeAll(() => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    userRepository = new PgUserRepository(db);
    await db.deleteFrom("users_ongoing_oauths").execute();
    await db.deleteFrom("users").execute();
    await db.deleteFrom("users_admins").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe.each(oAuthGatewayProviders)(
    `With oAuthProvider '%s'`,
    (provider) => {
      describe("save()", () => {
        it("saves a user, than finds it from external_id, then updates it", async () => {
          await userRepository.save(user, provider);

          const fetchedUser = await userRepository.findByExternalId(
            userExternalId,
            provider,
          );
          expectToEqual(fetchedUser, user);

          const updatedUser: User = {
            id: user.id,
            email: "updated-mail@mail.com",
            lastName: "Dodo",
            firstName: "Johnny",
            externalId: userExternalId,
            createdAt,
          };
          await userRepository.save(updatedUser, provider);

          const fetchedUpdatedUser = await userRepository.findByExternalId(
            userExternalId,
            provider,
          );
          expectToEqual(fetchedUpdatedUser, updatedUser);
        });

        it("adds the missing data to the entry when user already exists but not connected", async () => {
          const userNotIcConnected: User = {
            ...user,
            firstName: "",
            lastName: "",
            externalId: null,
          };
          await userRepository.save(userNotIcConnected, provider);
          expectToEqual(await userRepository.getAllUsers(provider), [
            userNotIcConnected,
          ]);

          await userRepository.save(user, provider);

          expectToEqual(await userRepository.getAllUsers(provider), [user]);
        });
      });

      describe("updateEmail()", () => {
        it("updates users email in users table", async () => {
          await insertUser(db, user1, provider);
          const updatedEmail = "new-email@email.fr";

          await userRepository.updateEmail(user1.id, updatedEmail);

          expectToEqual(await userRepository.getById(user1.id, provider), {
            ...user1,
            email: updatedEmail,
          });
        });
      });

      describe("delete()", () => {
        it("deletes an existing user", async () => {
          await insertUser(db, user1, provider);
          await userRepository.delete(user1.id);
          const response = await userRepository.getById(user1.id, provider);
          expectToEqual(response, undefined);
          expectToEqual(
            await db
              .selectFrom("users__agencies")
              .selectAll()
              .where("user_id", "=", user1.id)
              .execute(),
            [],
          );
        });

        it("does not throw when user does not exist", async () => {
          await expectPromiseToFailWithError(
            userRepository.delete(user1.id),
            errors.user.notFound({ userId: user1.id }),
          );
        });
      });

      describe("getById()", () => {
        it("gets the connected user from its Id", async () => {
          await insertUser(db, user1, provider);
          const inclusionConnectedUser = await userRepository.getById(
            user1.id,
            provider,
          );
          expectToEqual(inclusionConnectedUser, user1);
        });

        it("gets the connected user with admin right for admins", async () => {
          await insertUser(db, user1, provider);
          await db
            .insertInto("users_admins")
            .values({ user_id: user1.id })
            .execute();
          const adminUser = await userRepository.getById(user1.id, provider);
          expectToEqual(adminUser, {
            ...user1,
            isBackofficeAdmin: true,
          });
        });
      });

      describe("getByIds()", () => {
        it("success nothing", async () => {
          expectToEqual(await userRepository.getByIds([], provider), []);
        });

        it("success one user", async () => {
          await insertUser(db, user1, provider);

          expectToEqual(await userRepository.getByIds([user1.id], provider), [
            user1,
          ]);
        });

        it("success multiple users", async () => {
          await insertUser(db, user1, provider);
          await insertUser(db, user2, provider);
          await insertUser(db, user, provider);

          expectToEqual(
            await userRepository.getByIds(
              [user1.id, user2.id, user.id],
              provider,
            ),
            [user2, user, user1],
          );
        });

        it("error if at least one missing user", async () => {
          await insertUser(db, user1, provider);

          const missingUserId: UserId = uuid();

          expectPromiseToFailWithError(
            userRepository.getByIds([user1.id, missingUserId], provider),
            errors.users.notFound({ userIds: [missingUserId] }),
          );
        });

        it("error if multiple missing users", async () => {
          const missingUserId1: UserId = uuid();
          const missingUserId2: UserId = uuid();

          expectPromiseToFailWithError(
            userRepository.getByIds([missingUserId1, missingUserId2], provider),
            errors.users.notFound({
              userIds: [missingUserId1, missingUserId2],
            }),
          );
        });
      });

      describe("getUsers()", () => {
        it("returns no users when emailContains is empty string", async () => {
          const users = await userRepository.getUsers(
            { emailContains: "" },
            "inclusionConnect",
          );
          expectToEqual(users, []);
        });

        it("returns all the users with email matching filter", async () => {
          const userNotIcConnected: User = {
            ...user,
            firstName: "",
            lastName: "",
            externalId: null,
          };

          await insertUser(db, user1, "inclusionConnect");
          await insertUser(db, user2, "proConnect");
          await insertUser(db, userNotIcConnected, null);

          const users = await userRepository.getUsers(
            { emailContains: "j" },
            "inclusionConnect",
          );
          expectToEqual(users, [
            { ...user2, externalId: null },
            userNotIcConnected,
            user1,
          ]);
        });
      });

      describe("findByExternalId()", () => {
        it("returns an user", async () => {
          await userRepository.save(user, provider);
          const response = await userRepository.findByExternalId(
            userExternalId,
            provider,
          );
          expectToEqual(response, user);
        });

        it("returns undefined when user not found", async () => {
          const response = await userRepository.findByExternalId(
            "an-external-id",
            provider,
          );
          expect(response).toBeUndefined();
        });
      });

      describe("findByEmail()", () => {
        it("returns a user", async () => {
          await userRepository.save(user, provider);
          const response = await userRepository.findByEmail(
            user.email,
            provider,
          );
          expectToEqual(response, user);
        });

        it("returns undefined when user not found", async () => {
          const response = await userRepository.findByEmail(
            "some@email.com",
            provider,
          );
          expect(response).toBeUndefined();
        });
      });
    },
  );
});

const insertUser = async (
  db: KyselyDb,
  { id, email, firstName, lastName, externalId, createdAt }: User,
  provider: OAuthGatewayProvider | null,
) => {
  const icProvider =
    provider === "inclusionConnect"
      ? { inclusion_connect_sub: externalId }
      : {};
  const proConnectProvider =
    provider === "proConnect" ? { pro_connect_sub: externalId } : {};

  await db
    .insertInto("users")
    .values({
      id,
      email,
      first_name: firstName,
      last_name: lastName,
      created_at: createdAt,
      ...icProvider,
      ...proConnectProvider,
    })
    .execute();
};
