import { Pool } from "pg";
import {
  AgencyDtoBuilder,
  AgencyId,
  AgencyRight,
  AgencyRole,
  InclusionConnectedUser,
  OAuthGatewayProvider,
  User,
  UserId,
  defaultValidatorEmail,
  errors,
  expectArraysToEqualIgnoringOrder,
  expectPromiseToFailWithError,
  expectToEqual,
  oAuthGatewayProviders,
} from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import { PgAgencyRepository } from "../../../../agency/adapters/PgAgencyRepository";
import { PgEstablishmentAggregateRepository } from "../../../../establishment/adapters/PgEstablishmentAggregateRepository";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
} from "../../../../establishment/helpers/EstablishmentBuilders";
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
  let userRepository: PgUserRepository;
  let agencyRepository: PgAgencyRepository;

  beforeAll(() => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    userRepository = new PgUserRepository(db);
    agencyRepository = new PgAgencyRepository(db);

    await db.deleteFrom("users_ongoing_oauths").execute();
    await db.deleteFrom("users").execute();
    await db.deleteFrom("users_admins").execute();
    await db.deleteFrom("users__agencies").execute();
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agency_groups").execute();
    await db.deleteFrom("agencies").execute();
    await db.deleteFrom("establishments").execute();
    await db.deleteFrom("establishments_contacts").execute();
    await db.deleteFrom("immersion_offers").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe.each(oAuthGatewayProviders)(
    `With oAuthProvider '%s'`,
    (provider) => {
      it("saves a user, than finds it from external_id, then updates it", async () => {
        await userRepository.save(user, provider);

        const fetchedUser = await userRepository.findByExternalId(
          userExternalId,
          provider,
        );
        expectToEqual(fetchedUser, user);

        const updatedUser: User = {
          id: userId,
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

      describe("when user already exists but not connected", () => {
        it("adds the missing data to the entry", async () => {
          const userNotIcConnected: User = {
            ...user,
            firstName: "",
            lastName: "",
            externalId: null,
          };
          await userRepository.save(userNotIcConnected, provider);

          await userRepository.save(user, provider);
          const fetchedUpdatedUser = await userRepository.findByEmail(
            user.email,
            provider,
          );
          expectToEqual(fetchedUpdatedUser, user);
        });
      });

      describe("findByExternalId", () => {
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

      describe("findByEmail", () => {
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

      describe("getById", () => {
        describe("when no agency is connected", () => {
          it("gets the connected user from its Id", async () => {
            await insertUser(db, user1, provider);
            await db
              .insertInto("users_admins")
              .values({ user_id: user1.id })
              .execute();
            const adminUser = await userRepository.getById(user1.id, provider);
            expectToEqual(adminUser, {
              ...user1,
              establishments: [],
              agencyRights: [],
              ...withEmptyDashboards,
              isBackofficeAdmin: true,
            });
          });

          it("gets the connected user with admin right for admins", async () => {
            await insertUser(db, user1, provider);
            const inclusionConnectedUser = await userRepository.getById(
              user1.id,
              provider,
            );
            expectToEqual(inclusionConnectedUser, {
              ...user1,
              establishments: [],
              agencyRights: [],
              ...withEmptyDashboards,
            });
          });
        });

        it("gets the connected user from its Id with the connected agencies", async () => {
          await Promise.all([
            await agencyRepository.insert(agency1),
            await agencyRepository.insert(agency2),
            await insertUser(db, user1, provider),
          ]);

          // create the link between the user and the agencies
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency1.id,
            userId: user1.id,
            roles: ["to-review"],
            isNotifiedByEmail: false,
          });
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency2.id,
            userId: user1.id,
            roles: ["validator"],
            isNotifiedByEmail: false,
          });

          const inclusionConnectedUser = await userRepository.getById(
            user1.id,
            provider,
          );
          expectToEqual(inclusionConnectedUser, {
            ...user1,
            establishments: [],
            agencyRights: [
              {
                agency: agency1,
                roles: ["to-review"],
                isNotifiedByEmail: false,
              },
              {
                agency: agency2,
                roles: ["validator"],
                isNotifiedByEmail: false,
              },
            ],
            ...withEmptyDashboards,
          });
        });

        it("gets the user with the connected establishments when they exist", async () => {
          const contact1 = new ContactEntityBuilder()
            .withEmail(user1.email)
            .build();
          const customizedEstablishment1Name = "My awsome name";
          const establishment1 = new EstablishmentAggregateBuilder()
            .withEstablishmentCustomizedName(customizedEstablishment1Name)
            .withContact(contact1)
            .build();

          const contact2 = new ContactEntityBuilder()
            .withId("22222222-2222-4bbb-2222-222222222222")
            .withEmail(user1.email)
            .build();

          const establishment2Name = "Establishment 2";
          const establishment2 = new EstablishmentAggregateBuilder()
            .withEstablishmentSiret("12345678901234")
            .withLocationId("11111111-1111-4111-1111-111111111111")
            .withEstablishmentCustomizedName("")
            .withEstablishmentName(establishment2Name)
            .withContact(contact2)
            .build();

          const establishmentRepository =
            new PgEstablishmentAggregateRepository(db);

          await establishmentRepository.insertEstablishmentAggregate(
            establishment1,
          );
          await establishmentRepository.insertEstablishmentAggregate(
            establishment2,
          );
          await insertUser(db, user1, provider);
          await db
            .insertInto("users_admins")
            .values({ user_id: user1.id })
            .execute();
          const adminUser = await userRepository.getById(user1.id, provider);
          expectToEqual(adminUser, {
            ...user1,
            agencyRights: [],
            dashboards: {
              agencies: {},
              establishments: {},
            },
            isBackofficeAdmin: true,
            establishments: [
              {
                siret: establishment2.establishment.siret,
                businessName: establishment2Name,
              },
              {
                siret: establishment1.establishment.siret,
                businessName: customizedEstablishment1Name,
              },
            ],
          });
        });

        it("gets the user without the agency rights on agencies that are closed or rejected", async () => {
          const rejectedAgency = new AgencyDtoBuilder()
            .withValidatorEmails(["closed-agency-validator@email.fr"])
            .withId("11111111-1111-4bbb-1111-111111111114")
            .withStatus("rejected")
            .withName("Agence rejected")
            .build();

          const closedAgency = new AgencyDtoBuilder()
            .withValidatorEmails(["rejected-agency-validator@email.fr"])
            .withId("11111111-1111-4bbb-1111-111111111115")
            .withName("Agence closed")
            .withStatus("closed")
            .build();

          await Promise.all([
            await agencyRepository.insert(agency1),
            await agencyRepository.insert(agency2),
            await agencyRepository.insert(rejectedAgency),
            await agencyRepository.insert(closedAgency),
            await insertUser(db, user1, provider),
          ]);

          // create the link between the user and the agencies
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency1.id,
            userId: user1.id,
            roles: ["to-review"],
            isNotifiedByEmail: false,
          });
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency2.id,
            userId: user1.id,
            roles: ["validator"],
            isNotifiedByEmail: false,
          });
          await insertAgencyRegistrationToUser(db, {
            agencyId: closedAgency.id,
            userId: user1.id,
            roles: ["to-review"],
            isNotifiedByEmail: false,
          });
          await insertAgencyRegistrationToUser(db, {
            agencyId: rejectedAgency.id,
            userId: user1.id,
            roles: ["validator"],
            isNotifiedByEmail: false,
          });

          const inclusionConnectedUser = await userRepository.getById(
            user1.id,
            provider,
          );
          expectToEqual(inclusionConnectedUser, {
            ...user1,
            establishments: [],
            agencyRights: [
              {
                agency: agency1,
                roles: ["to-review"],
                isNotifiedByEmail: false,
              },
              {
                agency: agency2,
                roles: ["validator"],
                isNotifiedByEmail: false,
              },
            ],
            ...withEmptyDashboards,
          });
        });
      });

      describe("updateAgencyRights", () => {
        it("updates an element in users__agencies table", async () => {
          await agencyRepository.insert(agency1);
          await insertUser(db, user1, provider);
          const agencyRights: AgencyRight[] = [
            {
              roles: ["counsellor"],
              agency: agency1,
              isNotifiedByEmail: false,
            },
          ];
          await userRepository.updateAgencyRights({
            userId: user1.id,
            agencyRights: agencyRights,
          });
          expectToEqual(await userRepository.getById(user1.id, provider), {
            ...user1,
            establishments: [],
            agencyRights: agencyRights,
            ...withEmptyDashboards,
          });

          await userRepository.updateAgencyRights({
            userId: user1.id,
            agencyRights: [
              {
                roles: ["validator"],
                agency: agency1,
                isNotifiedByEmail: true,
              },
            ],
          });

          expectToEqual(await userRepository.getById(user1.id, provider), {
            ...user1,
            establishments: [],
            agencyRights: [
              {
                roles: ["validator"],
                agency: {
                  ...agency1,
                  validatorEmails: [...agency1.validatorEmails, user1.email],
                },
                isNotifiedByEmail: true,
              },
            ],
            ...withEmptyDashboards,
          });
        });
        it("adds an element in users__agencies table", async () => {
          await agencyRepository.insert(agency1);
          await insertUser(db, user1, provider);
          const icUserToUpdate: InclusionConnectedUser = {
            ...user1,
            establishments: [],
            agencyRights: [
              {
                roles: ["counsellor"],
                agency: agency1,
                isNotifiedByEmail: false,
              },
            ],
            ...withEmptyDashboards,
          };

          await userRepository.updateAgencyRights({
            userId: icUserToUpdate.id,
            agencyRights: icUserToUpdate.agencyRights,
          });

          const savedIcUser = await userRepository.getById(user1.id, provider);
          expectToEqual(savedIcUser, icUserToUpdate);
        });

        it("Delete an element in users__agencies table when no agency rights are provided", async () => {
          await agencyRepository.insert(agency1);
          await insertUser(db, user1, provider);
          const icUserToSave: InclusionConnectedUser = {
            ...user1,
            establishments: [],
            agencyRights: [],
            ...withEmptyDashboards,
          };

          await userRepository.updateAgencyRights({
            userId: icUserToSave.id,
            agencyRights: icUserToSave.agencyRights,
          });

          const savedIcUser = await userRepository.getById(user1.id, provider);
          expectToEqual(savedIcUser, icUserToSave);
        });

        it("Delete just one element in users__agencies table when two agency rights are provided", async () => {
          await agencyRepository.insert(agency1);
          await agencyRepository.insert(agency2);

          await insertUser(db, user1, provider);

          const icUserToSave: InclusionConnectedUser = {
            ...user1,
            establishments: [],
            agencyRights: [
              {
                agency: agency1,
                roles: ["validator"],
                isNotifiedByEmail: false,
              },
              {
                agency: agency2,
                roles: ["to-review"],
                isNotifiedByEmail: false,
              },
            ],
            ...withEmptyDashboards,
          };

          await userRepository.updateAgencyRights({
            userId: icUserToSave.id,
            agencyRights: icUserToSave.agencyRights,
          });

          const savedIcUser = await userRepository.getById(user1.id, provider);

          expectToEqual(savedIcUser, icUserToSave);

          const updatedIcUserToSave: InclusionConnectedUser = {
            ...user1,
            establishments: [],
            agencyRights: [
              {
                agency: agency1,
                roles: ["validator"],
                isNotifiedByEmail: false,
              },
            ],
            ...withEmptyDashboards,
          };

          await userRepository.updateAgencyRights({
            userId: updatedIcUserToSave.id,
            agencyRights: updatedIcUserToSave.agencyRights,
          });

          const updatedSavedIcUser = await userRepository.getById(
            user1.id,
            provider,
          );
          expectToEqual(updatedSavedIcUser, updatedIcUserToSave);
        });
      });
      describe("update user", () => {
        it("updates users email in users table", async () => {
          await agencyRepository.insert(agency1);
          await insertUser(db, user1, provider);
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency1.id,
            userId: user1.id,
            roles: ["counsellor"],
            isNotifiedByEmail: false,
          });
          const updatedEmail = "new-email@email.fr";

          await userRepository.updateEmail(user1.id, updatedEmail);

          const agencyRights: AgencyRight[] = [
            {
              roles: ["counsellor"],
              agency: agency1,
              isNotifiedByEmail: false,
            },
          ];
          expectToEqual(await userRepository.getById(user1.id, provider), {
            ...user1,
            email: updatedEmail,
            establishments: [],
            agencyRights: agencyRights,
            ...withEmptyDashboards,
          });
        });
      });

      describe("getUsers", () => {
        it("returns no users when emailContains is empty string", async () => {
          const users = await userRepository.getUsers({ emailContains: "" });
          expectToEqual(users, []);
        });

        it("returns all the users with email matching filter", async () => {
          const userNotIcConnected: User = {
            ...user,
            firstName: "",
            lastName: "",
            externalId: null,
          };
          await agencyRepository.insert(agency1);
          await insertUser(db, user1, "InclusionConnect");
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency1.id,
            userId: user1.id,
            roles: ["counsellor"],
            isNotifiedByEmail: false,
          });

          await insertUser(db, user2, "ProConnect");
          await insertUser(db, userNotIcConnected, null);

          const users = await userRepository.getUsers({ emailContains: "j" });
          expectToEqual(users, [
            { ...user2, numberOfAgencies: 0 },
            { ...userNotIcConnected, numberOfAgencies: 0 },
            { ...user1, numberOfAgencies: 1 },
          ]);
        });
      });

      describe("getIcUsersWithFilters", () => {
        it("returns empty array if no filters are given", async () => {
          await Promise.all([
            agencyRepository.insert(agency1),
            insertUser(db, user1, provider),
          ]);

          await insertAgencyRegistrationToUser(db, {
            agencyId: agency1.id,
            userId: user1.id,
            roles: ["to-review"],
            isNotifiedByEmail: false,
          });

          const icUsers = await userRepository.getIcUsersWithFilter(
            {},
            provider,
          );
          expect(icUsers).toEqual([]);
        });

        it("fetches connected users with status 'to-review'", async () => {
          await agencyRepository.insert(agency1);
          await agencyRepository.insert(agency2);
          await insertUser(db, user1, provider);
          await insertUser(db, user2, provider);
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency1.id,
            userId: user1.id,
            roles: ["to-review"],
            isNotifiedByEmail: false,
          });
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency2.id,
            userId: user1.id,
            roles: ["validator"],
            isNotifiedByEmail: false,
          });
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency2.id,
            userId: user2.id,
            roles: ["to-review"],
            isNotifiedByEmail: false,
          });

          const icUsers = await userRepository.getIcUsersWithFilter(
            {
              agencyRole: "to-review",
            },
            provider,
          );

          expectArraysToEqualIgnoringOrder(icUsers, [
            {
              ...user1,
              establishments: [],
              agencyRights: [
                {
                  agency: agency1,
                  roles: ["to-review"],
                  isNotifiedByEmail: false,
                },
                {
                  agency: agency2,
                  roles: ["validator"],
                  isNotifiedByEmail: false,
                },
              ],
              ...withEmptyDashboards,
            },
            {
              ...user2,
              establishments: [],
              agencyRights: [
                {
                  agency: agency2,
                  roles: ["to-review"],
                  isNotifiedByEmail: false,
                },
              ],
              ...withEmptyDashboards,
            },
          ]);
        });

        it("fetches connected users given its status 'validator' and agencyId", async () => {
          await agencyRepository.insert(agency1);
          await agencyRepository.insert(agency2);
          await insertUser(db, user1, provider);
          await insertUser(db, user2, provider);
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency1.id,
            userId: user1.id,
            roles: ["validator"],
            isNotifiedByEmail: false,
          });
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency1.id,
            userId: user2.id,
            roles: ["to-review"],
            isNotifiedByEmail: false,
          });
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency2.id,
            userId: user1.id,
            roles: ["validator"],
            isNotifiedByEmail: false,
          });

          const icUsers = await userRepository.getIcUsersWithFilter(
            {
              agencyRole: "validator",
              agencyId: agency1.id,
            },
            provider,
          );

          expectArraysToEqualIgnoringOrder(
            icUsers.map((icUser) => icUser.email),
            [user1.email, defaultValidator.email],
          );

          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const icUser1 = icUsers.find((u) => u.email === user1.email)!;
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const icDefaultValidator = icUsers.find(
            (u) => u.email === defaultValidator.email,
          )!;

          expectToEqual(icUser1.agencyRights, [
            {
              roles: ["validator"],
              agency: agency1,
              isNotifiedByEmail: false,
            },
          ]);

          expectToEqual(icDefaultValidator.agencyRights, [
            {
              roles: ["validator"],
              agency: agency1,
              isNotifiedByEmail: true,
            },
          ]);
        });

        it("fetches connected users given email", async () => {
          await agencyRepository.insert(agency1);
          await insertUser(db, user1, provider);
          await insertUser(db, user2, provider);
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency1.id,
            userId: user1.id,
            roles: ["validator"],
            isNotifiedByEmail: false,
          });
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency1.id,
            userId: user2.id,
            roles: ["to-review"],
            isNotifiedByEmail: true,
          });

          const icUsers = await userRepository.getIcUsersWithFilter(
            {
              email: user1.email,
            },
            provider,
          );

          expectArraysToEqualIgnoringOrder(icUsers, [
            {
              ...user1,
              establishments: [],
              agencyRights: [
                {
                  agency: agency1,
                  roles: ["validator"],
                  isNotifiedByEmail: false,
                },
              ],
              ...withEmptyDashboards,
            },
          ]);
        });

        it("fetches connected users given its status, agencyId and notifiedByEmail", async () => {
          await agencyRepository.insert(agency1);
          await agencyRepository.insert(agency2);
          await insertUser(db, user1, provider);
          await insertUser(db, user2, provider);
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency1.id,
            userId: user1.id,
            roles: ["validator"],
            isNotifiedByEmail: false,
          });
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency1.id,
            userId: user2.id,
            roles: ["to-review"],
            isNotifiedByEmail: false,
          });
          await insertAgencyRegistrationToUser(db, {
            agencyId: agency2.id,
            userId: user1.id,
            roles: ["validator"],
            isNotifiedByEmail: false,
          });

          const icUsers = await userRepository.getIcUsersWithFilter(
            {
              agencyRole: "validator",
              agencyId: agency1.id,
              isNotifiedByEmail: false,
            },
            provider,
          );

          expectArraysToEqualIgnoringOrder(
            icUsers.map((icUser) => icUser.email),
            [user1.email],
          );

          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const icUser1 = icUsers.find((u) => u.email === user1.email)!;

          expectToEqual(icUser1.agencyRights, [
            {
              roles: ["validator"],
              agency: agency1,
              isNotifiedByEmail: false,
            },
          ]);
        });
      });

      describe("delete", () => {
        it("deletes an existing user", async () => {
          await insertUser(db, user1, provider);
          await agencyRepository.insert(agency1);
          await insertAgencyRegistrationToUser(db, {
            userId: user1.id,
            agencyId: agency1.id,
            roles: ["validator"],
            isNotifiedByEmail: false,
          });
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
    },
  );
});

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

