import { Pool } from "pg";
import {
  AgencyDtoBuilder,
  AgencyId,
  AgencyRole,
  InclusionConnectedUser,
  User,
  UserId,
  expectArraysToEqualIgnoringOrder,
  expectToEqual,
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
import { PgInclusionConnectedUserRepository } from "./PgInclusionConnectedUserRepository";

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
  lastName: "Doe",
  email: "jane.doe@mail.com",
  externalId: "jane-external-id",
  createdAt: new Date().toISOString(),
};

const agency1 = new AgencyDtoBuilder()
  .withId("11111111-1111-4bbb-1111-111111111111")
  .withName("Agence 1")
  .build();
const agency2 = new AgencyDtoBuilder()
  .withId("22222222-2222-4bbb-2222-222222222222")
  .withName("Agence 2")
  .withKind("cci")
  .build();

describe("PgInclusionConnectedUserRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let icUserRepository: PgInclusionConnectedUserRepository;
  let agencyRepository: PgAgencyRepository;

  beforeAll(() => {
    pool = getTestPgPool();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    db = makeKyselyDb(pool);

    await db.deleteFrom("users_ongoing_oauths").execute();
    await db.deleteFrom("users_admins").execute();
    await db.deleteFrom("users").execute();
    await db.deleteFrom("users__agencies").execute();
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agency_groups").execute();
    await db.deleteFrom("agencies").execute();
    await db.deleteFrom("establishments").execute();
    await db.deleteFrom("establishments_contacts").execute();
    await db.deleteFrom("immersion_offers").execute();

    icUserRepository = new PgInclusionConnectedUserRepository(db);
    agencyRepository = new PgAgencyRepository(db);
  });

  describe("getById", () => {
    describe("when no agency is connected", () => {
      it("gets the Inclusion Connected User from its Id", async () => {
        await insertUser(user1);
        await db
          .insertInto("users_admins")
          .values({ user_id: user1.id })
          .execute();
        const adminUser = await icUserRepository.getById(user1.id);
        expectToEqual(adminUser, {
          ...user1,
          establishments: [],
          agencyRights: [],
          dashboards: {
            agencies: {},
            establishments: {},
          },
          isBackofficeAdmin: true,
        });
      });

      it("gets the inclusion connected User with admin right for admins", async () => {
        await insertUser(user1);
        const inclusionConnectedUser = await icUserRepository.getById(user1.id);
        expectToEqual(inclusionConnectedUser, {
          ...user1,
          establishments: [],
          agencyRights: [],
          dashboards: {
            agencies: {},
            establishments: {},
          },
        });
      });
    });

    it("gets the Inclusion Connected User from its Id with the connected agencies", async () => {
      await Promise.all([
        await agencyRepository.insert(agency1),
        await agencyRepository.insert(agency2),
        await insertUser(user1),
      ]);

      const userId = user1.id;

      // create the link between the user and the agencies

      await insertAgencyRegistrationToUser({
        agencyId: agency1.id,
        userId,
        role: "toReview",
      });
      await insertAgencyRegistrationToUser({
        agencyId: agency2.id,
        userId,
        role: "validator",
      });

      const inclusionConnectedUser = await icUserRepository.getById(user1.id);
      expectToEqual(inclusionConnectedUser, {
        ...user1,
        establishments: [],
        agencyRights: [
          { agency: agency1, role: "toReview" },
          { agency: agency2, role: "validator" },
        ],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      });
    });

    it("gets the icUser with the connected establishments when they exist", async () => {
      const customizedEstablishmentName = "My awsome name";
      const establishment = new EstablishmentAggregateBuilder()
        .withEstablishmentCustomizedName(customizedEstablishmentName)
        .withContact(new ContactEntityBuilder().withEmail(user1.email).build())
        .build();

      const establishmentRepository = new PgEstablishmentAggregateRepository(
        db,
      );

      await establishmentRepository.insertEstablishmentAggregate(establishment);
      await insertUser(user1);
      await db
        .insertInto("users_admins")
        .values({ user_id: user1.id })
        .execute();
      const adminUser = await icUserRepository.getById(user1.id);
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
            siret: establishment.establishment.siret,
            businessName: customizedEstablishmentName,
          },
        ],
      });
    });

    describe("addAgencyToUser", () => {
      it("adds an element in users__agencies table", async () => {
        await agencyRepository.insert(agency1);
        await insertUser(user1);
        const icUserToSave: InclusionConnectedUser = {
          ...user1,
          establishments: [],
          agencyRights: [{ role: "counsellor", agency: agency1 }],
          dashboards: {
            agencies: {},
            establishments: {},
          },
        };

        await icUserRepository.update(icUserToSave);

        const savedIcUser = await icUserRepository.getById(user1.id);
        expectToEqual(savedIcUser, icUserToSave);
      });

      it("Delete an element in users__agencies table when no agency rights are provided", async () => {
        await agencyRepository.insert(agency1);
        await insertUser(user1);
        const icUserToSave: InclusionConnectedUser = {
          ...user1,
          establishments: [],
          agencyRights: [],
          dashboards: {
            agencies: {},
            establishments: {},
          },
        };

        await icUserRepository.update(icUserToSave);

        const savedIcUser = await icUserRepository.getById(user1.id);
        expectToEqual(savedIcUser, icUserToSave);
      });

      it("Delete just one element in users__agencies table when two agency rights are provided", async () => {
        await agencyRepository.insert(agency1);
        await agencyRepository.insert(agency2);

        await insertUser(user1);

        const icUserToSave: InclusionConnectedUser = {
          ...user1,
          establishments: [],
          agencyRights: [
            { agency: agency1, role: "validator" },
            { agency: agency2, role: "toReview" },
          ],
          dashboards: {
            agencies: {},
            establishments: {},
          },
        };

        await icUserRepository.update(icUserToSave);

        const savedIcUser = await icUserRepository.getById(user1.id);

        expectToEqual(savedIcUser, icUserToSave);

        const updatedIcUserToSave: InclusionConnectedUser = {
          ...user1,
          establishments: [],
          agencyRights: [{ agency: agency1, role: "validator" }],
          dashboards: {
            agencies: {},
            establishments: {},
          },
        };

        await icUserRepository.update(updatedIcUserToSave);

        const updatedSavedIcUser = await icUserRepository.getById(user1.id);
        expectToEqual(updatedSavedIcUser, updatedIcUserToSave);
      });
    });
  });

  describe("getWithFilters", () => {
    it("returns empty array if no filters are given", async () => {
      await Promise.all([agencyRepository.insert(agency1), insertUser(user1)]);

      await insertAgencyRegistrationToUser({
        agencyId: agency1.id,
        userId: user1.id,
        role: "toReview",
      });

      const icUsers = await icUserRepository.getWithFilter({});
      expect(icUsers).toEqual([]);
    });

    it("fetches Inclusion Connected Users with status 'toReview'", async () => {
      await agencyRepository.insert(agency1);
      await agencyRepository.insert(agency2);
      await insertUser(user1);
      await insertUser(user2);
      await insertAgencyRegistrationToUser({
        agencyId: agency1.id,
        userId: user1.id,
        role: "toReview",
      });
      await insertAgencyRegistrationToUser({
        agencyId: agency2.id,
        userId: user1.id,
        role: "validator",
      });
      await insertAgencyRegistrationToUser({
        agencyId: agency2.id,
        userId: user2.id,
        role: "toReview",
      });

      const icUsers = await icUserRepository.getWithFilter({
        agencyRole: "toReview",
      });

      expectArraysToEqualIgnoringOrder(icUsers, [
        {
          ...user1,
          establishments: [],
          agencyRights: [
            { agency: agency1, role: "toReview" },
            { agency: agency2, role: "validator" },
          ],
          dashboards: {
            agencies: {},
            establishments: {},
          },
        },
        {
          ...user2,
          establishments: [],
          agencyRights: [{ agency: agency2, role: "toReview" }],
          dashboards: {
            agencies: {},
            establishments: {},
          },
        },
      ]);
    });

    it("fetches inclusion connected users given its status 'validator' and agencyId", async () => {
      await agencyRepository.insert(agency1);
      await agencyRepository.insert(agency2);
      await insertUser(user1);
      await insertUser(user2);
      await insertAgencyRegistrationToUser({
        agencyId: agency1.id,
        userId: user1.id,
        role: "validator",
      });
      await insertAgencyRegistrationToUser({
        agencyId: agency1.id,
        userId: user2.id,
        role: "toReview",
      });
      await insertAgencyRegistrationToUser({
        agencyId: agency2.id,
        userId: user1.id,
        role: "validator",
      });

      const icUsers = await icUserRepository.getWithFilter({
        agencyRole: "validator",
        agencyId: agency1.id,
      });

      expectArraysToEqualIgnoringOrder(icUsers, [
        {
          ...user1,
          establishments: [],
          agencyRights: [{ agency: agency1, role: "validator" }],
          dashboards: {
            agencies: {},
            establishments: {},
          },
        },
      ]);
    });
  });

  const insertUser = async ({
    id,
    email,
    firstName,
    lastName,
    externalId,
    createdAt,
  }: User) => {
    await db
      .insertInto("users")
      .values({
        id,
        email,
        first_name: firstName,
        last_name: lastName,
        external_id: externalId,
        created_at: createdAt,
      })
      .execute();
  };

  const insertAgencyRegistrationToUser = async ({
    userId,
    agencyId,
    role,
  }: {
    userId: UserId;
    agencyId: AgencyId;
    role: AgencyRole;
  }) => {
    await db
      .insertInto("users__agencies")
      .values({
        user_id: userId,
        agency_id: agencyId,
        role,
      })
      .execute();
  };
});
