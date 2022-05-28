import { Pool, PoolClient } from "pg";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";
import { expectObjectsToMatch } from "../../_testBuilders/test.helpers";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { PgConventionPoleEmploiAdvisorRepository } from "../../adapters/secondary/pg/PgConventionPoleEmploiAdvisorRepository";
import { PgImmersionApplicationRepository } from "../../adapters/secondary/pg/PgImmersionApplicationRepository";
import { PoleEmploiUserAdvisorDTO } from "../../domain/peConnect/dto/PeConnect.dto";

const conventionId = "88401348-bad9-4933-87c6-405b8a8fe4cc";
const userPeExternalId = "aaaaac99-9c0b-bbbb-bb6d-6bb9bd38aaad";

const immersionApplicationEntity = new ImmersionApplicationEntityBuilder()
  .withId(conventionId)
  .build();

const poleEmploiFirstUserAdvisor: PoleEmploiUserAdvisorDTO = {
  userPeExternalId,
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean.dupont@pole-emploi.fr",
  type: "PLACEMENT",
};

const poleEmploiUpdatedUserAdvisor: PoleEmploiUserAdvisorDTO = {
  userPeExternalId,
  firstName: "Jeanne",
  lastName: "Delamare",
  email: "jeanne.delamare@pole-emploi.fr",
  type: "CAPEMPLOI",
};

describe("PgConventionPoleEmploiAdvisorRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let conventionPoleEmploiAdvisorRepository: PgConventionPoleEmploiAdvisorRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    await client.query("DELETE FROM partners_pe_connect");
    // REVIEW I had to add this not to have an error
    // TODO Remove when https://git.beta.pole-emploi.fr/jburkard/immersion-facile/-/merge_requests/967 is merged ?
    await client.query("DELETE FROM immersion_assessments");
    await client.query("DELETE FROM immersion_applications");
    await client.query("DELETE FROM agencies");
    const agencyRepository = new PgAgencyRepository(client);
    await agencyRepository.insert(AgencyConfigBuilder.create().build());
    const immersionApplicationRepository = new PgImmersionApplicationRepository(
      client,
    );
    await immersionApplicationRepository.save(immersionApplicationEntity);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM partners_pe_connect");
    conventionPoleEmploiAdvisorRepository =
      new PgConventionPoleEmploiAdvisorRepository(client);
  });

  describe("openSlotForNextConvention", () => {
    it("should open a slot if no open slot is present", async () => {
      await conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
        poleEmploiFirstUserAdvisor,
      );
      const inDb = await client.query("SELECT * FROM partners_pe_connect");
      expect(inDb.rows).toHaveLength(1);
      expectObjectsToMatch(inDb.rows[0], {
        user_pe_external_id: poleEmploiFirstUserAdvisor.userPeExternalId,
        convention_id: "00000000-0000-0000-0000-000000000000",
        firstname: poleEmploiFirstUserAdvisor.firstName,
        lastname: poleEmploiFirstUserAdvisor.lastName,
        email: poleEmploiFirstUserAdvisor.email,
        type: poleEmploiFirstUserAdvisor.type,
      });
    });

    it("should update the open slot if it already exist", async () => {
      await conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
        poleEmploiFirstUserAdvisor,
      );

      await conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
        poleEmploiUpdatedUserAdvisor,
      );

      const inDb = await client.query("SELECT * FROM partners_pe_connect");
      expect(inDb.rows).toHaveLength(1);
      expectObjectsToMatch(inDb.rows[0], {
        user_pe_external_id: poleEmploiUpdatedUserAdvisor.userPeExternalId,
        convention_id: "00000000-0000-0000-0000-000000000000",
        firstname: poleEmploiUpdatedUserAdvisor.firstName,
        lastname: poleEmploiUpdatedUserAdvisor.lastName,
        email: poleEmploiUpdatedUserAdvisor.email,
        type: poleEmploiUpdatedUserAdvisor.type,
      });
    });
  });

  describe("associateConventionAndUserAdvisor", () => {
    it("should throw a not found error if no suitable opened conventionPoleEmploiUserAdvisor is present", async () => {
      await expect(
        conventionPoleEmploiAdvisorRepository.associateConventionAndUserAdvisor(
          conventionId,
          userPeExternalId,
        ),
      ).rejects.toThrow(
        new Error("Association between convention and userAdvisor failed"),
      );
    });

    it("should update the entity in db if a suitable conventionPoleEmploiUserAdvisor was found", async () => {
      await conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
        poleEmploiFirstUserAdvisor,
      );
      await conventionPoleEmploiAdvisorRepository.associateConventionAndUserAdvisor(
        conventionId,
        userPeExternalId,
      );

      const inDb = await client.query("SELECT * FROM partners_pe_connect");
      expect(inDb.rows).toHaveLength(1);
      expectObjectsToMatch(inDb.rows[0], {
        user_pe_external_id: poleEmploiFirstUserAdvisor.userPeExternalId,
        convention_id: conventionId,
      });
    });
  });
});
