import { Pool, PoolClient } from "pg";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";
import { expectObjectsToMatch } from "../../_testBuilders/test.helpers";
import { NotFoundError } from "../../adapters/primary/helpers/httpErrors";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { PgConventionPoleEmploiAdvisorRepository } from "../../adapters/secondary/pg/PgConventionPoleEmploiAdvisorRepository";
import { PgImmersionApplicationRepository } from "../../adapters/secondary/pg/PgImmersionApplicationRepository";
import { ConventionPoleEmploiUserAdvisorEntityOpen } from "../../domain/peConnect/entities/ConventionPoleEmploiAdvisorEntity";

const conventionId = "88401348-bad9-4933-87c6-405b8a8fe4cc";
const entityId = "aaaaac99-9c0b-bbbb-bb6d-6bb9bd38aaab";
const anotherEntityId = "aaaaac99-9c0b-bbbb-bb6d-6bb9bd38aaac";
const userPeExternalId = "aaaaac99-9c0b-bbbb-bb6d-6bb9bd38aaad";

const immersionApplicationEntity = new ImmersionApplicationEntityBuilder()
  .withId(conventionId)
  .build();

const poleEmploiUserAdvisorEntity: ConventionPoleEmploiUserAdvisorEntityOpen = {
  id: entityId,
  userPeExternalId,
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean.dupont@pole-emploi.fr",
  type: "PLACEMENT",
};

describe("PgConventionPoleEmploiAdvisorRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let conventionPoleEmploiAdvisorRepository: PgConventionPoleEmploiAdvisorRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    await client.query("DELETE FROM partners_pe_connect");
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
        poleEmploiUserAdvisorEntity,
      );
      const inDb = await client.query("SELECT * FROM partners_pe_connect");
      expect(inDb.rows).toHaveLength(1);
      expectObjectsToMatch(inDb.rows[0], {
        id: poleEmploiUserAdvisorEntity.id,
        user_pe_external_id: poleEmploiUserAdvisorEntity.userPeExternalId,
        firstname: poleEmploiUserAdvisorEntity.firstName,
        lastname: poleEmploiUserAdvisorEntity.lastName,
        email: poleEmploiUserAdvisorEntity.email,
        type: poleEmploiUserAdvisorEntity.type,
      });
    });

    it("should do nothing if an already open slot exist", async () => {
      await conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
        poleEmploiUserAdvisorEntity,
      );

      await conventionPoleEmploiAdvisorRepository.openSlotForNextConvention({
        ...poleEmploiUserAdvisorEntity,
        id: anotherEntityId,
      });

      const inDb = await client.query("SELECT * FROM partners_pe_connect");
      expect(inDb.rows).toHaveLength(1);
      expectObjectsToMatch(inDb.rows[0], {
        id: poleEmploiUserAdvisorEntity.id,
        user_pe_external_id: poleEmploiUserAdvisorEntity.userPeExternalId,
        firstname: poleEmploiUserAdvisorEntity.firstName,
        lastname: poleEmploiUserAdvisorEntity.lastName,
        email: poleEmploiUserAdvisorEntity.email,
        type: poleEmploiUserAdvisorEntity.type,
      });
    });
  });

  describe("associateConventionAndUserAdvisor", () => {
    it("should throw a not found error if no suitable opened conventionPoleEmploiUserAdvisor is present", async () => {
      await conventionPoleEmploiAdvisorRepository.associateConventionAndUserAdvisor(
        conventionId,
        userPeExternalId,
      );

      expect(async () => {
        await conventionPoleEmploiAdvisorRepository.associateConventionAndUserAdvisor(
          conventionId,
          userPeExternalId,
        );
      }).toThrow(new NotFoundError());
    });

    it("should update the entity in db if an opened conventionPoleEmploiUserAdvisor was found", async () => {
      await conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
        poleEmploiUserAdvisorEntity,
      );
      await conventionPoleEmploiAdvisorRepository.associateConventionAndUserAdvisor(
        conventionId,
        userPeExternalId,
      );

      const inDb = await client.query("SELECT * FROM partners_pe_connect");
      expect(inDb.rows).toHaveLength(1);
      expectObjectsToMatch(inDb.rows[0], {
        id: poleEmploiUserAdvisorEntity.id,
        user_pe_external_id: poleEmploiUserAdvisorEntity.userPeExternalId,
        convention_id: conventionId,
      });
    });
  });
});
