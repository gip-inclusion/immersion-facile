import { Pool } from "pg";
import {
  AgencyDtoBuilder,
  AgencyId,
  AgencyRole,
  InclusionConnectedUser,
  User,
  UserId,
  defaultValidatorEmail,
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
          ...withEmptyDashboards,
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
          ...withEmptyDashboards,
        });
      });
    });

    it("gets the Inclusion Connected User from its Id with the connected agencies", async () => {
      await Promise.all([
        await agencyRepository.insert(agency1),
        await agencyRepository.insert(agency2),
        await insertUser(user1),
      ]);

      // create the link between the user and the agencies
      await insertAgencyRegistrationToUser({
        agencyId: agency1.id,
        userId: user1.id,
        role: "toReview",
        isNotifiedByEmail: false,
      });
      await insertAgencyRegistrationToUser({
        agencyId: agency2.id,
        userId: user1.id,
        role: "validator",
        isNotifiedByEmail: false,
      });

      const inclusionConnectedUser = await icUserRepository.getById(user1.id);
      expectToEqual(inclusionConnectedUser, {
        ...user1,
        establishments: [],
        agencyRights: [
          { agency: agency1, role: "toReview", isNotifiedByEmail: false },
          { agency: agency2, role: "validator", isNotifiedByEmail: false },
        ],
        ...withEmptyDashboards,
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
        const icUserToUpdate: InclusionConnectedUser = {
          ...user1,
          establishments: [],
          agencyRights: [
            { role: "counsellor", agency: agency1, isNotifiedByEmail: false },
          ],
          ...withEmptyDashboards,
        };

        await icUserRepository.updateAgencyRights({
          userId: icUserToUpdate.id,
          agencyRights: icUserToUpdate.agencyRights,
        });

        const savedIcUser = await icUserRepository.getById(user1.id);
        expectToEqual(savedIcUser, icUserToUpdate);
      });

      it("Delete an element in users__agencies table when no agency rights are provided", async () => {
        await agencyRepository.insert(agency1);
        await insertUser(user1);
        const icUserToSave: InclusionConnectedUser = {
          ...user1,
          establishments: [],
          agencyRights: [],
          ...withEmptyDashboards,
        };

        await icUserRepository.updateAgencyRights({
          userId: icUserToSave.id,
          agencyRights: icUserToSave.agencyRights,
        });

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
            { agency: agency1, role: "validator", isNotifiedByEmail: false },
            { agency: agency2, role: "toReview", isNotifiedByEmail: false },
          ],
          ...withEmptyDashboards,
        };

        await icUserRepository.updateAgencyRights({
          userId: icUserToSave.id,
          agencyRights: icUserToSave.agencyRights,
        });

        const savedIcUser = await icUserRepository.getById(user1.id);

        expectToEqual(savedIcUser, icUserToSave);

        const updatedIcUserToSave: InclusionConnectedUser = {
          ...user1,
          establishments: [],
          agencyRights: [
            { agency: agency1, role: "validator", isNotifiedByEmail: false },
          ],
          ...withEmptyDashboards,
        };

        await icUserRepository.updateAgencyRights({
          userId: updatedIcUserToSave.id,
          agencyRights: updatedIcUserToSave.agencyRights,
        });

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
        isNotifiedByEmail: false,
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
        isNotifiedByEmail: false,
      });
      await insertAgencyRegistrationToUser({
        agencyId: agency2.id,
        userId: user1.id,
        role: "validator",
        isNotifiedByEmail: false,
      });
      await insertAgencyRegistrationToUser({
        agencyId: agency2.id,
        userId: user2.id,
        role: "toReview",
        isNotifiedByEmail: false,
      });

      const icUsers = await icUserRepository.getWithFilter({
        agencyRole: "toReview",
      });

      expectArraysToEqualIgnoringOrder(icUsers, [
        {
          ...user1,
          establishments: [],
          agencyRights: [
            { agency: agency1, role: "toReview", isNotifiedByEmail: false },
            { agency: agency2, role: "validator", isNotifiedByEmail: false },
          ],
          ...withEmptyDashboards,
        },
        {
          ...user2,
          establishments: [],
          agencyRights: [
            { agency: agency2, role: "toReview", isNotifiedByEmail: false },
          ],
          ...withEmptyDashboards,
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
        isNotifiedByEmail: false,
      });
      await insertAgencyRegistrationToUser({
        agencyId: agency1.id,
        userId: user2.id,
        role: "toReview",
        isNotifiedByEmail: false,
      });
      await insertAgencyRegistrationToUser({
        agencyId: agency2.id,
        userId: user1.id,
        role: "validator",
        isNotifiedByEmail: false,
      });

      const icUsers = await icUserRepository.getWithFilter({
        agencyRole: "validator",
        agencyId: agency1.id,
      });

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
          role: "validator",
          agency: agency1,
          isNotifiedByEmail: false,
        },
      ]);

      expectToEqual(icDefaultValidator.agencyRights, [
        {
          role: "validator",
          agency: agency1,
          isNotifiedByEmail: true,
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
    isNotifiedByEmail,
  }: {
    userId: UserId;
    agencyId: AgencyId;
    role: AgencyRole;
    isNotifiedByEmail: boolean;
  }) => {
    await db
      .insertInto("users__agencies")
      .values({
        user_id: userId,
        agency_id: agencyId,
        role,
        is_notified_by_email: isNotifiedByEmail,
      })
      .execute();
  };
});
