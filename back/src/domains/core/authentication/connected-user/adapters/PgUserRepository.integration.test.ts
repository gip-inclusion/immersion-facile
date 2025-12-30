import type { Pool } from "pg";
import {
  AgencyDtoBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  type User,
  type UserId,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../../../config/pg/pgPool";
import { toAgencyWithRights } from "../../../../../utils/agency";
import { PgAgencyRepository } from "../../../../agency/adapters/PgAgencyRepository";
import { PgEstablishmentAggregateRepository } from "../../../../establishment/adapters/PgEstablishmentAggregateRepository";
import { EstablishmentAggregateBuilder } from "../../../../establishment/helpers/EstablishmentBuilders";
import { fakeProConnectSiret } from "./oauth-gateway/InMemoryOAuthGateway";
import { PgUserRepository } from "./PgUserRepository";

describe("PgAuthenticatedUserRepository", () => {
  const userExternalId = "my-external-id";
  const createdAt = new Date().toISOString();
  const user: User = {
    email: "joe@mail.com",
    lastName: "Doe",
    firstName: "John",
    id: "11111111-1111-1111-1111-111111111111",
    proConnect: {
      externalId: userExternalId,
      siret: fakeProConnectSiret,
    },
    createdAt: createdAt,
  };

  const user1: User = {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@mail.com",
    proConnect: {
      externalId: "john-external-id",
      siret: fakeProConnectSiret,
    },
    createdAt: new Date().toISOString(),
  };

  const user2: User = {
    id: "44444444-4444-4444-4444-444444444444",
    firstName: "Jane",
    lastName: "Da",
    email: "jane.da@mail.com",
    proConnect: {
      externalId: "jane-external-id",
      siret: fakeProConnectSiret,
    },
    createdAt: new Date().toISOString(),
  };

  let pool: Pool;
  let db: KyselyDb;
  let userRepository: PgUserRepository;

  beforeAll(() => {
    pool = makeTestPgPool();
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

  describe(`With oAuthProvider 'proConnect'`, () => {
    describe("save()", () => {
      it("saves a user, than finds it from external_id, then updates it", async () => {
        await userRepository.save(user);

        const fetchedUser =
          await userRepository.findByExternalId(userExternalId);
        expectToEqual(fetchedUser, user);

        const updatedUser: User = {
          id: user.id,
          email: "updated-mail@mail.com",
          lastName: "Dodo",
          firstName: "Johnny",
          proConnect: {
            externalId: userExternalId,
            siret: fakeProConnectSiret,
          },
          createdAt,
        };
        await userRepository.save(updatedUser);

        const fetchedUpdatedUser =
          await userRepository.findByExternalId(userExternalId);
        expectToEqual(fetchedUpdatedUser, updatedUser);
      });

      it("adds the missing data to the entry when user already exists but not connected", async () => {
        const userNotIcConnected: User = {
          ...user,
          firstName: "",
          lastName: "",
        };
        await userRepository.save(userNotIcConnected);
        expectToEqual(await userRepository.getAllUsers(), [userNotIcConnected]);

        await userRepository.save(user);

        expectToEqual(await userRepository.getAllUsers(), [user]);
      });

      it("updates the last_login_at column", async () => {
        await userRepository.save(user);
        expect(
          (await userRepository.getById(user.id))?.lastLoginAt,
        ).toBeUndefined();

        const lastLoginAt = new Date("2025-11-03T10:00:00Z").toISOString();
        await userRepository.save({ ...user, lastLoginAt });
        expectToEqual(await userRepository.getById(user.id), {
          ...user,
          lastLoginAt,
        });
      });

      it("do not update the last_login_at column if not specified", async () => {
        await userRepository.save(user); // creation
        expect(
          (await userRepository.getById(user.id))?.lastLoginAt,
        ).toBeUndefined();

        await userRepository.save(user); // update
        expect(
          (await userRepository.getById(user.id))?.lastLoginAt,
        ).toBeUndefined();
      });
    });

    describe("updateEmail()", () => {
      it("updates users email in users table", async () => {
        await insertUser(db, user1, true);
        const updatedEmail = "new-email@email.fr";

        await userRepository.updateEmail(user1.id, updatedEmail);

        expectToEqual(await userRepository.getById(user1.id), {
          ...user1,
          email: updatedEmail,
        });
      });
    });

    describe("delete()", () => {
      it("deletes an existing user", async () => {
        await insertUser(db, user1, true);
        await userRepository.delete(user1.id);
        const response = await userRepository.getById(user1.id);
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
        await insertUser(db, user1, true);

        expectToEqual(await userRepository.getById(user1.id), user1);
      });

      it("gets the connected user with admin right for admins", async () => {
        await insertUser(db, user1, true);
        await db
          .insertInto("users_admins")
          .values({ user_id: user1.id })
          .execute();
        const adminUser = await userRepository.getById(user1.id);
        expectToEqual(adminUser, {
          ...user1,
          isBackofficeAdmin: true,
        });
      });
    });

    describe("getByIds()", () => {
      it("success nothing", async () => {
        expectToEqual(await userRepository.getByIds([]), []);
      });

      it("success one user", async () => {
        await insertUser(db, user1, true);

        expectToEqual(await userRepository.getByIds([user1.id]), [user1]);
      });

      it("success multiple users", async () => {
        await insertUser(db, user1, true);
        await insertUser(db, user2, true);
        await insertUser(db, user, true);

        expectToEqual(
          await userRepository.getByIds([user1.id, user2.id, user.id]),
          [user2, user, user1],
        );
      });

      it("error if at least one missing user", async () => {
        await insertUser(db, user1, true);

        const missingUserId: UserId = uuid();

        expectPromiseToFailWithError(
          userRepository.getByIds([user1.id, missingUserId]),
          errors.users.notFound({ userIds: [missingUserId] }),
        );
      });

      it("error if multiple missing users", async () => {
        const missingUserId1: UserId = uuid();
        const missingUserId2: UserId = uuid();

        expectPromiseToFailWithError(
          userRepository.getByIds([missingUserId1, missingUserId2]),
          errors.users.notFound({
            userIds: [missingUserId1, missingUserId2],
          }),
        );
      });
    });

    describe("getUsers()", () => {
      it("returns no users when emailContains is empty string", async () => {
        const users = await userRepository.getUsers({ emailContains: "" });
        expectToEqual(users, []);
      });

      it("returns all the users with email matching filter, with no agencies and establishment match", async () => {
        const userNotIcConnected: User = {
          ...user,
          firstName: "",
          lastName: "",
          proConnect: null,
        };

        await insertUser(db, user1, true);
        await insertUser(db, user2, false);
        await insertUser(db, userNotIcConnected, false);

        const withNoAgenciesOrEstablishements = {
          numberOfAgencies: 0,
          numberOfEstablishments: 0,
        };

        expectToEqual(await userRepository.getUsers({ emailContains: "j" }), [
          { ...user2, proConnect: null, ...withNoAgenciesOrEstablishements },
          { ...userNotIcConnected, ...withNoAgenciesOrEstablishements },
          { ...user1, ...withNoAgenciesOrEstablishements },
        ]);
      });

      it("returns user with 1 agency and 1 establishment", async () => {
        await insertUser(db, user1, true);

        await db.deleteFrom("conventions").execute();
        await db.deleteFrom("agency_groups__agencies").execute();
        await db.deleteFrom("agencies").execute();
        await db.deleteFrom("establishments").execute();

        const agencyRepository = new PgAgencyRepository(db);
        const agency = new AgencyDtoBuilder().build();

        await agencyRepository.insert(
          toAgencyWithRights(agency, {
            [user1.id]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          }),
        );

        const establishmentRepository = new PgEstablishmentAggregateRepository(
          db,
        );
        const establishmentAggregate = new EstablishmentAggregateBuilder()
          .withUserRights([
            {
              role: "establishment-admin",
              job: "Chef",
              userId: user1.id,
              shouldReceiveDiscussionNotifications: true,
              phone: "+33611223344",
              isMainContactByPhone: false,
              isMainContactInPerson: false,
            },
          ])
          .build();
        await establishmentRepository.insertEstablishmentAggregate(
          establishmentAggregate,
        );

        const users = await userRepository.getUsers({ emailContains: "john" });

        expectToEqual(users, [
          {
            ...user1,
            numberOfAgencies: 1,
            numberOfEstablishments: 1,
          },
        ]);
      });
    });

    describe("findByExternalId()", () => {
      it("returns an user", async () => {
        await userRepository.save(user);
        const response = await userRepository.findByExternalId(userExternalId);
        expectToEqual(response, user);
      });

      it("returns undefined when user not found", async () => {
        const response =
          await userRepository.findByExternalId("an-external-id");
        expect(response).toBeUndefined();
      });
    });

    describe("findByEmail()", () => {
      it("returns a user", async () => {
        await userRepository.save(user);
        const response = await userRepository.findByEmail(user.email);
        expectToEqual(response, user);
      });

      it("returns undefined when user not found", async () => {
        const response = await userRepository.findByEmail("some@email.com");
        expect(response).toBeUndefined();
      });
    });
  });
});

const insertUser = async (
  db: KyselyDb,
  { id, email, firstName, lastName, proConnect, createdAt }: User,
  isProConnected: boolean,
) => {
  await db
    .insertInto("users")
    .values({
      id,
      email,
      first_name: firstName,
      last_name: lastName,
      created_at: createdAt,
      ...(isProConnected
        ? {
            pro_connect_sub: proConnect?.externalId,
            pro_connect_siret: proConnect?.siret,
          }
        : {}),
    })
    .execute();
};
