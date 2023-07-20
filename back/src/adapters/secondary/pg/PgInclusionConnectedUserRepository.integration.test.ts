import { Kysely, PostgresDialect } from "kysely";
import { Pool, PoolClient } from "pg";
import {
  AgencyDtoBuilder,
  AgencyId,
  AgencyRight,
  AgencyRole,
  AuthenticatedUser,
  AuthenticatedUserId,
  expectArraysToEqualIgnoringOrder,
  expectToEqual,
  InclusionConnectedUser,
} from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { ImmersionDatabase } from "./sql/database";
import { PgAgencyRepository } from "./PgAgencyRepository";
import { PgInclusionConnectedUserRepository } from "./PgInclusionConnectedUserRepository";

const authenticatedUser1: AuthenticatedUser = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@mail.com",
};

const authenticatedUser2: AuthenticatedUser = {
  id: "44444444-4444-4444-4444-444444444444",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@mail.com",
};

const agency1 = new AgencyDtoBuilder()
  .withId("11111111-1111-4bbb-1111-111111111111")
  .withName("Agence 1")
  .build();

const agency2 = new AgencyDtoBuilder()
  .withId("22222222-2222-4bbb-2222-222222222222")
  .withName("Agence 2")
  .build();

describe("PgInclusionConnectedUserRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let icUserRepository: PgInclusionConnectedUserRepository;
  let agencyRepository: PgAgencyRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM authenticated_users");
    await client.query("DELETE FROM users__agencies");
    await client.query("DELETE FROM conventions");
    await client.query("DELETE FROM agencies");
    icUserRepository = new PgInclusionConnectedUserRepository(client);
    agencyRepository = new PgAgencyRepository(
      new Kysely<ImmersionDatabase>({
        dialect: new PostgresDialect({ pool }),
      }),
    );
  });

  describe("getById", () => {
    it("gets the Inclusion Connected User from its Id when no agency is connected", async () => {
      await insertAuthenticatedUser(authenticatedUser1);
      const inclusionConnectedUser = await icUserRepository.getById(
        authenticatedUser1.id,
      );
      expectToEqual(inclusionConnectedUser, {
        ...authenticatedUser1,
        agencyRights: [],
      });
    });

    it("gets the Inclusion Connected User from its Id with the connected agencies", async () => {
      await Promise.all([
        await agencyRepository.insert(agency1),
        await agencyRepository.insert(agency2),
        await insertAuthenticatedUser(authenticatedUser1),
      ]);

      const userId = authenticatedUser1.id;

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

      const inclusionConnectedUser = await icUserRepository.getById(
        authenticatedUser1.id,
      );
      expectToEqual(inclusionConnectedUser, {
        ...authenticatedUser1,
        agencyRights: [
          { agency: agency1, role: "toReview" },
          { agency: agency2, role: "validator" },
        ] satisfies AgencyRight[],
      });
    });

    describe("addAgencyToUser", () => {
      it("adds an element in users__agencies table", async () => {
        await agencyRepository.insert(agency1);
        await insertAuthenticatedUser(authenticatedUser1);
        const icUserToSave: InclusionConnectedUser = {
          ...authenticatedUser1,
          agencyRights: [{ role: "counsellor", agency: agency1 }],
        };

        await icUserRepository.update(icUserToSave);

        const savedIcUser = await icUserRepository.getById(
          authenticatedUser1.id,
        );
        expectToEqual(savedIcUser, icUserToSave);
      });
    });
  });

  describe("getWithFilters", () => {
    it("returns empty array if no filters are given", async () => {
      await Promise.all([
        agencyRepository.insert(agency1),
        insertAuthenticatedUser(authenticatedUser1),
      ]);

      await insertAgencyRegistrationToUser({
        agencyId: agency1.id,
        userId: authenticatedUser1.id,
        role: "toReview",
      });

      const icUsers = await icUserRepository.getWithFilter({});
      expect(icUsers).toEqual([]);
    });

    it("fetches Inclusion Connected Users with status 'toReview'", async () => {
      await Promise.all([
        agencyRepository.insert(agency1),
        agencyRepository.insert(agency2),
        insertAuthenticatedUser(authenticatedUser1),
        insertAuthenticatedUser(authenticatedUser2),
      ]);

      await Promise.all([
        insertAgencyRegistrationToUser({
          agencyId: agency1.id,
          userId: authenticatedUser1.id,
          role: "toReview",
        }),
        insertAgencyRegistrationToUser({
          agencyId: agency2.id,
          userId: authenticatedUser1.id,
          role: "validator",
        }),
        insertAgencyRegistrationToUser({
          agencyId: agency2.id,
          userId: authenticatedUser2.id,
          role: "toReview",
        }),
      ]);

      const icUsers = await icUserRepository.getWithFilter({
        agencyRole: "toReview",
      });

      expectArraysToEqualIgnoringOrder(icUsers, [
        {
          ...authenticatedUser1,
          agencyRights: [
            { agency: agency1, role: "toReview" },
            { agency: agency2, role: "validator" },
          ],
        },
        {
          ...authenticatedUser2,
          agencyRights: [{ agency: agency2, role: "toReview" }],
        },
      ]);
    });
  });

  const insertAuthenticatedUser = async ({
    id,
    email,
    firstName,
    lastName,
  }: AuthenticatedUser) =>
    client.query(
      `
      INSERT INTO authenticated_users(id, email, first_name, last_name) VALUES ($1, $2, $3, $4 )
      `,
      [id, email, firstName, lastName],
    );

  const insertAgencyRegistrationToUser = async ({
    userId,
    agencyId,
    role,
  }: {
    userId: AuthenticatedUserId;
    agencyId: AgencyId;
    role: AgencyRole;
  }) =>
    client.query(
      `
      INSERT INTO users__agencies(user_id, agency_id, role) VALUES ($1, $2, $3)
      `,
      [userId, agencyId, role],
    );
});
