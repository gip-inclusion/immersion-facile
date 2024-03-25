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
import { PgInclusionConnectedUserRepository } from "./PgInclusionConnectedUserRepository";

const user1: User = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@mail.com",
  externalId: "john-external-id",
};

const user2: User = {
  id: "44444444-4444-4444-4444-444444444444",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@mail.com",
  externalId: "jane-external-id",
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

  beforeAll(async () => {
    pool = getTestPgPool();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    db = makeKyselyDb(pool);

    await db.deleteFrom("users_ongoing_oauths").execute();
    await db.deleteFrom("users").execute();
    await db.deleteFrom("users__agencies").execute();
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agency_groups").execute();
    await db.deleteFrom("agencies").execute();

    icUserRepository = new PgInclusionConnectedUserRepository(db);
    agencyRepository = new PgAgencyRepository(db);
  });

  describe("getById", () => {
    it("gets the Inclusion Connected User from its Id when no agency is connected", async () => {
      await insertUser(user1);
      const inclusionConnectedUser = await icUserRepository.getById(user1.id);
      expectToEqual(inclusionConnectedUser, {
        ...user1,
        agencyRights: [],
        establishmentDashboards: {},
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
        agencyRights: [
          { agency: agency1, role: "toReview" },
          { agency: agency2, role: "validator" },
        ],
        establishmentDashboards: {},
      });
    });

    describe("addAgencyToUser", () => {
      it("adds an element in users__agencies table", async () => {
        await agencyRepository.insert(agency1);
        await insertUser(user1);
        const icUserToSave: InclusionConnectedUser = {
          ...user1,
          agencyRights: [{ role: "counsellor", agency: agency1 }],
          establishmentDashboards: {},
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
          agencyRights: [],
          establishmentDashboards: {},
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
          agencyRights: [
            { agency: agency1, role: "validator" },
            { agency: agency2, role: "toReview" },
          ],
          establishmentDashboards: {},
        };

        await icUserRepository.update(icUserToSave);

        const savedIcUser = await icUserRepository.getById(user1.id);

        expectToEqual(savedIcUser, icUserToSave);

        const updatedIcUserToSave: InclusionConnectedUser = {
          ...user1,
          agencyRights: [{ agency: agency1, role: "validator" }],
          establishmentDashboards: {},
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
      await Promise.all([
        agencyRepository.insert(agency1),
        agencyRepository.insert(agency2),
        insertUser(user1),
        insertUser(user2),
      ]);

      await Promise.all([
        insertAgencyRegistrationToUser({
          agencyId: agency1.id,
          userId: user1.id,
          role: "toReview",
        }),
        insertAgencyRegistrationToUser({
          agencyId: agency2.id,
          userId: user1.id,
          role: "validator",
        }),
        insertAgencyRegistrationToUser({
          agencyId: agency2.id,
          userId: user2.id,
          role: "toReview",
        }),
      ]);

      const icUsers = await icUserRepository.getWithFilter({
        agencyRole: "toReview",
      });

      expectArraysToEqualIgnoringOrder(icUsers, [
        {
          ...user1,
          agencyRights: [
            { agency: agency1, role: "toReview" },
            { agency: agency2, role: "validator" },
          ],
          establishmentDashboards: {},
        },
        {
          ...user2,
          agencyRights: [{ agency: agency2, role: "toReview" }],
          establishmentDashboards: {},
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
  }: User) => {
    await db
      .insertInto("users")
      .values({
        id,
        email,
        first_name: firstName,
        last_name: lastName,
        external_id: externalId,
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
