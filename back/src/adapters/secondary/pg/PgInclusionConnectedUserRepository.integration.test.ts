import { Pool, PoolClient } from "pg";
import { AgencyDtoBuilder, expectToEqual } from "shared";
import { AuthenticatedUser } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import {
  AgencyRight,
  InclusionConnectedUser,
} from "../../../domain/dashboard/entities/InclusionConnectedUser";
import { PgAgencyRepository } from "./PgAgencyRepository";
import { PgInclusionConnectedUserRepository } from "./PgInclusionConnectedUserRepository";

const authenticatedUser: AuthenticatedUser = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@mail.com",
};

describe("PgInclusionConnectedUserQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let inclusionConnectQueries: PgInclusionConnectedUserRepository;
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
    await client.query("DELETE FROM conventions");
    await client.query("DELETE FROM agencies");
    inclusionConnectQueries = new PgInclusionConnectedUserRepository(client);
    agencyRepository = new PgAgencyRepository(client);
  });

  describe("getById", () => {
    it("gets the Inclusion Connected User from its Id when no agency is connected", async () => {
      await insertAuthenticatedUser(authenticatedUser);
      const inclusionConnectedUser = await inclusionConnectQueries.getById(
        authenticatedUser.id,
      );
      expectToEqual(inclusionConnectedUser, {
        ...authenticatedUser,
        agencyRights: [],
      });
    });

    it("gets the Inclusion Connected User from its Id with the connected agencies", async () => {
      const agency1 = new AgencyDtoBuilder()
        .withId("1111aaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
        .withName("Agence 1")
        .build();
      const agency2 = new AgencyDtoBuilder()
        .withId("2222aaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
        .withName("Agence 2")
        .build();

      await Promise.all([
        await agencyRepository.insert(agency1),
        await agencyRepository.insert(agency2),
        await insertAuthenticatedUser(authenticatedUser),
      ]);

      const userId = authenticatedUser.id;

      // create the link between the user and the agencies
      await client.query(
        `INSERT INTO users__agencies VALUES 
        ('${userId}', '${agency1.id}', 'toReview'),
        ('${userId}', '${agency2.id}', 'validator');
        `,
      );

      const inclusionConnectedUser = await inclusionConnectQueries.getById(
        authenticatedUser.id,
      );
      expectToEqual(inclusionConnectedUser, {
        ...authenticatedUser,
        agencyRights: [
          { agency: agency1, role: "toReview" },
          { agency: agency2, role: "validator" },
        ] satisfies AgencyRight[],
      });
    });

    describe("addAgencyToUser", () => {
      it("adds an element in users__agencies table", async () => {
        const agency = new AgencyDtoBuilder().withName("Agence 1").build();
        await agencyRepository.insert(agency);
        await insertAuthenticatedUser(authenticatedUser);
        const icUserToSave: InclusionConnectedUser = {
          ...authenticatedUser,
          agencyRights: [{ role: "counsellor", agency }],
        };

        await inclusionConnectQueries.update(icUserToSave);

        const savedIcUser = await inclusionConnectQueries.getById(
          authenticatedUser.id,
        );
        expectToEqual(savedIcUser, icUserToSave);
      });
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
});