const defaultValidator: User = {
  id: "will-be-erased-by-the-DB-uuid-on-creation",
  email: defaultValidatorEmail,
  firstName: "",
  lastName: "",
  createdAt: new Date().toISOString(),
  externalId: null,
};

const withEmptyDashboards = {
  dashboards: {
    agencies: {},
    establishments: {},
  },
};

const agency1 = new AgencyDtoBuilder()
  .withValidatorEmails([defaultValidator.email])
  .withId("11111111-1111-4bbb-1111-111111111111")
  .withName("Agence 1")
  .build();
const agency2 = new AgencyDtoBuilder()
  .withValidatorEmails([defaultValidator.email])
  .withId("22222222-2222-4bbb-2222-222222222222")
  .withName("Agence 2")
  .withKind("cci")
  .build();

const insertUser = async (
  db: KyselyDb,
  { id, email, firstName, lastName, externalId, createdAt }: User,
  provider: OAuthGatewayProvider | null,
) => {
  const icProvider =
    provider === "InclusionConnect"
      ? { inclusion_connect_sub: externalId }
      : {};
  const proConnectProvider =
    provider === "ProConnect" ? { pro_connect_sub: externalId } : {};

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

const insertAgencyRegistrationToUser = async (
  db: KyselyDb,
  {
    userId,
    agencyId,
    roles,
    isNotifiedByEmail,
  }: {
    userId: UserId;
    agencyId: AgencyId;
    roles: AgencyRole[];
    isNotifiedByEmail: boolean;
  },
) => {
  await db
    .insertInto("users__agencies")
    .values({
      user_id: userId,
      agency_id: agencyId,
      roles: JSON.stringify(roles),
      is_notified_by_email: isNotifiedByEmail,
    })
    .execute();
};
