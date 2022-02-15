import { Pool, PoolClient } from "pg";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { PgImmersionApplicationExportQueries } from "../../adapters/secondary/pg/PgImmersionApplicationExportQueries";
import { PgImmersionApplicationRepository } from "../../adapters/secondary/pg/PgImmersionApplicationRepository";
import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationId } from "../../shared/ImmersionApplicationDto";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationRawBeforeExportVO } from "../../domain/immersionApplication/valueObjects/ImmersionApplicationRawBeforeExportVO";

describe("Pg implementation of ImmersionApplicationExportRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let exportRepo: PgImmersionApplicationExportQueries;
  let agencyRepo: PgAgencyRepository;
  let immersionApplicationRepo: PgImmersionApplicationRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("TRUNCATE immersion_applications CASCADE; ");
    await client.query("TRUNCATE agencies CASCADE; ");
    exportRepo = new PgImmersionApplicationExportQueries(client);
    agencyRepo = new PgAgencyRepository(client);
    immersionApplicationRepo = new PgImmersionApplicationRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });
  describe("Get for export ", () => {
    it("Retrieves all immersion applications exports", async () => {
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
            .build(),
        );

      await agencyRepo.insert(appleAgency);
      await immersionApplicationRepo.save(immersionApplicationEntity);

      // Act
      const actualExport: ImmersionApplicationRawBeforeExportVO[] =
        await exportRepo.getAllApplicationsForExport();

      const {
        agencyId,
        id,
        immersionActivities,
        immersionSkills,
        individualProtection,
        sanitaryPrevention,
        sanitaryPreventionDescription,
        ...filteredProperties
      } = immersionApplicationEntity.properties;
      // Assert
      expect(actualExport[0]._props).toStrictEqual(
        new ImmersionApplicationRawBeforeExportVO({
          ...filteredProperties,
          agencyName: appleAgency.name,
          status: immersionApplicationEntity.status,
        })._props,
      );
    });

    // This should be deleted when immersion_application.agencyId is a true foreign key
    it.skip("Retrieves also application referencing agencies not in tables.", async () => {
      // Prepare
      const applicationWithOrphanAgency: ImmersionApplicationEntity =
        ImmersionApplicationEntity.create(
          new ImmersionApplicationDtoBuilder()
            .withDateStart(new Date("2021-01-15").toISOString())
            .withDateEnd(new Date("2021-01-20").toISOString())
            .withDateSubmission(new Date("2021-01-10").toISOString())
            .build(),
        );
      await immersionApplicationRepo.save(applicationWithOrphanAgency);

      // Act
      const actualExport = await exportRepo.getAllApplicationsForExport();

      // Assert
      expect(actualExport).toHaveLength(1);
      expect(actualExport[0]._props.agencyName).toBeUndefined();
    });
  });
});
