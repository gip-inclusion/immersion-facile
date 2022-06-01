import { Pool, PoolClient } from "pg";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { PgImmersionApplicationQueries } from "../../adapters/secondary/pg/PgImmersionApplicationQueries";
import { PgImmersionApplicationRepository } from "../../adapters/secondary/pg/PgImmersionApplicationRepository";
import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { AgencyConfigBuilder } from "shared/src/agency/AgencyConfigBuilder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionApplicationDtoBuilder } from "shared/src/ImmersionApplication/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationRawBeforeExportVO } from "../../domain/immersionApplication/valueObjects/ImmersionApplicationRawBeforeExportVO";
import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";

describe("Pg implementation of ImmersionApplicationQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let immersionApplicationQueries: PgImmersionApplicationQueries;
  let agencyRepo: PgAgencyRepository;
  let immersionApplicationRepo: PgImmersionApplicationRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_applications");
    await client.query("DELETE FROM agencies");
    immersionApplicationQueries = new PgImmersionApplicationQueries(client);
    agencyRepo = new PgAgencyRepository(client);
    immersionApplicationRepo = new PgImmersionApplicationRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });
  describe("get for export", () => {
    it("retrieves all immersion applications exports", async () => {
      // Prepare
      const appleAgencyId = "11111111-1111-1111-1111-111111111111";
      const appleAgency = AgencyConfigBuilder.create(appleAgencyId)
        .withName("apple")
        .build();

      const immersionApplicationId: ImmersionApplicationId =
        "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";

      const immersionApplicationEntity: ImmersionApplicationEntity =
        ImmersionApplicationEntity.create(
          new ImmersionApplicationDtoBuilder()
            .withId(immersionApplicationId)
            .withDateStart(new Date("2021-01-15").toISOString())
            .withDateEnd(new Date("2021-01-20").toISOString())
            .withDateSubmission(new Date("2021-01-10").toISOString())
            .withAgencyId(appleAgencyId)
            .withoutWorkCondition()
            .build(),
        );

      await agencyRepo.insert(appleAgency);
      await immersionApplicationRepo.save(immersionApplicationEntity);

      // Act
      const actualExport: ImmersionApplicationRawBeforeExportVO[] =
        await immersionApplicationQueries.getAllApplicationsForExport();

      const {
        agencyId,
        id,
        immersionActivities,
        immersionSkills,
        individualProtection,
        sanitaryPrevention,
        sanitaryPreventionDescription,
        immersionAppellation,
        ...filteredProperties
      } = immersionApplicationEntity.properties;
      // Assert
      expect(actualExport[0]._props).toStrictEqual(
        new ImmersionApplicationRawBeforeExportVO({
          ...filteredProperties,
          agencyName: appleAgency.name,
          immersionProfession:
            immersionApplicationEntity.properties.immersionAppellation
              .appellationLabel,
          status: immersionApplicationEntity.status,
          dateEnd: new Date("2021-01-20").toISOString(),
          dateStart: new Date("2021-01-15").toISOString(),
          dateSubmission: new Date("2021-01-10").toISOString(),
        })._props,
      );
    });
  });
  describe("PG implementation of method getLatestUpdated", () => {
    beforeEach(async () => {
      const agencyRepository = new PgAgencyRepository(client);
      await agencyRepository.insert(AgencyConfigBuilder.create().build());
    });
    it("Gets saved immersion", async () => {
      const idA: ImmersionApplicationId =
        "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";
      const immersionApplicationEntityA =
        new ImmersionApplicationEntityBuilder().withId(idA).build();

      const idB: ImmersionApplicationId =
        "bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb";
      const immersionApplicationEntityB =
        new ImmersionApplicationEntityBuilder().withId(idB).build();

      await immersionApplicationRepo.save(immersionApplicationEntityA);
      await immersionApplicationRepo.save(immersionApplicationEntityB);

      const resultA = await immersionApplicationRepo.getById(idA);
      expect(resultA).toEqual(immersionApplicationEntityA);

      const resultAll = await immersionApplicationQueries.getLatestUpdated();
      expect(resultAll).toEqual([
        immersionApplicationEntityB,
        immersionApplicationEntityA,
      ]);
    });
  });
});
